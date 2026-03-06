import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverProfile } from "@/lib/driver-auth";
import { getRequestMeta } from "@/lib/audit";

export async function GET(request: Request) {
    try {
        const guard = await requireDriverProfile();
        if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const driver = await db.driver.findUnique({
            where: { id: guard.driverId },
            include: { vehicles: true, documents: true },
        });

        return NextResponse.json({ ok: true, driver });
    } catch (error) {
        console.error("Get driver profile error:", error);
        return NextResponse.json({ error: "FETCH_DRIVER_PROFILE_FAILED" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const guard = await requireDriverProfile();
        if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const body = await request.json();
        const { fullName, phone, city } = body || {};

        const before = await db.driver.findUnique({
            where: { id: guard.driverId },
            select: { fullName: true, phone: true, city: true },
        });

        const driver = await db.driver.update({
            where: { id: guard.driverId },
            data: {
                fullName: typeof fullName === "string" ? fullName : undefined,
                phone: typeof phone === "string" ? phone : undefined,
                city: typeof city === "string" ? city : undefined,
            },
        });

        const { ip, userAgent } = getRequestMeta(request);
        await db.auditLog.create({
            data: {
                actorRole: "DRIVER",
                actorId: guard.driverId,
                action: "DRIVER_PROFILE_UPDATED",
                entityType: "Driver",
                entityId: guard.driverId,
                beforeJson: before || undefined,
                afterJson: { fullName: driver.fullName, phone: driver.phone, city: driver.city },
                ip,
                userAgent,
            },
        });

        return NextResponse.json({ ok: true, driver });
    } catch (error) {
        console.error("Update driver profile error:", error);
        return NextResponse.json({ error: "UPDATE_DRIVER_PROFILE_FAILED" }, { status: 500 });
    }
}
