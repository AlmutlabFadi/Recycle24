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
        const search = searchParams.get("search") || undefined;
        const parsedLimit = parseInt(searchParams.get("limit") || "50", 10);
        const limit = Number.isNaN(parsedLimit) ? 50 : Math.min(parsedLimit, 200);

        const where: Record<string, any> = {
            ...(status && status !== "ALL" ? { status } : {}),
        };

        if (search) {
            where.OR = [
                { requesterName: { contains: search } },
                { requesterPhone: { contains: search } },
                { requestedSessionTitle: { contains: search } },
                { location: { contains: search } },
            ];
        }

        const requests = await db.safetyTrainingRequest.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                session: {
                    select: {
                        title: true,
                        startDate: true,
                        location: true,
                    },
                },
            },
        });

        return NextResponse.json({ success: true, requests });
    } catch (error) {
        console.error("Admin training requests GET error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل طلبات التدريب" },
            { status: 500 }
        );
    }
}
