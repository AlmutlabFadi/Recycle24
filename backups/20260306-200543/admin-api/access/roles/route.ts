import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bootstrapAccessControl, requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function GET() {
    try {
        await bootstrapAccessControl();
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const roles = await db.role.findMany({
            orderBy: { createdAt: "asc" },
            include: {
                rolePermissions: {
                    select: { permission: { select: { id: true, key: true, label: true } } },
                },
                userRoles: { select: { userId: true } },
            },
        });

        return NextResponse.json({ success: true, roles });
    } catch (error) {
        console.error("Roles GET error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل الأدوار" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await bootstrapAccessControl();
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const body = await request.json();
        const { name, description, permissionIds } = body;

        if (!name || !Array.isArray(permissionIds)) {
            return NextResponse.json({ success: false, error: "البيانات غير مكتملة" }, { status: 400 });
        }

        const role = await db.role.create({
            data: {
                name,
                description: description || null,
                isSystem: false,
                rolePermissions: {
                    createMany: {
                        data: permissionIds.map((permissionId: string) => ({ permissionId })),
                    },
                },
            },
        });

        return NextResponse.json({ success: true, role });
    } catch (error) {
        console.error("Roles POST error:", error);
        return NextResponse.json({ success: false, error: "تعذر إنشاء الدور" }, { status: 500 });
    }
}
