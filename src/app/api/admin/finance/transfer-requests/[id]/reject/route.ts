import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { TransferExecutionService } from "@/lib/finance/transfer-execution";

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

    const result = await db.$transaction((tx) =>
      TransferExecutionService.reject({
        tx,
        transferRequestId: requestId,
        actorUserId: auth.userId as string,
        reviewNote,
      })
    );

    return NextResponse.json({
      success: true,
      message: "Transfer request rejected successfully",
      transferRequest: result.transferRequest,
    });
  } catch (error: any) {
    console.error("Admin transfer request reject error:", error);

    switch (error?.message) {
      case "TRANSFER_NOT_FOUND":
        return NextResponse.json(
          { error: "Transfer request not found." },
          { status: 404 }
        );

      case "ALREADY_REJECTED":
        return NextResponse.json(
          { error: "Transfer request is already rejected." },
          { status: 409 }
        );

      case "ALREADY_COMPLETED":
        return NextResponse.json(
          { error: "Completed transfer request cannot be rejected." },
          { status: 409 }
        );

      case "INVALID_STATUS":
        return NextResponse.json(
          { error: "Transfer request is not in a pending state." },
          { status: 409 }
        );

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Failed to reject transfer request",
          },
          { status: 500 }
        );
    }
  }
}