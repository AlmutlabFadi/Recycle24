import { NextRequest, NextResponse } from "next/server";

import { evaluateApproval } from "@/app/admin/finance/_lib/policy-engine";
import { db } from "@/lib/db";
import { LedgerPostingService } from "@/lib/ledger/service";
import { Currency, TransactionType } from "@/lib/ledger/types";
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
        { error: "Transfer request id is required" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reviewNote = parseNonEmptyString(body?.reviewNote);

    const result = await db.$transaction(async (tx) => {
      const transferReq = await tx.transferRequest.findUnique({
        where: { id: requestId },
        include: {
          senderAccount: true,
          receiverAccount: true,
        },
      });

      if (!transferReq) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            { error: "Transfer request not found." },
            { status: 404 }
          ),
        };
      }

      if (!transferReq.senderAccount || !transferReq.receiverAccount) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            { error: "Transfer request ledger accounts are missing." },
            { status: 409 }
          ),
        };
      }

      if (transferReq.status === "COMPLETED") {
        return {
          kind: "success" as const,
          response: NextResponse.json({
            success: true,
            message: "Transfer request already completed",
            transferRequest: transferReq,
          }),
        };
      }

      if (!["PENDING", "UNDER_REVIEW"].includes(transferReq.status)) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            { error: "Transfer request is not in a pending state." },
            { status: 409 }
          ),
        };
      }

      const policy = evaluateApproval({
        type: "TRANSFER",
        amount: transferReq.amount,
        currency: transferReq.currency as "SYP" | "USD",
        userId: transferReq.senderId,
        velocityTriggered: false,
      });

      if (policy.requiresFinalApproval && transferReq.status === "PENDING") {
        const stagedRequest = await tx.transferRequest.update({
          where: { id: transferReq.id },
          data: {
            status: "UNDER_REVIEW",
            reviewedById: auth.userId,
            reviewedAt: new Date(),
            reviewNote: reviewNote ?? transferReq.reviewNote ?? undefined,
          },
          select: {
            id: true,
            status: true,
            reviewedById: true,
            reviewedAt: true,
            reviewNote: true,
            amount: true,
            currency: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        await tx.auditLog.create({
          data: {
            actorRole: "ADMIN",
            actorId: auth.userId,
            action: "FINANCE_TRANSFER_REQUEST_ESCALATED_FOR_FINAL_APPROVAL",
            entityType: "TransferRequest",
            entityId: stagedRequest.id,
            beforeJson: {
              status: transferReq.status,
              reviewedById: transferReq.reviewedById,
            },
            afterJson: {
              status: stagedRequest.status,
              reviewedById: stagedRequest.reviewedById,
              reviewedAt: stagedRequest.reviewedAt,
              policyFlags: policy.flags,
            },
          },
        });

        return {
          kind: "staged" as const,
          stagedRequest,
        };
      }

      if (
        policy.requiresFinalApproval &&
        transferReq.reviewedById &&
        transferReq.reviewedById === auth.userId
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

      const hold = await tx.ledgerHold.findFirst({
        where: {
          referenceId: transferReq.id,
          referenceType: "TRANSFER_REQUEST",
          status: "OPEN",
        },
      });

      if (!hold) {
        return {
          kind: "error" as const,
          response: NextResponse.json(
            { error: "Associated open hold was not found for this transfer request." },
            { status: 404 }
          ),
        };
      }

      await tx.ledgerHold.update({
        where: { id: hold.id },
        data: {
          status: "EXECUTED",
          updatedAt: new Date(),
        },
      });

      const ledgerResult = await LedgerPostingService.postEntryInTransaction(
        tx as never,
        {
          type: TransactionType.WALLET_TRANSFER,
          description: `Approved internal transfer ${transferReq.id}`,
          idempotencyKey: `transfer-approve:${transferReq.id}`,
          lines: [
            {
              accountSlug: transferReq.senderAccount.slug,
              amount: -transferReq.amount,
              description: `Internal transfer ${transferReq.id} sent`,
            },
            {
              accountSlug: transferReq.receiverAccount.slug,
              amount: transferReq.amount,
              description: `Internal transfer ${transferReq.id} received`,
            },
          ],
          metadata: {
            transferRequestId: transferReq.id,
            senderId: transferReq.senderId,
            receiverId: transferReq.receiverId,
            reviewedByUserId: transferReq.reviewedById ?? auth.userId,
            approvedByUserId: policy.requiresFinalApproval ? auth.userId : null,
            policyFlags: policy.flags,
          },
        }
      );

      const [updatedSenderAccount, updatedReceiverAccount] = await Promise.all([
        tx.ledgerAccount.findUnique({
          where: { id: transferReq.senderAccountId ?? "" },
          select: { balance: true },
        }),
        tx.ledgerAccount.findUnique({
          where: { id: transferReq.receiverAccountId ?? "" },
          select: { balance: true },
        }),
      ]);

      await tx.wallet.upsert({
        where: { userId: transferReq.senderId },
        update:
          transferReq.currency === Currency.SYP
            ? { balanceSYP: updatedSenderAccount?.balance ?? transferReq.senderAccount.balance }
            : { balanceUSD: updatedSenderAccount?.balance ?? transferReq.senderAccount.balance },
        create: {
          userId: transferReq.senderId,
          balanceSYP:
            transferReq.currency === Currency.SYP
              ? updatedSenderAccount?.balance ?? transferReq.senderAccount.balance
              : 0,
          balanceUSD:
            transferReq.currency === Currency.USD
              ? updatedSenderAccount?.balance ?? transferReq.senderAccount.balance
              : 0,
        },
      });

      await tx.wallet.upsert({
        where: { userId: transferReq.receiverId },
        update:
          transferReq.currency === Currency.SYP
            ? { balanceSYP: updatedReceiverAccount?.balance ?? transferReq.receiverAccount.balance }
            : { balanceUSD: updatedReceiverAccount?.balance ?? transferReq.receiverAccount.balance },
        create: {
          userId: transferReq.receiverId,
          balanceSYP:
            transferReq.currency === Currency.SYP
              ? updatedReceiverAccount?.balance ?? transferReq.receiverAccount.balance
              : 0,
          balanceUSD:
            transferReq.currency === Currency.USD
              ? updatedReceiverAccount?.balance ?? transferReq.receiverAccount.balance
              : 0,
        },
      });

      const completedReq = await tx.transferRequest.update({
        where: { id: transferReq.id },
        data: {
          status: "COMPLETED",
          reviewedById: transferReq.reviewedById ?? auth.userId,
          reviewedAt: transferReq.reviewedAt ?? new Date(),
          completedAt: new Date(),
          reviewNote: reviewNote ?? transferReq.reviewNote ?? undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          actorRole: "ADMIN",
          actorId: auth.userId,
          action: "FINANCE_TRANSFER_REQUEST_APPROVED",
          entityType: "TransferRequest",
          entityId: completedReq.id,
          beforeJson: {
            status: transferReq.status,
            reviewedById: transferReq.reviewedById,
            holdId: hold.id,
          },
          afterJson: {
            status: completedReq.status,
            reviewedById: completedReq.reviewedById,
            completedAt: completedReq.completedAt,
            holdStatus: "EXECUTED",
            senderBalanceAfter: updatedSenderAccount?.balance ?? null,
            receiverBalanceAfter: updatedReceiverAccount?.balance ?? null,
            policyFlags: policy.flags,
          },
        },
      });

      return {
        kind: "committed" as const,
        completedReq,
        notifications: ledgerResult.notifications,
      };
    });

    if ("response" in result) {
      return result.response;
    }

    if (result.kind === "staged") {
      return NextResponse.json({
        success: true,
        message: "Transfer request moved to final approval stage",
        transferRequest: result.stagedRequest,
      });
    }

    await LedgerPostingService.dispatchNotifications(result.notifications);

    const { NotificationService } = await import("@/lib/notifications/service");

    await NotificationService.create({
      userId: result.completedReq.senderId,
      title: "✅ تم تأكيد التحويل",
      message: `تم تحويل مبلغ ${result.completedReq.amount.toLocaleString()} ${result.completedReq.currency} بنجاح.`,
      type: "SUCCESS",
      link: "/wallet",
    });

    await NotificationService.create({
      userId: result.completedReq.receiverId,
      title: "💰 استلام حوالة جديدة",
      message: `لقد استلمت حوالة بمبلغ ${result.completedReq.amount.toLocaleString()} ${result.completedReq.currency}.`,
      type: "SUCCESS",
      link: "/wallet",
    });

    return NextResponse.json({
      success: true,
      message: "Transfer request approved successfully",
      transferRequest: result.completedReq,
    });
  } catch (error) {
    console.error("Admin transfer request approve error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to approve transfer request",
      },
      { status: 500 }
    );
  }
}