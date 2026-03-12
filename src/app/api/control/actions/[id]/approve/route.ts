import { NextRequest, NextResponse } from "next/server";

import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("MANAGE_CONTROL_TOWER");

    if (!auth.ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: auth.status }
      );
    }

    const approvalActorId = auth.userId ?? null;
    const actionId = context.params?.id;

    if (!actionId) {
      return NextResponse.json(
        { error: "Action id is required" },
        { status: 400 }
      );
    }

    const existingAction = await db.controlAction.findUnique({
      where: { id: actionId },
      select: {
        id: true,
        status: true,
        type: true,
        reason: true,
        scope: true,
        result: true,
        incidentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!existingAction) {
      return NextResponse.json(
        { error: "Control action not found" },
        { status: 404 }
      );
    }

    if (existingAction.status === "approved") {
      return NextResponse.json({
        success: true,
        action: existingAction,
        message: "Control action already approved",
      });
    }

    if (existingAction.status !== "pending") {
      return NextResponse.json(
        {
          error: `Only pending actions can be approved. Current status: ${existingAction.status}`,
        },
        { status: 409 }
      );
    }

    const updatedAction = await db.controlAction.update({
      where: { id: actionId },
      data: {
        status: "approved",
        approvedAt: new Date(),
        result: {
          ...((existingAction.result as Record<string, unknown> | null) ?? {}),
          approval: {
            approvedByUserId: approvalActorId,
            approvedAt: new Date().toISOString(),
          },
        },
      },
      select: {
        id: true,
        status: true,
        type: true,
        reason: true,
        scope: true,
        result: true,
        incidentId: true,
        approvedAt: true,
        executedAt: true,
        updatedAt: true,
      },
    });

    await db.auditLog.create({
      data: {
        actorRole: "ADMIN",
        actorId: approvalActorId,
        action: "CONTROL_ACTION_APPROVED",
        entityType: "ControlAction",
        entityId: updatedAction.id,
        beforeJson: {
          status: existingAction.status,
        },
        afterJson: {
          status: updatedAction.status,
          approvedAt: updatedAction.approvedAt,
          approvalActorId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      action: updatedAction,
      message: "Control action approved successfully",
    });
  } catch (error) {
    console.error("Approve control action error:", error);

    return NextResponse.json(
      { error: "Failed to approve control action" },
      { status: 500 }
    );
  }
}