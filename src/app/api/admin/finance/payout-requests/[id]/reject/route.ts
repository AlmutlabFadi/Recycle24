import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
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

    if (!reviewNote) {
      return NextResponse.json(
        { error: "Review note is required for payout rejection" },
        { status: 400 }
      );
    }

    const payoutRequest = await db.payoutRequest.findUnique({
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
        approvalStage: true,
        requestNote: true,
        reviewNote: true,
        reviewedById: true,
        reviewedAt: true,
        approvedById: true,
        approvedAt: true,
        processedAt: true,
        completedAt: true,
        failedAt: true,
        failureReason: true,
        createdAt: true,
      },
    });

    if (!payoutRequest) {
      return NextResponse.json(
        { error: "Payout request not found" },
        { status: 404 }
      );
    }

    if (payoutRequest.status === "REJECTED") {
      return NextResponse.json({
        success: true,
        message: "Payout request already rejected",
        payoutRequest,
      });
    }

    if (payoutRequest.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Completed payout request cannot be rejected" },
        { status: 409 }
      );
    }

    if (!["PENDING", "UNDER_REVIEW"].includes(payoutRequest.status)) {
      return NextResponse.json(
        {
          error: `Payout request cannot be rejected from status ${payoutRequest.status}`,
        },
        { status: 409 }
      );
    }

    const rejectedRequest = await db.payoutRequest.update({
      where: { id: payoutRequest.id },
      data: {
        status: "REJECTED",
        reviewedById: payoutRequest.reviewedById ?? auth.userId,
        reviewedAt: payoutRequest.reviewedAt ?? new Date(),
        reviewNote,
        failureReason: reviewNote,
        failedAt: new Date(),
        approvalStage:
          payoutRequest.approvalStage === "AWAITING_FINAL_APPROVAL"
            ? "FINAL_REJECTED"
            : "REJECTED",
        approvedById: null,
        approvedAt: null,
        processedAt: null,
        completedAt: null,
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
        approvalStage: true,
        requestNote: true,
        reviewNote: true,
        reviewedById: true,
        reviewedAt: true,
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

    await db.auditLog.create({
      data: {
        actorRole: "ADMIN",
        actorId: auth.userId,
        action: "FINANCE_PAYOUT_REQUEST_REJECTED",
        entityType: "PayoutRequest",
        entityId: rejectedRequest.id,
        beforeJson: {
          status: payoutRequest.status,
          approvalStage: payoutRequest.approvalStage,
          reviewedById: payoutRequest.reviewedById,
          approvedById: payoutRequest.approvedById,
        },
        afterJson: {
          status: rejectedRequest.status,
          approvalStage: rejectedRequest.approvalStage,
          reviewedById: rejectedRequest.reviewedById,
          reviewedAt: rejectedRequest.reviewedAt,
          reviewNote: rejectedRequest.reviewNote,
          failedAt: rejectedRequest.failedAt,
          failureReason: rejectedRequest.failureReason,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payout request rejected successfully",
      payoutRequest: rejectedRequest,
    });
  } catch (error) {
    console.error("Admin payout request reject error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to reject payout request",
      },
      { status: 500 }
    );
  }
}