import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { LedgerPostingService } from "@/lib/ledger/service";
import { Currency, LedgerAccountSlug, TransactionType } from "@/lib/ledger/types";
import { requirePermission } from "@/lib/rbac";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function parseNonEmptyString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("MANAGE_FINANCE");

    if (!auth.ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: auth.status },
      );
    }

    const { id: requestId } = await context.params;

    if (!requestId) {
      return NextResponse.json(
        { error: "Deposit request id is required" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const reviewNote = parseNonEmptyString(body?.reviewNote);

    const result = await db.$transaction(async (tx) => {
      const depositRequest = await tx.depositRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          accountId: true,
          userId: true,
          amount: true,
          currency: true,
          method: true,
          status: true,
          proofUrl: true,
          requestNote: true,
          reviewNote: true,
          reviewedById: true,
          reviewedAt: true,
          approvalStage: true,
          approvedById: true,
          approvedAt: true,
          createdAt: true,
          account: {
            select: {
              id: true,
              slug: true,
              balance: true,
              currency: true,
            },
          },
        },
      });

      if (!depositRequest) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            { error: "Deposit request not found" },
            { status: 404 },
          ),
        };
      }

      if (depositRequest.status === "COMPLETED") {
        return {
          kind: "success" as const,
          response: NextResponse.json({
            success: true,
            message: "Deposit request already completed",
            depositRequest,
          }),
        };
      }

      if (!["PENDING", "UNDER_REVIEW"].includes(depositRequest.status)) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            {
              error: `Deposit request cannot be approved from status ${depositRequest.status}`,
            },
            { status: 409 },
          ),
        };
      }

      if (
        depositRequest.currency !== Currency.SYP &&
        depositRequest.currency !== Currency.USD
      ) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            { error: "Only SYP and USD deposit approvals are supported currently" },
            { status: 400 },
          ),
        };
      }

      const ledgerResult = await LedgerPostingService.postEntryInTransaction(
        tx as never,
        {
          type: TransactionType.WALLET_DEPOSIT,
          description: `Approved deposit request ${depositRequest.id}`,
          idempotencyKey: `deposit-approve:${depositRequest.id}`,
          lines: [
            {
              accountSlug: LedgerAccountSlug.SYSTEM_LIQUIDITY_POOL,
              amount: -depositRequest.amount,
              description: `Admin-approved deposit funding for request ${depositRequest.id}`,
            },
            {
              accountSlug: depositRequest.account.slug,
              amount: depositRequest.amount,
              description: `Deposit request ${depositRequest.id} credited`,
            },
          ],
          metadata: {
            depositRequestId: depositRequest.id,
            accountId: depositRequest.accountId,
            userId: depositRequest.userId,
            method: depositRequest.method,
            proofUrl: depositRequest.proofUrl,
            requestNote: depositRequest.requestNote,
            reviewedByUserId: auth.userId,
            approvedByUserId: null,
          },
        },
      );

      const updatedAccount = await tx.ledgerAccount.findUnique({
        where: { id: depositRequest.accountId },
        select: {
          id: true,
          slug: true,
          balance: true,
        },
      });

      await tx.wallet.upsert({
        where: {
          userId: depositRequest.userId,
        },
        update:
          depositRequest.currency === Currency.SYP
            ? { balanceSYP: updatedAccount?.balance ?? depositRequest.account.balance }
            : { balanceUSD: updatedAccount?.balance ?? depositRequest.account.balance },
        create: {
          userId: depositRequest.userId,
          balanceSYP:
            depositRequest.currency === Currency.SYP
              ? updatedAccount?.balance ?? depositRequest.account.balance
              : 0,
          balanceUSD:
            depositRequest.currency === Currency.USD
              ? updatedAccount?.balance ?? depositRequest.account.balance
              : 0,
        },
      });

      const completedRequest = await tx.depositRequest.update({
        where: { id: depositRequest.id },
        data: {
          status: "COMPLETED",
          reviewedById: auth.userId,
          reviewedAt: new Date(),
          approvedById: null,
          approvedAt: null,
          approvalStage: "NONE",
          completedAt: new Date(),
          reviewNote: reviewNote ?? depositRequest.reviewNote ?? undefined,
        },
        select: {
          id: true,
          accountId: true,
          userId: true,
          amount: true,
          currency: true,
          method: true,
          status: true,
          proofUrl: true,
          requestNote: true,
          reviewNote: true,
          reviewedById: true,
          reviewedAt: true,
          approvalStage: true,
          approvedById: true,
          approvedAt: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorRole: "ADMIN",
          actorId: auth.userId,
          action: "FINANCE_DEPOSIT_REQUEST_COMPLETED",
          entityType: "DepositRequest",
          entityId: completedRequest.id,
          beforeJson: {
            status: depositRequest.status,
            approvalStage: depositRequest.approvalStage,
            reviewedById: depositRequest.reviewedById,
          },
          afterJson: {
            status: completedRequest.status,
            approvalStage: completedRequest.approvalStage,
            reviewedById: completedRequest.reviewedById,
            reviewedAt: completedRequest.reviewedAt,
            completedAt: completedRequest.completedAt,
            ledgerBalanceAfter: updatedAccount?.balance ?? null,
          },
        },
      });

      return {
        kind: "committed" as const,
        completedRequest,
        updatedAccount,
        notifications: ledgerResult.notifications,
      };
    });

    if ("response" in result) {
      return result.response;
    }

    await LedgerPostingService.dispatchNotifications(result.notifications);

    const { NotificationService } = await import("@/lib/notifications/service");
    await NotificationService.create({
      userId: result.completedRequest.userId,
      title: "✅ تم قبول طلب الإيداع",
      message: `تمت إضافة ${result.completedRequest.amount.toLocaleString()} ${result.completedRequest.currency} إلى محفظتك بنجاح.`,
      type: "SUCCESS",
      link: "/wallet",
    });

    return NextResponse.json({
      success: true,
      message: "Deposit request completed successfully",
      depositRequest: result.completedRequest,
      ledgerAccount: result.updatedAccount,
    });
  } catch (error) {
    console.error("Admin deposit request approve error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to approve deposit request",
      },
      { status: 500 },
    );
  }
}
