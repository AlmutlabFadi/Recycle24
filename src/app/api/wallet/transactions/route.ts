import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getUserWalletCurrencySummary,
  normalizeWalletCurrency,
} from "@/lib/ledger/wallet-summary";

interface SessionUser {
  id: string;
  role?: string;
}

type WalletCurrency = "SYP" | "USD";
type ActivityStatus = "PENDING" | "COMPLETED" | "REJECTED" | "FAILED";

type UiActivityType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRANSFER"
  | "EXCHANGE"
  | "PAYMENT"
  | "REFUND";

type ActivitySourceKind =
  | "LEDGER"
  | "DEPOSIT_REQUEST"
  | "PAYOUT_REQUEST"
  | "TRANSFER_REQUEST";

interface WalletActivityItem {
  id: string;
  sourceKind: ActivitySourceKind;
  type: UiActivityType;
  rawType: string;
  status: ActivityStatus;
  direction: "CREDIT" | "DEBIT" | "NEUTRAL";
  amount: number;
  signedAmount: number;
  currency: WalletCurrency;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  entryId: string | null;
  createdAt: string;
  postedAt: string | null;
  details: Record<string, unknown> | null;
}

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? String(DEFAULT_LIMIT), 10);

  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return DEFAULT_LIMIT;
  }

  if (parsed < 1) return 1;
  if (parsed > MAX_LIMIT) return MAX_LIMIT;
  return parsed;
}

function normalizeFilter(value: string | null): string {
  return (value ?? "all").trim().toLowerCase();
}

function getStringFromJsonRecord(
  value: Prisma.JsonValue | null | undefined,
  key: string
): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, Prisma.JsonValue>;
  const field = record[key];

  return typeof field === "string" && field.trim().length > 0 ? field : null;
}

function mapLedgerEntryTypeToUiType(entryType: string): UiActivityType {
  const normalized = entryType.toUpperCase();

  if (normalized.includes("EXCHANGE")) return "EXCHANGE";
  if (normalized === "WALLET_DEPOSIT") return "DEPOSIT";
  if (normalized === "WALLET_WITHDRAWAL") return "WITHDRAWAL";
  if (normalized === "WALLET_TRANSFER" || normalized === "P2P_TRANSFER") {
    return "TRANSFER";
  }
  if (normalized === "AUCTION_REFUND" || normalized === "REWARD_PAYMENT") {
    return "REFUND";
  }

  return "PAYMENT";
}

function matchesFilter(type: UiActivityType, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "deposit") return type === "DEPOSIT";
  if (filter === "withdrawal") return type === "WITHDRAWAL";
  if (filter === "payment") {
    return type === "PAYMENT" || type === "TRANSFER" || type === "EXCHANGE";
  }
  if (filter === "refund") return type === "REFUND";
  return true;
}

function normalizeStatus(status: string | null | undefined): ActivityStatus {
  const normalized = (status ?? "").toUpperCase();

  if (normalized === "COMPLETED" || normalized === "APPROVED") {
    return "COMPLETED";
  }
  if (normalized === "REJECTED") {
    return "REJECTED";
  }
  if (
    normalized === "FAILED" ||
    normalized === "CANCELLED" ||
    normalized === "CANCELED"
  ) {
    return "FAILED";
  }

  return "PENDING";
}

