import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function GET(req: Request) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { searchParams } = new URL(req.url);
        const staffId = searchParams.get("staffId");
        const days = parseInt(searchParams.get("days") || "7");

        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);

        const logs = await db.staffActivity.findMany({
            where: {
                ...(staffId ? { userId: staffId } : {}),
                startTime: { gte: dateLimit },
            },
            include: {
                user: {
                    select: {
                        name: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            },
            orderBy: {
                startTime: "desc",
            },
        });

        return NextResponse.json({ success: true, logs });
    } catch (error) {
        console.error("Activity logs fetch error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
