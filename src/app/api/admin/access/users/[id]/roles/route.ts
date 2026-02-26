import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bootstrapAccessControl, requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await bootstrapAccessControl();
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const body = await request.json();
        const { roleIds } = body;

        if (!Array.isArray(roleIds)) {
            return NextResponse.json({ success: false, error: "قائمة الأدوار مطلوبة" }, { status: 400 });
        }

        await db.$transaction(async (tx) => {
            await tx.userRole.deleteMany({ where: { userId: (await context.params).id } });
            if (roleIds.length) {
                await tx.userRole.createMany({
                    data: roleIds.map((roleId: string) => ({ userId: (await context.params).id, roleId })),
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("User roles update error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحديث أدوار المستخدم" }, { status: 500 });
    }
}
