import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PERMISSIONS, requirePermission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_DRIVERS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const [
            driverStatusCounts,
            bookingStatusCounts,
            assignmentStatusCounts,
            deliveryStatusCounts,
            latestSessions,
        ] = await Promise.all([
            db.driver.groupBy({
                by: ["status"],
                _count: { status: true },
            }),
            db.transportBooking.groupBy({
                by: ["status"],
                _count: { status: true },
            }),
            db.deliveryAssignment.groupBy({
                by: ["status"],
                _count: { status: true },
            }),
            db.delivery.groupBy({
                by: ["status"],
                _count: { status: true },
            }),
            db.driverSession.findMany({
                select: { driverId: true, lastSeenAt: true },
                orderBy: { lastSeenAt: "desc" },
                take: 500,
            }),
        ]);

        const latestByDriver = new Map<string, Date | null>();
        for (const session of latestSessions) {
            if (!latestByDriver.has(session.driverId)) {
                latestByDriver.set(session.driverId, session.lastSeenAt);
            }
        }

        const now = Date.now();
        const onlineWindowMs = 10 * 60 * 1000;
        let online = 0;
        let offline = 0;

        latestByDriver.forEach((lastSeenAt) => {
            if (lastSeenAt && now - lastSeenAt.getTime() <= onlineWindowMs) {
                online += 1;
            } else {
                offline += 1;
            }
        });

        return NextResponse.json({
            ok: true,
            summary: {
                drivers: driverStatusCounts,
                live: { online, offline, total: online + offline },
                bookings: bookingStatusCounts,
                offers: assignmentStatusCounts,
                deliveries: deliveryStatusCounts,
            },
        });
    } catch (error) {
        console.error("Admin transport summary error:", error);
        return NextResponse.json({ error: "FETCH_TRANSPORT_SUMMARY_FAILED" }, { status: 500 });
    }
}
