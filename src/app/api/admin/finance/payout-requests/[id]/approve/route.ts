import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  getPayoutApprovalDecision,
  isAwaitingFinalApproval,
} from "@/lib/finance/approval-policy";
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
        { status: auth.status }
      );
    }

    const { id: requestId } = await context.params;

    if (!requestId) {
      return NextResponse.json(
        { error: "Payout request id is required" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reviewNote = parseNonEmptyString(body?.reviewNote);

    const result = await db.$transaction(async (tx) => {
      const payoutRequest = await tx.payoutRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          accountId: true,
          userId: true,
          amount: true,
          currency: true,
          method: true,
          destination: true,
          status: true,
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
              debtStatus: true,
              lockedByDebt: true,
            },
          },
        },
      });

      if (!payoutRequest) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            { error: "Payout request not found" },
            { status: 404 }
          ),
        };
      }

      if (payoutRequest.status === "COMPLETED") {
        return {
          kind: "success" as const,
          response: NextResponse.json({
            success: true,
            message: "Payout request already completed",
            payoutRequest,
          }),
        };
      }

      if (!["PENDING", "UNDER_REVIEW"].includes(payoutRequest.status)) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            {
              error: `Payout request cannot be approved from status ${payoutRequest.status}`,
            },
            { status: 409 }
          ),
        };
      }

      if (payoutRequest.currency !== Currency.SYP && payoutRequest.currency !== Currency.USD) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            { error: "Only SYP and USD payout approvals are supported currently" },
            { status: 400 }
          ),
        };
      }

      const approvalDecision = getPayoutApprovalDecision(
        payoutRequest.currency as Currency,
        payoutRequest.amount
      );

      if (
        approvalDecision === "REQUIRES_SECOND_APPROVER" &&
        !isAwaitingFinalApproval(payoutRequest.approvalStage)
      ) {
        const stagedRequest = await tx.payoutRequest.update({
          where: { id: payoutRequest.id },
          data: {
            status: "UNDER_REVIEW",
            reviewedById: auth.userId,
            reviewedAt: new Date(),
            reviewNote: reviewNote ?? payoutRequest.reviewNote ?? undefined,
            approvalStage: "AWAITING_FINAL_APPROVAL",
          },
          select: {
            id: true,
            status: true,
            approvalStage: true,
            reviewedById: true,
            reviewedAt: true,
            reviewNote: true,
            amount: true,
            currency: true,
            method: true,
            destination: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        await tx.auditLog.create({
          data: {
            actorRole: "ADMIN",
            actorId: auth.userId,
            action: "FINANCE_PAYOUT_REQUEST_ESCALATED_FOR_FINAL_APPROVAL",
            entityType: "PayoutRequest",
            entityId: stagedRequest.id,
            beforeJson: {
              status: payoutRequest.status,
              approvalStage: payoutRequest.approvalStage,
            },
            afterJson: {
              status: stagedRequest.status,
              approvalStage: stagedRequest.approvalStage,
              reviewedById: stagedRequest.reviewedById,
              reviewedAt: stagedRequest.reviewedAt,
            },
          },
        });

        return {
          kind: "staged" as const,
          stagedRequest,
        };
      }

      if (
        approvalDecision === "REQUIRES_SECOND_APPROVER" &&
        payoutRequest.reviewedById &&
        payoutRequest.reviewedById === auth.userId
      ) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            {
              error:
                "Final approval requires a second finance admin different from the first reviewer",
            },
            { status: 409 }
          ),
        };
      }

      if (payoutRequest.account.lockedByDebt) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            { error: "Account is locked by debt rules" },
            { status: 423 }
          ),
        };
      }

      if (payoutRequest.account.balance < payoutRequest.amount) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            { error: "Insufficient ledger balance for payout approval" },
            { status: 409 }
          ),
        };
      }

      const ledgerResult = await LedgerPostingService.postEntryInTransaction(
        tx as never,
        {
          type: TransactionType.WALLET_WITHDRAWAL,
          description: `Approved payout request ${payoutRequest.id}`,
          idempotencyKey: `payout-approve:${payoutRequest.id}`,
          lines: [
            {
              accountSlug: payoutRequest.account.slug,
              amount: -payoutRequest.amount,
              description: `Payout request ${payoutRequest.id} debited from user wallet`,
            },
            {
              accountSlug: LedgerAccountSlug.SYSTEM_LIQUIDITY_POOL,
              amount: payoutRequest.amount,
              description: `Payout request ${payoutRequest.id} credited to system liquidity pool`,
            },
          ],
          metadata: {
            payoutRequestId: payoutRequest.id,
            accountId: payoutRequest.accountId,
            userId: payoutRequest.userId,
            method: payoutRequest.method,
            destination: payoutRequest.destination,
            requestNote: payoutRequest.requestNote,
            reviewedByUserId: payoutRequest.reviewedById ?? null,
            approvedByUserId: auth.userId,
          },
        }
      );

      const updatedAccount = await tx.ledgerAccount.findUnique({
        where: { id: payoutRequest.accountId },
        select: {
          id: true,
          slug: true,
          balance: true,
        },
      });

      await tx.wallet.upsert({
        where: {
          userId: payoutRequest.userId,
        },
        update: payoutRequest.currency === Currency.SYP
          ? { balanceSYP: updatedAccount?.balance ?? payoutRequest.account.balance }
          : { balanceUSD: updatedAccount?.balance ?? payoutRequest.account.balance },
        create: {
          userId: payoutRequest.userId,
          balanceSYP: payoutRequest.currency === Currency.SYP ? (updatedAccount?.balance ?? payoutRequest.account.balance) : 0,
          balanceUSD: payoutRequest.currency === Currency.USD ? (updatedAccount?.balance ?? payoutRequest.account.balance) : 0,
        },
      });

      const completedRequest = await tx.payoutRequest.update({
        where: { id: payoutRequest.id },
        data: {
          status: "COMPLETED",
          reviewedById: payoutRequest.reviewedById ?? auth.userId,
          reviewedAt: payoutRequest.reviewedAt ?? new Date(),
          approvedById:
            approvalDecision === "REQUIRES_SECOND_APPROVER"
              ? auth.userId
              : null,
          approvedAt:
            approvalDecision === "REQUIRES_SECOND_APPROVER"
              ? new Date()
              : null,
          approvalStage: "FINAL_APPROVED",
          processedAt: new Date(),
          completedAt: new Date(),
          reviewNote: reviewNote ?? payoutRequest.reviewNote ?? undefined,
        },
        select: {
          id: true,
          accountId: true,
          userId: true,
          amount: true,
          currency: true,
          method: true,
          destination: true,
          status: true,
          requestNote: true,
          reviewNote: true,
          reviewedById: true,
          reviewedAt: true,
          approvalStage: true,
          approvedById: true,
          approvedAt: true,
          processedAt: true,
          completedAt: true,
          failedAt: true,
          failureReason: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorRole: "ADMIN",
          actorId: auth.userId,
          action: "FINANCE_PAYOUT_REQUEST_APPROVED",
          entityType: "PayoutRequest",
          entityId: completedRequest.id,
          beforeJson: {
            status: payoutRequest.status,
            approvalStage: payoutRequest.approvalStage,
            reviewedById: payoutRequest.reviewedById,
          },
          afterJson: {
            status: completedRequest.status,
            approvalStage: completedRequest.approvalStage,
            reviewedById: completedRequest.reviewedById,
            reviewedAt: completedRequest.reviewedAt,
            approvedById: completedRequest.approvedById,
            approvedAt: completedRequest.approvedAt,
            processedAt: completedRequest.processedAt,
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

    if (result.kind === "committed") {
      await LedgerPostingService.dispatchNotifications(result.notifications);

      const { NotificationService } = await import("@/lib/notifications/service");
      await NotificationService.create({
        userId: result.completedRequest.userId,
        title: "✅ تم قبول طلب السحب",
        message: `تمت معالجة طلب السحب الخاص بك بمبلغ ${result.completedRequest.amount.toLocaleString()} ${result.completedRequest.currency} بنجاح.`,
        type: "SUCCESS",
        link: "/wallet",
      });
    }

    if (result.kind === "staged") {
      return NextResponse.json({
        success: true,
        message: "Payout request moved to final approval stage",
        payoutRequest: result.stagedRequest,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payout request approved successfully",
      payoutRequest: result.completedRequest,
      ledgerAccount: result.updatedAccount,
    });
  } catch (error) {
    console.error("Admin payout request approve error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to approve payout request",
      },
      { status: 500 }
    );
  }
}

