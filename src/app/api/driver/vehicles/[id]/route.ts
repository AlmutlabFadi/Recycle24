import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverProfile } from "@/lib/driver-auth";
import { getRequestMeta } from "@/lib/audit";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const guard = await requireDriverProfile();
        if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const { id } = await context.params;
        const body = await request.json();
        const { plateNumber, make, model, year, color } = body || {};

        const existing = await db.vehicle.findFirst({
            where: { id, driverId: guard.driverId },
        });

        if (!existing) {
            return NextResponse.json({ error: "VEHICLE_NOT_FOUND" }, { status: 404 });
        }

        const vehicle = await db.vehicle.update({
            where: { id },
            data: {
                plateNumber: typeof plateNumber === "string" ? plateNumber.trim() : undefined,
                make: typeof make === "string" ? make.trim() : undefined,
                model: typeof model === "string" ? model.trim() : undefined,
                year: typeof year === "number" ? year : undefined,
                color: typeof color === "string" ? color.trim() : undefined,
            },
        });

        const { ip, userAgent } = getRequestMeta(request);
        await db.auditLog.create({
            data: {
                actorRole: "DRIVER",
                actorId: guard.driverId,
                action: "DRIVER_VEHICLE_UPDATED",
                entityType: "Vehicle",
                entityId: vehicle.id,
                beforeJson: { plateNumber: existing.plateNumber, make: existing.make, model: existing.model, year: existing.year },
                afterJson: { plateNumber: vehicle.plateNumber, make: vehicle.make, model: vehicle.model, year: vehicle.year },
                ip,
                userAgent,
            },
        });

        return NextResponse.json({ ok: true, vehicle });
    } catch (error) {
        console.error("Update driver vehicle error:", error);
        return NextResponse.json({ error: "UPDATE_DRIVER_VEHICLE_FAILED" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const guard = await requireDriverProfile();
        if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const { id } = await context.params;

        const existing = await db.vehicle.findFirst({
            where: { id, driverId: guard.driverId },
        });

        if (!existing) {
            return NextResponse.json({ error: "VEHICLE_NOT_FOUND" }, { status: 404 });
        }

        await db.vehicle.delete({ where: { id } });

        const { ip, userAgent } = getRequestMeta(request);
        await db.auditLog.create({
            data: {
                actorRole: "DRIVER",
                actorId: guard.driverId,
                action: "DRIVER_VEHICLE_REMOVED",
                entityType: "Vehicle",
                entityId: id,
                beforeJson: { plateNumber: existing.plateNumber, make: existing.make, model: existing.model, year: existing.year },
                ip,
                userAgent,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Delete driver vehicle error:", error);
        return NextResponse.json({ error: "DELETE_DRIVER_VEHICLE_FAILED" }, { status: 500 });
    }
}
