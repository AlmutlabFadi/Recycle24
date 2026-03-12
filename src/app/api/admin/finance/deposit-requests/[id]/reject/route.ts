import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

interface RouteContext {
  params: {
    id: string;
  };
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

    const requestId = context.params?.id;

    if (!requestId) {
      return NextResponse.json(
        { error: "Deposit request id is required" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reviewNote = parseNonEmptyString(body?.reviewNote);

    if (!reviewNote) {
      return NextResponse.json(
        { error: "Review note is required for rejection" },
        { status: 400 }
      );
    }

    const depositRequest = await db.depositRequest.findUnique({
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
        createdAt: true,
        account: {
          select: {
            id: true,
            slug: true,
            balance: true,
            currency: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!depositRequest) {
      return NextResponse.json(
        { error: "Deposit request not found" },
        { status: 404 }
      );
    }

    if (depositRequest.status === "REJECTED") {
      return NextResponse.json({
        success: true,
        message: "Deposit request already rejected",
        depositRequest,
      });
    }

    if (depositRequest.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Completed deposit request cannot be rejected" },
        { status: 409 }
      );
    }

    if (!["PENDING", "UNDER_REVIEW"].includes(depositRequest.status)) {
      return NextResponse.json(
        {
          error: `Deposit request cannot be rejected from status ${depositRequest.status}`,
        },
        { status: 409 }
      );
    }

    const rejectedRequest = await db.depositRequest.update({
      where: { id: depositRequest.id },
      data: {
        status: "REJECTED",
        reviewedById: auth.userId,
        reviewedAt: new Date(),
        reviewNote,
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
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await db.auditLog.create({
      data: {
        actorRole: "ADMIN",
        actorId: auth.userId,
        action: "FINANCE_DEPOSIT_REQUEST_REJECTED",
        entityType: "DepositRequest",
        entityId: rejectedRequest.id,
        beforeJson: {
          status: depositRequest.status,
        },
        afterJson: {
          status: rejectedRequest.status,
          reviewedById: rejectedRequest.reviewedById,
          reviewedAt: rejectedRequest.reviewedAt,
          reviewNote: rejectedRequest.reviewNote,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Deposit request rejected successfully",
      depositRequest: rejectedRequest,
    });
  } catch (error) {
    console.error("Admin deposit request reject error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to reject deposit request",
      },
      { status: 500 }
    );
  }
}