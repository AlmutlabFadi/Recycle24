import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverProfile } from "@/lib/driver-auth";

export async function GET() {
    try {
        const guard = await requireDriverProfile();
        if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const rewards = await db.driverReward.findMany({
            where: { driverId: guard.driverId },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json({ ok: true, rewards });
    } catch (error) {
        console.error("Get driver rewards error:", error);
        return NextResponse.json({ error: "FETCH_DRIVER_REWARDS_FAILED" }, { status: 500 });
    }
}
