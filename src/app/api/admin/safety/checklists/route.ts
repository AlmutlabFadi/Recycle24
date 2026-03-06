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
        const search = searchParams.get("search") || undefined;
        const parsedLimit = parseInt(searchParams.get("limit") || "50", 10);
        const limit = Number.isNaN(parsedLimit) ? 50 : Math.min(parsedLimit, 200);

        const where: Record<string, any> = {};
        if (search) {
            where.OR = [
                { checklistName: { contains: search } },
                { user: { name: { contains: search } } },
                { user: { phone: { contains: search } } },
            ];
        }

        const submissions = await db.safetyChecklistSubmission.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                user: { select: { id: true, name: true, phone: true, companyName: true, userType: true } },
            },
        });

        return NextResponse.json({ success: true, submissions });
    } catch (error) {
        console.error("Admin safety checklists GET error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل التقييمات" },
            { status: 500 }
        );
    }
}
