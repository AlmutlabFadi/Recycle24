import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  getDepositApprovalDecision,
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
        { error: "Deposit request id is required" },
        { status: 400 }
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
            { status: 404 }
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
            { status: 409 }
          ),
        };
      }

      if (depositRequest.currency !== Currency.SYP) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            { error: "Only SYP deposit approvals are supported currently" },
            { status: 400 }
          ),
        };
      }

      const approvalDecision = getDepositApprovalDecision(
        Currency.SYP,
        depositRequest.amount
      );

      if (
        approvalDecision === "REQUIRES_SECOND_APPROVER" &&
        !isAwaitingFinalApproval(depositRequest.approvalStage)
      ) {
        const stagedRequest = await tx.depositRequest.update({
          where: { id: depositRequest.id },
          data: {
            status: "UNDER_REVIEW",
            reviewedById: auth.userId,
            reviewedAt: new Date(),
            reviewNote: reviewNote ?? depositRequest.reviewNote ?? undefined,
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
            createdAt: true,
            updatedAt: true,
          },
        });

        await tx.auditLog.create({
          data: {
            actorRole: "ADMIN",
            actorId: auth.userId,
            action: "FINANCE_DEPOSIT_REQUEST_ESCALATED_FOR_FINAL_APPROVAL",
            entityType: "DepositRequest",
            entityId: stagedRequest.id,
            beforeJson: {
              status: depositRequest.status,
              approvalStage: depositRequest.approvalStage,
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
        depositRequest.reviewedById &&
        depositRequest.reviewedById === auth.userId
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
            reviewedByUserId: depositRequest.reviewedById ?? null,
            approvedByUserId: auth.userId,
          },
        }
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
        update: {
          balanceSYP: updatedAccount?.balance ?? depositRequest.account.balance,
        },
        create: {
          userId: depositRequest.userId,
          balanceSYP: updatedAccount?.balance ?? depositRequest.account.balance,
          balanceUSD: 0,
        },
      });

      const completedRequest = await tx.depositRequest.update({
        where: { id: depositRequest.id },
        data: {
          status: "COMPLETED",
          reviewedById: depositRequest.reviewedById ?? auth.userId,
          reviewedAt: depositRequest.reviewedAt ?? new Date(),
          approvedById:
            approvalDecision === "REQUIRES_SECOND_APPROVER"
              ? auth.userId
              : null,
          approvedAt:
            approvalDecision === "REQUIRES_SECOND_APPROVER"
              ? new Date()
              : null,
          approvalStage: "FINAL_APPROVED",
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
          action: "FINANCE_DEPOSIT_REQUEST_APPROVED",
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
            approvedById: completedRequest.approvedById,
            approvedAt: completedRequest.approvedAt,
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
    }

    if (result.kind === "staged") {
      return NextResponse.json({
        success: true,
        message: "Deposit request moved to final approval stage",
        depositRequest: result.stagedRequest,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Deposit request approved successfully",
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
      { status: 500 }
    );
  }
}

