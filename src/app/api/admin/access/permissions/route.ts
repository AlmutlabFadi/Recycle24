import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bootstrapAccessControl, requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function GET() {
    try {
        await bootstrapAccessControl();
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const permissions = await db.permission.findMany({
            orderBy: { key: "asc" },
        });

        return NextResponse.json({ success: true, permissions });
    } catch (error) {
        console.error("Access permissions GET error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل الصلاحيات" }, { status: 500 });
    }
}
