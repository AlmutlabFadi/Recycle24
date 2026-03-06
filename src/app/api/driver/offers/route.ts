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

        const offers = await db.deliveryAssignment.findMany({
            where,
            include: { order: true },
            orderBy: { offeredAt: "desc" },
            take: 100,
        });

        return NextResponse.json({ ok: true, offers });
    } catch (error) {
        console.error("Get driver offers error:", error);
        return NextResponse.json({ error: "FETCH_DRIVER_OFFERS_FAILED" }, { status: 500 });
    }
}
