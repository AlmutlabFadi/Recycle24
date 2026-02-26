import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bootstrapAccessControl, requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function PATCH(_: Request, context: { params: Promise<{ id: string }> }) {
    try {
        await bootstrapAccessControl();
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        await db.staffInvite.update({
            where: { id: (await context.params).id },
            data: { status: "REVOKED" },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Invite revoke error:", error);
        return NextResponse.json({ success: false, error: "تعذر إلغاء الدعوة" }, { status: 500 });
    }
}
