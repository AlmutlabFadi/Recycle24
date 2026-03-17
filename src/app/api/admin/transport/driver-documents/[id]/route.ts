import { NextRequest, NextResponse } from "next/server";
import { DocStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { PERMISSIONS, requirePermission } from "@/lib/rbac";
import { getRequestMeta } from "@/lib/audit";

const allowedStatuses: DocStatus[] = [
    "UPLOADED",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "EXPIRED",
];

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const primary = await requirePermission(PERMISSIONS.REVIEW_DRIVER_DOCS);
        const access = primary.ok ? primary : await requirePermission(PERMISSIONS.MANAGE_DRIVERS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { id } = await context.params;
        const body = await request.json();
        const status = body?.status as DocStatus | undefined;

        if (!status || !allowedStatuses.includes(status)) {
            return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
        }

        const before = await db.driverDocument.findUnique({
            where: { id },
            select: { status: true, driverId: true, type: true },
        });

        if (!before) {
            return NextResponse.json({ error: "DOC_NOT_FOUND" }, { status: 404 });
        }

        const updated = await db.driverDocument.update({
            where: { id },
            data: { status },
        });

        const { ip, userAgent } = getRequestMeta(request);
        await db.auditLog.create({
            data: {
                actorRole: "ADMIN",
                actorId: access.userId,
                action: "DRIVER_DOCUMENT_STATUS_UPDATED",
                entityType: "DriverDocument",
                entityId: id,
                beforeJson: before,
                afterJson: { status: updated.status },
                ip,
                userAgent,
            },
        });

        return NextResponse.json({ ok: true, document: updated });
    } catch (error) {
        console.error("Update driver document status error:", error);
        return NextResponse.json({ error: "UPDATE_DRIVER_DOCUMENT_STATUS_FAILED" }, { status: 500 });
    }
}
