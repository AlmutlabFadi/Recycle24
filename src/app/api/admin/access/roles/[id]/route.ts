import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const body = await request.json();
        const { name, description, permissionIds } = body;

        const role = await db.role.findUnique({ where: { id: (await context.params).id } });
        if (!role) {
            return NextResponse.json({ success: false, error: "Ø§Ù„Ø¯ÙˆØ± ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" }, { status: 404 });
        }

        if (role.isSystem && name) {
            return NextResponse.json({ success: false, error: "Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªØºÙŠÙŠØ± Ø§Ø³Ù… Ø§Ù„Ø¯ÙˆØ± Ø§Ù„Ù†Ø¸Ø§Ù…ÙŠ" }, { status: 400 });
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
        return NextResponse.json({ success: false, error: "ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¯ÙˆØ±" }, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const role = await db.role.findUnique({ where: { id: (await context.params).id } });
        if (!role) {
            return NextResponse.json({ success: false, error: "Ø§Ù„Ø¯ÙˆØ± ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" }, { status: 404 });
        }

        if (role.isSystem) {
            return NextResponse.json({ success: false, error: "Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø­Ø°Ù Ø¯ÙˆØ± Ù†Ø¸Ø§Ù…ÙŠ" }, { status: 400 });
        }

        await db.role.delete({ where: { id: role.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Role DELETE error:", error);
        return NextResponse.json({ success: false, error: "ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ø¯ÙˆØ±" }, { status: 500 });
    }
}

