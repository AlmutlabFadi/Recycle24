import { NextRequest, NextResponse } from "next/server";
import { DriverStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { getRequestMeta } from "@/lib/audit";

const allowedStatuses: DriverStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "VERIFIED",
  "ACTIVE",
  "SUSPENDED",
];

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requirePermission(PERMISSIONS.MANAGE_DRIVERS);
    if (!access.ok) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: access.status });
    }

    const body = await request.json();
    const rawStatus = body?.status;
    const reason = body?.reason;

    if (!rawStatus || typeof rawStatus !== "string") {
      return NextResponse.json({ error: "STATUS_REQUIRED" }, { status: 400 });
    }

    if (!allowedStatuses.includes(rawStatus as DriverStatus)) {
      return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
    }

    const status = rawStatus as DriverStatus;
    const { id: driverId } = await context.params;

    const before = await db.driver.findUnique({
      where: { id: driverId },
      select: { status: true },
    });

    if (!before) {
      return NextResponse.json({ error: "DRIVER_NOT_FOUND" }, { status: 404 });
    }

    const driver = await db.driver.update({
      where: { id: driverId },
      data: { status },
    });

    const { ip, userAgent } = getRequestMeta(request);
    await db.auditLog.create({
      data: {
        actorRole: "SUPPORT",
        actorId: access.userId,
        action: "DRIVER_STATUS_UPDATED",
        entityType: "Driver",
        entityId: driverId,
        beforeJson: before,
        afterJson: {
          status: driver.status,
          reason: typeof reason === "string" ? reason : null,
        },
        ip,
        userAgent,
      },
    });

    return NextResponse.json({ ok: true, driver });
  } catch (error) {
    console.error("Update driver status error:", error);
    return NextResponse.json({ error: "UPDATE_DRIVER_STATUS_FAILED" }, { status: 500 });
  }
}