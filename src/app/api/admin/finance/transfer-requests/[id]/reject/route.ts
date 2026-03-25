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
        { error: "Transfer request id is required" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reviewNote = parseNonEmptyString(body?.reviewNote);

    if (!reviewNote) {
      return NextResponse.json(
        { error: "Review note is required to reject a transfer request" },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const transferReq = await tx.transferRequest.findUnique({
        where: { id: requestId },
      });

      if (!transferReq) {
        throw new Error("TRANSFER_NOT_FOUND");
      }

      if (transferReq.status === "REJECTED") {
        throw new Error("ALREADY_REJECTED");
      }

      if (!["PENDING", "UNDER_REVIEW"].includes(transferReq.status)) {
        throw new Error("INVALID_STATUS");
      }

      const hold = await tx.ledgerHold.findFirst({
        where: {
          referenceId: transferReq.id,
          referenceType: "TRANSFER_REQUEST",
          status: "OPEN"
        }
      });

      if (hold) {
        // Release the hold without executing
        await tx.ledgerHold.update({
          where: { id: hold.id },
          data: {
            status: "CANCELLED",
            updatedAt: new Date()
          }
        });
      }

      // Update Transfer Request
      const rejectedReq = await tx.transferRequest.update({
        where: { id: transferReq.id },
        data: {
          status: "REJECTED",
          reviewedById: auth.userId,
          reviewedAt: new Date(),
          failedAt: new Date(),
          reviewNote: reviewNote,
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorRole: "ADMIN",
          actorId: auth.userId,
          action: "FINANCE_TRANSFER_REQUEST_REJECTED",
          entityType: "TransferRequest",
          entityId: rejectedReq.id,
          beforeJson: { status: transferReq.status },
          afterJson: {
            status: rejectedReq.status,
            reviewedById: rejectedReq.reviewedById,
            failedAt: rejectedReq.failedAt,
            reviewNote: rejectedReq.reviewNote
          },
        },
      });

      return rejectedReq;
    });

    return NextResponse.json({
      success: true,
      message: "Transfer request rejected successfully",
      transferRequest: result,
    });

  } catch (error: any) {
    console.error("Admin transfer request reject error:", error);

    const msg = error.message;
    if (msg === "TRANSFER_NOT_FOUND") {
       return NextResponse.json({ error: "Transfer request not found." }, { status: 404 });
    }
    if (msg === "ALREADY_REJECTED") {
       return NextResponse.json({ error: "Transfer request is already rejected." }, { status: 409 });
    }
    if (msg === "INVALID_STATUS") {
       return NextResponse.json({ error: "Transfer request is not in a pending state." }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to reject transfer request",
      },
      { status: 500 }
    );
  }
}
