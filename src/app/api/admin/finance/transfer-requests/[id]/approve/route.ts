import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { LedgerPostingService } from "@/lib/ledger/service";
import { requirePermission } from "@/lib/rbac";
import { TransferExecutionService } from "@/lib/finance/transfer-execution";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
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

    const result = await db.$transaction((tx) =>
      TransferExecutionService.approve({
        tx,
        transferRequestId: requestId,
        actorUserId: auth.userId as string,
      })
    );

    if (result.kind === "completed" && result.notifications.length > 0) {
      await LedgerPostingService.dispatchNotifications(result.notifications);

      const { NotificationService } = await import("@/lib/notifications/service");

      await NotificationService.create({
        userId: result.transferRequest.senderId,
        title: "✅ تم تأكيد التحويل",
        message: `تم تحويل مبلغ ${result.transferRequest.amount.toLocaleString()} ${result.transferRequest.currency} بنجاح.`,
        type: "SUCCESS",
        link: "/wallet/transactions",
      });

      await NotificationService.create({
        userId: result.transferRequest.receiverId,
        title: "💰 استلام حوالة جديدة",
        message: `لقد استلمت حوالة بمبلغ ${result.transferRequest.amount.toLocaleString()} ${result.transferRequest.currency}.`,
        type: "SUCCESS",
        link: "/wallet/transactions",
      });
    }

    return NextResponse.json({
      success: true,
      message:
        result.kind === "staged"
          ? "Transfer request moved to under review."
          : "Transfer request approved successfully.",
      transferRequest: result.transferRequest,
    });
  } catch (error: any) {
    console.error("Admin transfer request approve error:", error);

    switch (error?.message) {
      case "TRANSFER_NOT_FOUND":
        return NextResponse.json(
          { error: "Transfer request not found." },
          { status: 404 }
        );

      case "TRANSFER_ACCOUNTS_MISSING":
        return NextResponse.json(
          { error: "Transfer request ledger accounts are missing." },
          { status: 409 }
        );

      case "TRANSFER_UNSUPPORTED_CURRENCY":
        return NextResponse.json(
          { error: "Only SYP and USD transfer approvals are supported." },
          { status: 400 }
        );

      case "INVALID_STATUS":
        return NextResponse.json(
          { error: "Transfer request is not in a pending state." },
          { status: 409 }
        );

      case "FINAL_APPROVER_MUST_DIFFER":
        return NextResponse.json(
          {
            error:
              "Final approval requires a second finance admin different from the first reviewer.",
          },
          { status: 409 }
        );

      case "TRANSFER_HOLD_NOT_FOUND":
        return NextResponse.json(
          { error: "Associated open hold was not found for this transfer request." },
          { status: 404 }
        );

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Failed to approve transfer request",
          },
          { status: 500 }
        );
    }
  }
}