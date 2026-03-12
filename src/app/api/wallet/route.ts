import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  findRecentDuplicateDepositRequest,
  findRecentDuplicatePayoutRequest,
} from "@/lib/finance/request-dedupe";
import {
  normalizeCurrency,
  validateWalletAmount,
} from "@/lib/finance/policy";
import { LedgerEnforcementService } from "@/lib/ledger/enforcement";
import { LedgerPostingService } from "@/lib/ledger/service";
import { Currency, HoldStatus } from "@/lib/ledger/types";
import { elapsedMs, logPerf, nowMs } from "@/lib/server/perf";
import { enforceInMemoryRateLimit } from "@/lib/security/request-rate-limit";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

interface WalletSnapshot {
  wallet: {
    id: string;
    userId: string;
    balanceSYP: number;
    balanceUSD: number;
    createdAt: Date;
    updatedAt: Date;
  };
  ledgerAccount: {
    id: string;
    slug: string;
    balance: number;
  };
  totalHeld: number;
  availableBalance: number;
  debtSnapshot: Awaited<
    ReturnType<typeof LedgerEnforcementService.getDebtSnapshot>
  >;
}

function parsePositiveAmount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  if (value <= 0) {
    return null;
  }

  return Number(value);
}

function parseNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();

    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip");

  return realIp?.trim() || "unknown";
}

function enforceWalletActionRateLimit(
  request: NextRequest,
  userId: string,
  action: "deposit" | "payout"
) {
  const ip = getClientIp(request);
  const key = `wallet:${action}:${userId}:${ip}`;

  return enforceInMemoryRateLimit(
    key,
    action === "deposit" ? 6 : 4,
    60 * 1000
  );
}

async function getWalletSnapshot(userId: string): Promise<WalletSnapshot> {
  const ledgerAccount = await LedgerPostingService.getOrCreateAccount(
    `USER_${userId}_SYP`,
    userId,
    Currency.SYP
  );

  const activeHolds = await db.ledgerHold.aggregate({
    where: {
      accountId: ledgerAccount.id,
      status: HoldStatus.OPEN,
    },
    _sum: {
      amount: true,
    },
  });

  const totalHeld = activeHolds._sum.amount ?? 0;
  const availableBalance = ledgerAccount.balance - totalHeld;

  let wallet = await db.wallet.findUnique({
    where: {
      userId,
    },
  });

  if (!wallet) {
    wallet = await db.wallet.create({
      data: {
        userId,
        balanceSYP: ledgerAccount.balance,
        balanceUSD: 0,
      },
    });
  } else if (wallet.balanceSYP !== ledgerAccount.balance) {
    wallet = await db.wallet.update({
      where: {
        id: wallet.id,
      },
      data: {
        balanceSYP: ledgerAccount.balance,
      },
    });
  }

  const debtSnapshot = await LedgerEnforcementService.getDebtSnapshot(userId);

  return {
    wallet,
    ledgerAccount,
    totalHeld,
    availableBalance,
    debtSnapshot,
  };
}

async function getAuthenticatedUser(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const sessionUser = session.user as SessionUser;

  if (!sessionUser.id) {
    return {
      error: NextResponse.json({ error: "Invalid session" }, { status: 401 }),
    };
  }

  return { userId: sessionUser.id };
}

// GET /api/wallet - wallet snapshot only
export async function GET(_request: NextRequest) {
  const startedAt = nowMs();

  try {
    const sessionStartedAt = nowMs();
    const auth = await getAuthenticatedUser();
    const sessionMs = elapsedMs(sessionStartedAt);

    if ("error" in auth) {
      logPerf("api.wallet.get", {
        ok: false,
        stage: "auth",
        totalMs: elapsedMs(startedAt),
        sessionMs,
        status: 401,
      });

      return auth.error;
    }

    const snapshotStartedAt = nowMs();
    const snapshot = await getWalletSnapshot(auth.userId);
    const snapshotMs = elapsedMs(snapshotStartedAt);

    logPerf("api.wallet.get", {
      ok: true,
      totalMs: elapsedMs(startedAt),
      userId: auth.userId,
      sessionMs,
      snapshotMs,
      ledgerBalance: snapshot.ledgerAccount.balance,
      heldAmount: snapshot.totalHeld,
      availableBalance: snapshot.availableBalance,
      locked: snapshot.debtSnapshot.isLocked,
      debtCount: snapshot.debtSnapshot.details.length,
    });

    return NextResponse.json({
      success: true,
      wallet: {
        ...snapshot.wallet,
        verifiedBalance: snapshot.ledgerAccount.balance,
        availableBalance: snapshot.availableBalance,
        heldAmount: snapshot.totalHeld,
        debtDetails:
          snapshot.debtSnapshot.details.length > 0
            ? snapshot.debtSnapshot.details
            : null,
        isLocked: snapshot.debtSnapshot.isLocked,
        lockReason: snapshot.debtSnapshot.reason,
      },
    });
  } catch (error) {
    logPerf("api.wallet.get", {
      ok: false,
      totalMs: elapsedMs(startedAt),
      error: error instanceof Error ? error.message : "Unknown error",
    });

    console.error("Get wallet error:", error);

    return NextResponse.json(
      { error: "Failed to fetch wallet" },
      { status: 500 }
    );
  }
}

