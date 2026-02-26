import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bootstrapAccessControl, requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
    try {
        await bootstrapAccessControl();
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const body = await request.json();
        const { name, description, permissionIds } = body;

        const role = await db.role.findUnique({ where: { id: context.params.id } });
        if (!role) {
            return NextResponse.json({ success: false, error: "الدور غير موجود" }, { status: 404 });
        }

        if (role.isSystem && name) {
            return NextResponse.json({ success: false, error: "لا يمكن تغيير اسم الدور النظامي" }, { status: 400 });
        }

        await db.$transaction(async (tx) => {
            await tx.role.update({
                where: { id: role.id },
                data: {
                    ...(name ? { name } : {}),
                    description: description === undefined ? undefined : description || null,
                },
            });

            if (Array.isArray(permissionIds)) {
                await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
                if (permissionIds.length) {
                    await tx.rolePermission.createMany({
                        data: permissionIds.map((permissionId: string) => ({ roleId: role.id, permissionId })),
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Role PATCH error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحديث الدور" }, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
    try {
        await bootstrapAccessControl();
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const role = await db.role.findUnique({ where: { id: context.params.id } });
        if (!role) {
            return NextResponse.json({ success: false, error: "الدور غير موجود" }, { status: 404 });
        }

        if (role.isSystem) {
            return NextResponse.json({ success: false, error: "لا يمكن حذف دور نظامي" }, { status: 400 });
        }

        await db.role.delete({ where: { id: role.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Role DELETE error:", error);
        return NextResponse.json({ success: false, error: "تعذر حذف الدور" }, { status: 500 });
    }
}
