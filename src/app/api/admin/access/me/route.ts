import { NextResponse } from "next/server";
import { PERMISSIONS, getSessionPermissions, requirePermission } from "@/lib/rbac";

export async function GET() {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const permissions = (await getSessionPermissions()) ?? [];
        return NextResponse.json({ success: true, permissions });
    } catch (error) {
        console.error("Access me error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل الصلاحيات" }, { status: 500 });
    }
}
