import { NextRequest, NextResponse } from "next/server";

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
      // @ts-ignore
      const transferReq = await tx.transferRequest.findUnique({
        where: { id: requestId },
        include: {
          senderAccount: true,
          receiverAccount: true,
        }
      });

      if (!transferReq) {
        throw new Error("TRANSFER_NOT_FOUND");
      }

      if (transferReq.status === "COMPLETED") {
        throw new Error("ALREADY_COMPLETED");
      }

      if (transferReq.status !== "PENDING") {
        throw new Error("INVALID_STATUS");
      }

      const hold = await tx.ledgerHold.findFirst({
        where: {
          referenceId: transferReq.id,
          referenceType: "TRANSFER_REQUEST",
          status: "OPEN"
        }
      });

      if (!hold) {
        throw new Error("HOLD_NOT_FOUND");
      }

      // 1. Release the hold
      await tx.ledgerHold.update({
        where: { id: hold.id },
        data: {
          status: "EXECUTED",
          updatedAt: new Date()
        }
      });

      // 2. Journal Entry
      const ledgerResult = await LedgerPostingService.postEntryInTransaction(
        tx as never,
        {
          type: "P2P_TRANSFER" as TransactionType,
          description: `Approved P2P transfer ${transferReq.id} from ${transferReq.senderId} to ${transferReq.receiverId}`,
          idempotencyKey: `transfer-approve:${transferReq.id}`,
          lines: [
            {
              accountSlug: transferReq.senderAccount!.slug,
              amount: -transferReq.amount,
              description: `P2P Transfer to ${transferReq.receiverId}`,
            },
            {
              accountSlug: transferReq.receiverAccount!.slug,
              amount: transferReq.amount,
              description: `P2P Transfer from ${transferReq.senderId}`,
            },
          ],
          metadata: {
            transferRequestId: transferReq.id,
            approvedByUserId: auth.userId,
          },
        }
      );

      // 3. Update Transfer Request
      // @ts-ignore
      const completedReq = await tx.transferRequest.update({
        where: { id: transferReq.id },
        data: {
          status: "COMPLETED",
          reviewedById: auth.userId,
          reviewedAt: new Date(),
          completedAt: new Date(),
          reviewNote: reviewNote ?? transferReq.reviewNote ?? undefined,
        }
      });

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          actorRole: "ADMIN",
          actorId: auth.userId,
          action: "FINANCE_TRANSFER_REQUEST_APPROVED",
          entityType: "TransferRequest",
          entityId: completedReq.id,
          beforeJson: { status: transferReq.status },
          afterJson: {
            status: completedReq.status,
            reviewedById: completedReq.reviewedById,
            completedAt: completedReq.completedAt,
          },
        },
      });

      return {
        completedReq,
        notifications: ledgerResult.notifications,
      };
    });

    await LedgerPostingService.dispatchNotifications(result.notifications);

    const { NotificationService } = await import("@/lib/notifications/service");
    // Notify Sender
    await NotificationService.create({
      userId: result.completedReq.senderId,
      title: "✅ تم تأكيد التحويل",
      message: `تم تحويل مبلغ ${result.completedReq.amount.toLocaleString()} ${result.completedReq.currency} إلى ${result.completedReq.receiverId} بنجاح.`,
      type: "SUCCESS",
      link: "/wallet",
    });
    // Notify Receiver
    await NotificationService.create({
      userId: result.completedReq.receiverId,
      title: "💰 استلام حوالة جديدة",
      message: `لقد استلمت حوالة بمبلغ ${result.completedReq.amount.toLocaleString()} ${result.completedReq.currency} من ${result.completedReq.senderId}.`,
      type: "SUCCESS",
      link: "/wallet",
    });

    return NextResponse.json({
      success: true,
      message: "Transfer request approved successfully",
      transferRequest: result.completedReq,
    });

  } catch (error: any) {
    console.error("Admin transfer request approve error:", error);

    const msg = error.message;
    if (["TRANSFER_NOT_FOUND", "HOLD_NOT_FOUND"].includes(msg)) {
       return NextResponse.json({ error: "Transfer request or associated hold not found." }, { status: 404 });
    }
    if (msg === "ALREADY_COMPLETED") {
       return NextResponse.json({ error: "Transfer request is already completed." }, { status: 409 });
    }
    if (msg === "INVALID_STATUS") {
       return NextResponse.json({ error: "Transfer request is not in a pending state." }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to approve transfer request",
      },
      { status: 500 }
    );
  }
}
