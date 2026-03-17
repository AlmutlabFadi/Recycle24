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
        const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100);
        const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

        const where = status && status !== "all" ? { status: status as any } : {};

        const [drivers, total] = await Promise.all([
            db.driver.findMany({
                where,
                include: {
                    user: { select: { name: true, phone: true, email: true, createdAt: true } },
                    vehicles: true,
                    documents: true,
                },
                orderBy: { updatedAt: "desc" },
                take: limit,
                skip: offset,
            }),
            db.driver.count({ where }),
        ]);

        return NextResponse.json({ ok: true, drivers, total });
    } catch (error) {
        console.error("Admin transport drivers error:", error);
        return NextResponse.json({ error: "FETCH_TRANSPORT_DRIVERS_FAILED" }, { status: 500 });
    }
}