// POST /api/wallet - create deposit request
export async function POST(request: NextRequest) {
  const startedAt = nowMs();

  try {
    const auth = await getAuthenticatedUser();

    if ("error" in auth) {
      return auth.error;
    }

    const rateLimit = enforceWalletActionRateLimit(
      request,
      auth.userId,
      "deposit"
    );

    if (!rateLimit.ok) {
      return NextResponse.json(
        {
          error: "Too many deposit requests. Please try again later.",
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const body = await request.json();
    const amount = parsePositiveAmount(body?.amount);
    const method = parseNonEmptyString(body?.method);
    const proofUrl = parseNonEmptyString(body?.proofUrl);
    const requestNote = parseNonEmptyString(body?.requestNote);
    const currency =
      normalizeCurrency(body?.currency ?? Currency.SYP) ?? null;

    if (!amount || !method || !currency) {
      return NextResponse.json(
        { error: "Amount, method, and valid currency are required" },
        { status: 400 }
      );
    }

    try {
      validateWalletAmount(currency, "deposit", amount);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid deposit amount",
        },
        { status: 400 }
      );
    }

    const account = await LedgerPostingService.getOrCreateAccount(
      `USER_${auth.userId}_${currency}`,
      auth.userId,
      currency
    );

    const duplicateRequest = await findRecentDuplicateDepositRequest({
      userId: auth.userId,
      accountId: account.id,
      amount,
      currency,
      method,
      proofUrl,
      requestNote,
    });

    if (duplicateRequest) {
      return NextResponse.json(
        {
          error: "Duplicate deposit request detected",
          duplicateRequest,
        },
        { status: 409 }
      );
    }

    const createdRequest = await db.depositRequest.create({
      data: {
        accountId: account.id,
        userId: auth.userId,
        amount,
        currency,
        method,
        proofUrl: proofUrl ?? undefined,
        requestNote: requestNote ?? undefined,
        status: "PENDING",
      },
      select: {
        id: true,
        accountId: true,
        userId: true,
        amount: true,
        currency: true,
        method: true,
        proofUrl: true,
        requestNote: true,
        reviewNote: true,
        status: true,
        reviewedById: true,
        reviewedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logPerf("api.wallet.post", {
      ok: true,
      totalMs: elapsedMs(startedAt),
      userId: auth.userId,
      amount,
      method,
      currency,
      requestId: createdRequest.id,
    });

    return NextResponse.json({
      success: true,
      message: "Deposit request created successfully",
      depositRequest: createdRequest,
    });
  } catch (error) {
    logPerf("api.wallet.post", {
      ok: false,
      totalMs: elapsedMs(startedAt),
      error: error instanceof Error ? error.message : "Unknown error",
    });

    console.error("Create deposit request error:", error);

    return NextResponse.json(
      { error: "Failed to create deposit request" },
      { status: 500 }
    );
  }
}

// PUT /api/wallet - create payout request
export async function PUT(request: NextRequest) {
  const startedAt = nowMs();

  try {
    const auth = await getAuthenticatedUser();

    if ("error" in auth) {
      return auth.error;
    }

    const rateLimit = enforceWalletActionRateLimit(
      request,
      auth.userId,
      "payout"
    );

    if (!rateLimit.ok) {
      return NextResponse.json(
        {
          error: "Too many payout requests. Please try again later.",
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const body = await request.json();
    const amount = parsePositiveAmount(body?.amount);
    const method = parseNonEmptyString(body?.method);
    const destination = parseNonEmptyString(body?.destination);
    const requestNote = parseNonEmptyString(body?.requestNote);
    const currency =
      normalizeCurrency(body?.currency ?? Currency.SYP) ?? null;

    if (!amount || !method || !destination || !currency) {
      return NextResponse.json(
        { error: "Amount, method, destination, and valid currency are required" },
        { status: 400 }
      );
    }

    try {
      validateWalletAmount(currency, "payout", amount);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid payout amount",
        },
        { status: 400 }
      );
    }

    const snapshot = await getWalletSnapshot(auth.userId);

    if (snapshot.debtSnapshot.isLocked) {
      return NextResponse.json(
        {
          error: snapshot.debtSnapshot.reason ?? "Wallet is locked",
        },
        { status: 423 }
      );
    }

    if (snapshot.availableBalance < amount) {
      return NextResponse.json(
        { error: "Insufficient available balance" },
        { status: 400 }
      );
    }

    const duplicateRequest = await findRecentDuplicatePayoutRequest({
      userId: auth.userId,
      accountId: snapshot.ledgerAccount.id,
      amount,
      currency,
      method,
      destination,
      requestNote,
    });

    if (duplicateRequest) {
      return NextResponse.json(
        {
          error: "Duplicate payout request detected",
          duplicateRequest,
        },
        { status: 409 }
      );
    }

    const createdRequest = await db.payoutRequest.create({
      data: {
        accountId: snapshot.ledgerAccount.id,
        userId: auth.userId,
        amount,
        currency,
        method,
        destination,
        requestNote: requestNote ?? undefined,
        status: "PENDING",
      },
      select: {
        id: true,
        accountId: true,
        userId: true,
        amount: true,
        currency: true,
        method: true,
        destination: true,
        requestNote: true,
        reviewNote: true,
        status: true,
        reviewedById: true,
        reviewedAt: true,
        processedAt: true,
        completedAt: true,
        failedAt: true,
        failureReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logPerf("api.wallet.put", {
      ok: true,
      totalMs: elapsedMs(startedAt),
      userId: auth.userId,
      amount,
      method,
      currency,
      requestId: createdRequest.id,
      availableBalance: snapshot.availableBalance,
    });

    return NextResponse.json({
      success: true,
      message: "Payout request created successfully",
      payoutRequest: createdRequest,
    });
  } catch (error) {
    logPerf("api.wallet.put", {
      ok: false,
      totalMs: elapsedMs(startedAt),
      error: error instanceof Error ? error.message : "Unknown error",
    });

    console.error("Create payout request error:", error);

    return NextResponse.json(
      { error: "Failed to create payout request" },
      { status: 500 }
    );
  }
}
