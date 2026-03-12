import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_USERS");
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        const { searchParams } = new URL(request.url);
        const userType = searchParams.get("type") || "ALL"; // CLIENT, TRADER, DRIVER, GOVERNMENT, ALL

        const users = await db.user.findMany({
            where: userType === "ALL" ? {} : { userType },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                userType: true,
                status: true,
                isVerified: true,
                createdAt: true,
                subscription: { select: { plan: true, status: true } },
                wallet: { select: { balanceSYP: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 100
        });

        return NextResponse.json({ success: true, users });
    } catch (error) {
        console.error("Admin users GET error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل قائمة المستخدمين" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_USERS");
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        const { id, status, isVerified, userType, banReason } = await request.json();

        if (!id) return NextResponse.json({ success: false, error: "معرف المستخدم مطلوب" }, { status: 400 });

        const updatedUser = await db.user.update({
            where: { id },
            data: {
                status: status || undefined,
                isVerified: isVerified !== undefined ? isVerified : undefined,
                userType: userType || undefined,
                lockReason: banReason || undefined,
                isLocked: status === "BANNED"
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Admin user PATCH error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحديث بيانات المستخدم" }, { status: 500 });
    }
}