function getWalletAddressForCurrency(
  wallet:
    | {
        walletAddressSYP: string | null;
        walletAddressUSD: string | null;
      }
    | null
    | undefined,
  currency: WalletCurrency
): string | null {
  if (!wallet) return null;
  return currency === "SYP" ? wallet.walletAddressSYP : wallet.walletAddressUSD;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as SessionUser;
    const sessionUserId = sessionUser.id;
    const sessionUserRole = (sessionUser.role ?? "").toUpperCase();

    const { searchParams } = new URL(request.url);

    const requestedUserId = searchParams.get("userId")?.trim() || null;
    const filter = normalizeFilter(searchParams.get("type"));
    const limit = parseLimit(searchParams.get("limit"));
    const currency = normalizeWalletCurrency(searchParams.get("currency"));
    const isPrivileged =
      sessionUserRole === "ADMIN" || sessionUserRole === "SUPPORT";

    const targetUserId =
      isPrivileged && requestedUserId ? requestedUserId : sessionUserId;

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (requestedUserId && requestedUserId !== sessionUserId && !isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const walletSummary = await getUserWalletCurrencySummary(targetUserId, currency);

    const [depositRequests, payoutRequests, transferRequests] = await Promise.all([
      db.depositRequest.findMany({
        where: { userId: targetUserId, currency },
        orderBy: { createdAt: "desc" },
        take: limit * 3,
      }),
      db.payoutRequest.findMany({
        where: { userId: targetUserId, currency },
        orderBy: { createdAt: "desc" },
        take: limit * 3,
      }),
      db.transferRequest.findMany({
        where: {
          currency,
          OR: [{ senderId: targetUserId }, { receiverId: targetUserId }],
        },
        include: {
          sender: {
            select: { id: true, name: true, phone: true, email: true },
          },
          receiver: {
            select: { id: true, name: true, phone: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit * 5,
      }),
    ]);

    const userIds = new Set<string>();
    for (const item of transferRequests) {
      userIds.add(item.senderId);
      userIds.add(item.receiverId);
    }

    const wallets = userIds.size
      ? await db.wallet.findMany({
          where: {
            userId: {
              in: Array.from(userIds),
            },
          },
          select: {
            userId: true,
            walletAddressSYP: true,
            walletAddressUSD: true,
          },
        })
      : [];

    const walletByUserId = new Map<
      string,
      { walletAddressSYP: string | null; walletAddressUSD: string | null }
    >();

    for (const wallet of wallets) {
      walletByUserId.set(wallet.userId, {
        walletAddressSYP: wallet.walletAddressSYP,
        walletAddressUSD: wallet.walletAddressUSD,
      });
    }

    const depositById = new Map(depositRequests.map((item) => [item.id, item]));
    const payoutById = new Map(payoutRequests.map((item) => [item.id, item]));
    const transferById = new Map(transferRequests.map((item) => [item.id, item]));

    const activities: WalletActivityItem[] = [];

    if (walletSummary.exists && walletSummary.accountId) {
      const lines = await db.journalLine.findMany({
        where: {
          accountId: walletSummary.accountId,
        },
        include: {
          entry: {
            select: {
              id: true,
              type: true,
              description: true,
              metadata: true,
              postedAt: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit * 4,
      });

      for (const line of lines) {
        const uiType = mapLedgerEntryTypeToUiType(line.entry.type);

        if (!matchesFilter(uiType, filter)) {
          continue;
        }

        const referenceType =
          getStringFromJsonRecord(line.metadata, "referenceType") ??
          getStringFromJsonRecord(line.entry.metadata, "referenceType");

        const referenceId =
          getStringFromJsonRecord(line.metadata, "referenceId") ??
          getStringFromJsonRecord(line.entry.metadata, "referenceId") ??
          getStringFromJsonRecord(line.entry.metadata, "depositRequestId") ??
          getStringFromJsonRecord(line.entry.metadata, "payoutRequestId") ??
          getStringFromJsonRecord(line.entry.metadata, "transferRequestId");

        let details: Record<string, unknown> | null = {
          entryType: line.entry.type,
        };

        if (referenceType === "DEPOSIT_REQUEST" && referenceId) {
          const deposit = depositById.get(referenceId);

          if (deposit) {
            details = {
              ...details,
              requestId: deposit.id,
              method: deposit.method,
              proofUrl: deposit.proofUrl,
              reviewNote: deposit.reviewNote,
              reviewedAt: deposit.reviewedAt?.toISOString() ?? null,
              approvedAt: deposit.approvedAt?.toISOString() ?? null,
              approvalStage: deposit.approvalStage,
              status: deposit.status,
            };
          }
        }

        if (referenceType === "PAYOUT_REQUEST" && referenceId) {
          const payout = payoutById.get(referenceId);

          if (payout) {
            details = {
              ...details,
              requestId: payout.id,
              method: payout.method,
              destination: payout.destination,
              reviewNote: payout.reviewNote,
              reviewedAt: payout.reviewedAt?.toISOString() ?? null,
              approvedAt: payout.approvedAt?.toISOString() ?? null,
              approvalStage: payout.approvalStage,
              failureReason: payout.failureReason,
              status: payout.status,
            };
          }
        }

        if (referenceType === "TRANSFER_REQUEST" && referenceId) {
          const transfer = transferById.get(referenceId);

          if (transfer) {
            details = {
              ...details,
              requestId: transfer.id,
              senderId: transfer.senderId,
              senderName: transfer.sender?.name ?? null,
              senderPhone: transfer.sender?.phone ?? null,
              senderEmail: transfer.sender?.email ?? null,
              senderWalletAddress: getWalletAddressForCurrency(
                walletByUserId.get(transfer.senderId),
                currency
              ),
              receiverId: transfer.receiverId,
              receiverName: transfer.receiver?.name ?? null,
              receiverPhone: transfer.receiver?.phone ?? null,
              receiverEmail: transfer.receiver?.email ?? null,
              receiverWalletAddress: getWalletAddressForCurrency(
                walletByUserId.get(transfer.receiverId),
                currency
              ),
              reviewNote: transfer.reviewNote,
              reviewedAt: transfer.reviewedAt?.toISOString() ?? null,
              status: transfer.status,
            };
          }
        }

        activities.push({
          id: line.id,
          sourceKind: "LEDGER",
          type: uiType,
          rawType: line.entry.type,
          status: "COMPLETED",
          direction:
            line.amount > 0 ? "CREDIT" : line.amount < 0 ? "DEBIT" : "NEUTRAL",
          amount: Math.abs(line.amount),
          signedAmount: line.amount,
          currency,
          description: line.description ?? line.entry.description ?? null,
          referenceType,
          referenceId,
          entryId: line.entryId,
          createdAt: line.createdAt.toISOString(),
          postedAt: line.entry.postedAt.toISOString(),
          details,
        });
      }
    }

    for (const item of depositRequests) {
      const uiType: UiActivityType = "DEPOSIT";
      if (!matchesFilter(uiType, filter)) continue;

      const status = normalizeStatus(item.status);
      const isCompleted = status === "COMPLETED";

      activities.push({
        id: `deposit-request:${item.id}`,
        sourceKind: "DEPOSIT_REQUEST",
        type: uiType,
        rawType: "DEPOSIT_REQUEST",
        status,
        direction: "CREDIT",
        amount: item.amount,
        signedAmount: isCompleted ? item.amount : 0,
        currency,
        description: item.requestNote ?? `طلب إيداع عبر ${item.method}`,
        referenceType: "DEPOSIT_REQUEST",
        referenceId: item.id,
        entryId: null,
        createdAt: item.createdAt.toISOString(),
        postedAt: item.completedAt ? item.completedAt.toISOString() : null,
        details: {
          requestId: item.id,
          method: item.method,
          proofUrl: item.proofUrl,
          reviewNote: item.reviewNote,
          reviewedAt: item.reviewedAt?.toISOString() ?? null,
          approvedAt: item.approvedAt?.toISOString() ?? null,
          approvalStage: item.approvalStage,
          status: item.status,
        },
      });
    }

    for (const item of payoutRequests) {
      const uiType: UiActivityType = "WITHDRAWAL";
      if (!matchesFilter(uiType, filter)) continue;

      const status = normalizeStatus(item.status);
      const isCompleted = status === "COMPLETED";

      activities.push({
        id: `payout-request:${item.id}`,
        sourceKind: "PAYOUT_REQUEST",
        type: uiType,
        rawType: "PAYOUT_REQUEST",
        status,
        direction: "DEBIT",
        amount: item.amount,
        signedAmount: isCompleted ? -item.amount : 0,
        currency,
        description: item.requestNote ?? `طلب سحب إلى ${item.destination}`,
        referenceType: "PAYOUT_REQUEST",
        referenceId: item.id,
        entryId: null,
        createdAt: item.createdAt.toISOString(),
        postedAt:
          item.completedAt?.toISOString() ??
          item.processedAt?.toISOString() ??
          null,
        details: {
          requestId: item.id,
          method: item.method,
          destination: item.destination,
          reviewNote: item.reviewNote,
          reviewedAt: item.reviewedAt?.toISOString() ?? null,
          approvedAt: item.approvedAt?.toISOString() ?? null,
          approvalStage: item.approvalStage,
          failureReason: item.failureReason,
          status: item.status,
        },
      });
    }

    for (const item of transferRequests) {
      const uiType: UiActivityType = "TRANSFER";
      if (!matchesFilter(uiType, filter)) continue;

      const status = normalizeStatus(item.status);
      const isSender = item.senderId === targetUserId;
      const isCompleted = status === "COMPLETED";

      activities.push({
        id: `transfer-request:${item.id}`,
        sourceKind: "TRANSFER_REQUEST",
        type: uiType,
        rawType: "TRANSFER_REQUEST",
        status,
        direction: isSender ? "DEBIT" : "CREDIT",
        amount: item.amount,
        signedAmount: isCompleted
          ? isSender
            ? -item.amount
            : item.amount
          : 0,
        currency,
        description:
          item.referenceNote ?? (isSender ? "حوالة صادرة" : "حوالة واردة"),
        referenceType: "TRANSFER_REQUEST",
        referenceId: item.id,
        entryId: null,
        createdAt: item.createdAt.toISOString(),
        postedAt: item.completedAt?.toISOString() ?? null,
        details: {
          requestId: item.id,
          senderId: item.senderId,
          senderName: item.sender?.name ?? null,
          senderPhone: item.sender?.phone ?? null,
          senderEmail: item.sender?.email ?? null,
          senderWalletAddress: getWalletAddressForCurrency(
            walletByUserId.get(item.senderId),
            currency
          ),
          receiverId: item.receiverId,
          receiverName: item.receiver?.name ?? null,
          receiverPhone: item.receiver?.phone ?? null,
          receiverEmail: item.receiver?.email ?? null,
          receiverWalletAddress: getWalletAddressForCurrency(
            walletByUserId.get(item.receiverId),
            currency
          ),
          reviewNote: item.reviewNote,
          reviewedAt: item.reviewedAt?.toISOString() ?? null,
          status: item.status,
        },
      });
    }

    const deduped = new Map<string, WalletActivityItem>();
    for (const activity of activities) {
      deduped.set(activity.id, activity);
    }

    const sorted = Array.from(deduped.values()).sort((a, b) => {
      const aTime = new Date(a.postedAt ?? a.createdAt).getTime();
      const bTime = new Date(b.postedAt ?? b.createdAt).getTime();
      return bTime - aTime;
    });

    const sliced = sorted.slice(0, limit);

    return NextResponse.json({
      success: true,
      currency,
      wallet: {
        currency,
        verifiedBalance: walletSummary.balance ?? 0,
        availableBalance: walletSummary.availableBalance ?? 0,
        heldAmount: walletSummary.heldAmount ?? 0,
        isLocked: walletSummary.isDebtLocked ?? false,
        accountSlug: walletSummary.accountSlug ?? null,
      },
      transactions: sliced,
      total: sorted.length,
      nextCursor: null,
    });
  } catch (error) {
    console.error("Wallet transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet transactions" },
      { status: 500 }
    );
  }
}

