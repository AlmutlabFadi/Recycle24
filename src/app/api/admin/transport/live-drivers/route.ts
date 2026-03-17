import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PERMISSIONS, requirePermission } from "@/lib/rbac";

const ONLINE_WINDOW_MINUTES = 10;

function isOnline(lastSeenAt?: Date | null) {
    if (!lastSeenAt) return false;
    const diffMs = Date.now() - lastSeenAt.getTime();
    return diffMs <= ONLINE_WINDOW_MINUTES * 60 * 1000;
}

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_DRIVERS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "200"), 500);

        const sessions = await db.driverSession.findMany({
            include: {
                driver: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        city: true,
                        status: true,
                        ratingAvg: true,
                    },
                },
            },
            orderBy: { lastSeenAt: "desc" },
            take: limit,
        });

        const latestByDriver = new Map<string, typeof sessions[number]>();
        for (const session of sessions) {
            if (!latestByDriver.has(session.driverId)) {
                latestByDriver.set(session.driverId, session);
            }
        }

        const drivers = Array.from(latestByDriver.values()).map((session) => ({
            driverId: session.driverId,
            fullName: session.driver.fullName,
            phone: session.driver.phone,
            city: session.driver.city,
            status: session.driver.status,
            ratingAvg: session.driver.ratingAvg,
            lastLat: session.lastLat,
            lastLng: session.lastLng,
            lastSeenAt: session.lastSeenAt,
            isOnline: isOnline(session.lastSeenAt),
            isAvailable: session.isAvailable,
            deviceId: session.deviceId,
        }));

        const online = drivers.filter((driver) => driver.isOnline).length;
        const offline = drivers.length - online;

        return NextResponse.json({ ok: true, drivers, stats: { online, offline, total: drivers.length } });
    } catch (error) {
        console.error("Admin live drivers error:", error);
        return NextResponse.json({ error: "FETCH_LIVE_DRIVERS_FAILED" }, { status: 500 });
    }
}
