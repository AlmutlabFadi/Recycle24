import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { LedgerEnforcementService } from "@/lib/ledger/enforcement";
import { LedgerPostingService } from "@/lib/ledger/service";
import { HoldStatus } from "@/lib/ledger/types";
import { elapsedMs, logPerf, nowMs } from "@/lib/server/perf";

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

async function getWalletSnapshot(userId: string): Promise<WalletSnapshot> {
  const ledgerAccount = await LedgerPostingService.getOrCreateAccount(
    `USER_${userId}_SYP`,
    userId
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

    const body = await request.json();
    const amount = parsePositiveAmount(body?.amount);
    const method = parseNonEmptyString(body?.method);
    const proofUrl = parseNonEmptyString(body?.proofUrl);
    const requestNote = parseNonEmptyString(body?.requestNote);

    if (!amount || !method) {
      return NextResponse.json(
        { error: "Amount and method are required" },
        { status: 400 }
      );
    }

    const account = await LedgerPostingService.getOrCreateAccount(
      `USER_${auth.userId}_SYP`,
      auth.userId
    );

    const createdRequest = await db.depositRequest.create({
      data: {
        accountId: account.id,
        userId: auth.userId,
        amount,
        currency: "SYP",
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

    const body = await request.json();
    const amount = parsePositiveAmount(body?.amount);
    const method = parseNonEmptyString(body?.method);
    const destination = parseNonEmptyString(body?.destination);
    const requestNote = parseNonEmptyString(body?.requestNote);

    if (!amount || !method || !destination) {
      return NextResponse.json(
        { error: "Amount, method, and destination are required" },
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

    const createdRequest = await db.payoutRequest.create({
      data: {
        accountId: snapshot.ledgerAccount.id,
        userId: auth.userId,
        amount,
        currency: "SYP",
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