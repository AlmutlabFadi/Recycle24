import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PERMISSIONS, requirePermission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_DRIVERS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "200"), 500);

        const bookings = await db.transportBooking.findMany({
            where: { status: { in: ["DRIVER_ASSIGNED", "PICKED_UP", "IN_TRANSIT"] } },
            orderBy: { updatedAt: "desc" },
            take: limit,
        });

        const driverIds = Array.from(new Set(bookings.map((booking) => booking.driverId).filter(Boolean))) as string[];

        const sessions = await db.driverSession.findMany({
            where: { driverId: { in: driverIds } },
            orderBy: { lastSeenAt: "desc" },
        });

        const latestByDriver = new Map<string, typeof sessions[number]>();
        for (const session of sessions) {
            if (!latestByDriver.has(session.driverId)) {
                latestByDriver.set(session.driverId, session);
            }
        }

        const shipments = bookings.map((booking) => {
            const session = booking.driverId ? latestByDriver.get(booking.driverId) : null;
            return {
                trackingId: booking.trackingId,
                status: booking.status,
                driverId: booking.driverId,
                driverName: booking.driverName,
                driverPhone: booking.driverPhone,
                pickupGovernorate: booking.pickupGovernorate,
                deliveryGovernorate: booking.deliveryGovernorate,
                lastLat: session?.lastLat ?? null,
                lastLng: session?.lastLng ?? null,
                lastSeenAt: session?.lastSeenAt ?? null,
            };
        });

        return NextResponse.json({ ok: true, shipments });
    } catch (error) {
        console.error("Admin live shipments error:", error);
        return NextResponse.json({ error: "FETCH_LIVE_SHIPMENTS_FAILED" }, { status: 500 });
    }
}
