import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bootstrapAccessControl, requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function GET(request: NextRequest) {
    try {
        await bootstrapAccessControl();
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { searchParams } = new URL(request.url);
        const q = (searchParams.get("q") || "").trim();

        const users = await db.user.findMany({
            where: q
                ? {
                      OR: [
                          { email: { contains: q, mode: "insensitive" } },
                          { phone: { contains: q } },
                          { name: { contains: q, mode: "insensitive" } },
                      ],
                  }
                : undefined,
            take: 20,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                status: true,
                userRoles: { select: { role: { select: { id: true, name: true } } } },
            },
        });

        return NextResponse.json({ success: true, users });
    } catch (error) {
        console.error("User search error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل المستخدمين" }, { status: 500 });
    }
}
