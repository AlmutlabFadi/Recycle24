import { NextRequest, NextResponse } from "next/server";
import { getUserPermissions, hasCenterAccess, requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_KNOWLEDGE");
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const permissions = await getUserPermissions(access.userId!);
        if (!hasCenterAccess(permissions, "SAFETY")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || undefined;
        const severity = searchParams.get("severity") || undefined;
        const search = searchParams.get("search") || undefined;
        const parsedLimit = parseInt(searchParams.get("limit") || "50", 10);
        const limit = Number.isNaN(parsedLimit) ? 50 : Math.min(parsedLimit, 200);

        const where: Record<string, any> = {
            ...(status && status !== "ALL" ? { status } : {}),
            ...(severity && severity !== "ALL" ? { severity } : {}),
        };

        if (search) {
            where.OR = [
                { reporterName: { contains: search } },
                { reporterPhone: { contains: search } },
                { incidentType: { contains: search } },
                { location: { contains: search } },
                { city: { contains: search } },
                { governorate: { contains: search } },
            ];
        }

        const incidents = await db.safetyIncidentReport.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                statusLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });

        return NextResponse.json({ success: true, incidents });
    } catch (error) {
        console.error("Admin safety incidents GET error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل البلاغات" },
            { status: 500 }
        );
    }
}
