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
        const driverId = searchParams.get("driverId")?.trim();
        const minutes = Math.min(parseInt(searchParams.get("minutes") || "120"), 720);

        if (!driverId) {
            return NextResponse.json({ error: "DRIVER_ID_REQUIRED" }, { status: 400 });
        }

        const since = new Date(Date.now() - minutes * 60 * 1000);

        const points = await db.driverLocationLog.findMany({
            where: { driverId, recordedAt: { gte: since } },
            orderBy: { recordedAt: "asc" },
            take: 500,
        });

        return NextResponse.json({
            ok: true,
            points: points.map((point) => ({ lat: point.lat, lng: point.lng, recordedAt: point.recordedAt })),
        });
    } catch (error) {
        console.error("Driver route fetch error:", error);
        return NextResponse.json({ error: "FETCH_DRIVER_ROUTE_FAILED" }, { status: 500 });
    }
}
