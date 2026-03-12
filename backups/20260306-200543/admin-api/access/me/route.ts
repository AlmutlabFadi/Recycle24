import { NextResponse } from "next/server";
import { bootstrapAccessControl, getSessionUserId, getUserPermissions } from "@/lib/rbac";

export async function GET() {
    try {
        await bootstrapAccessControl();
        const userId = await getSessionUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const permissions = await getUserPermissions(userId);
        return NextResponse.json({ success: true, permissions });
    } catch (error) {
        console.error("Access me error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل الصلاحيات" }, { status: 500 });
    }
}
