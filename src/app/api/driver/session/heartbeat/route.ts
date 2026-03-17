import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverProfile } from "@/lib/driver-auth";

export async function POST(request: NextRequest) {
    try {
        const guard = await requireDriverProfile();
        if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const body = await request.json();
        const deviceId = typeof body?.deviceId === "string" ? body.deviceId.trim() : "";
        const lat = typeof body?.lat === "number" ? body.lat : null;
        const lng = typeof body?.lng === "number" ? body.lng : null;
        const isAvailable = typeof body?.isAvailable === "boolean" ? body.isAvailable : undefined;

        if (!deviceId) {
            return NextResponse.json({ error: "DEVICE_ID_REQUIRED" }, { status: 400 });
        }

        const existing = await db.driverSession.findFirst({
            where: { driverId: guard.driverId, deviceId },
        });

        const session = existing
            ? await db.driverSession.update({
                where: { id: existing.id },
                data: {
                    lastLat: lat,
                    lastLng: lng,
                    lastSeenAt: new Date(),
                    isAvailable,
                },
            })
            : await db.driverSession.create({
                data: {
                    driverId: guard.driverId,
                    deviceId,
                    lastLat: lat,
                    lastLng: lng,
                    lastSeenAt: new Date(),
                    isAvailable: isAvailable ?? true,
                },
            });

        if (typeof lat === "number" && typeof lng === "number") {
            await db.driverLocationLog.create({
                data: {
                    driverId: guard.driverId,
                    lat,
                    lng,
                },
            });
        }

        return NextResponse.json({ ok: true, session });
    } catch (error) {
        console.error("Driver heartbeat error:", error);
        return NextResponse.json({ error: "DRIVER_HEARTBEAT_FAILED" }, { status: 500 });
    }
}
