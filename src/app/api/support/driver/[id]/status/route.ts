import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { getRequestMeta } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_DRIVERS);
        if (!access.ok) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: access.status });

        const body = await request.json();
        const { status, reason } = body || {};
        if (!status) {
            return NextResponse.json({ error: "STATUS_REQUIRED" }, { status: 400 });
        }

        const allowedStatuses = ["PENDING", "UNDER_REVIEW", "VERIFIED", "ACTIVE", "SUSPENDED"];
        if (!allowedStatuses.includes(status)) {
            return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
        }

        const driverId = params.id;
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
                afterJson: { status: driver.status, reason: typeof reason === "string" ? reason : null },
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
