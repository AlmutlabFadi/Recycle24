import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverProfile } from "@/lib/driver-auth";

export async function POST(request: NextRequest) {
    try {
        const guard = await requireDriverProfile();
        if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const body = await request.json();
        const deviceId = typeof body?.deviceId === "string" ? body.deviceId.trim() : "";
        const isAvailable = typeof body?.isAvailable === "boolean" ? body.isAvailable : undefined;

        if (!deviceId) {
            return NextResponse.json({ error: "DEVICE_ID_REQUIRED" }, { status: 400 });
        }

        if (typeof isAvailable !== "boolean") {
            return NextResponse.json({ error: "IS_AVAILABLE_REQUIRED" }, { status: 400 });
        }

        const existing = await db.driverSession.findFirst({
            where: { driverId: guard.driverId, deviceId },
        });

        const session = existing
            ? await db.driverSession.update({
                where: { id: existing.id },
                data: { isAvailable, lastSeenAt: new Date() },
            })
            : await db.driverSession.create({
                data: {
                    driverId: guard.driverId,
                    deviceId,
                    isAvailable,
                    lastSeenAt: new Date(),
                },
            });

        return NextResponse.json({ ok: true, session });
    } catch (error) {
        console.error("Driver availability update error:", error);
        return NextResponse.json({ error: "DRIVER_AVAILABILITY_UPDATE_FAILED" }, { status: 500 });
    }
}
