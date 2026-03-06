import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverProfile } from "@/lib/driver-auth";

export async function GET(request: NextRequest) {
    try {
        const guard = await requireDriverProfile();
        if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const where: { driverId: string; status?: string } = { driverId: guard.driverId };
        if (status) where.status = status;

        const deliveries = await db.delivery.findMany({
            where,
            include: { order: true, pod: true },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json({ ok: true, deliveries });
    } catch (error) {
        console.error("Get driver deliveries error:", error);
        return NextResponse.json({ error: "FETCH_DRIVER_DELIVERIES_FAILED" }, { status: 500 });
    }
}
