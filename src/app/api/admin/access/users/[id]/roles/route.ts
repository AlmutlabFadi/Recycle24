import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const body = await request.json();
        const { roleIds } = body;

        if (!Array.isArray(roleIds)) {
            return NextResponse.json({ success: false, error: "Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø£Ø¯ÙˆØ§Ø± Ù…Ø·Ù„ÙˆØ¨Ø©" }, { status: 400 });
        }

        await db.$transaction(async (tx) => {
            const params = await context.params;
            await tx.userRole.deleteMany({ where: { userId: params.id } });
            if (roleIds.length) {
                await tx.userRole.createMany({
                    data: roleIds.map((roleId: string) => ({ userId: params.id, roleId })),
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("User roles update error:", error);
        return NextResponse.json({ success: false, error: "ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ø£Ø¯ÙˆØ§Ø± Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…" }, { status: 500 });
    }
}

