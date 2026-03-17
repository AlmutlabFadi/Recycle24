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
        const status = searchParams.get("status") || "all";
        const limit = Math.min(parseInt(searchParams.get("limit") || "40"), 120);
        const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

        const where = status && status !== "all" ? { status: status as any } : {};

        const [deliveries, total] = await Promise.all([
            db.delivery.findMany({
                where,
                include: {
                    order: true,
                    driver: { select: { fullName: true, phone: true, ratingAvg: true } },
                    pod: true,
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            db.delivery.count({ where }),
        ]);

        return NextResponse.json({ ok: true, deliveries, total });
    } catch (error) {
        console.error("Admin transport deliveries error:", error);
        return NextResponse.json({ error: "FETCH_TRANSPORT_DELIVERIES_FAILED" }, { status: 500 });
    }
}
