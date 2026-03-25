import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS, bootstrapAccessControl } from "@/lib/rbac";

export async function GET() {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        // On-demand sync of permissions in database with the file-based definitions
        await bootstrapAccessControl();

        const permissions = await db.permission.findMany({
            orderBy: { key: "asc" },
        });

        return NextResponse.json({ success: true, permissions });
    } catch (error) {
        console.error("Access permissions GET error:", error);
        return NextResponse.json({ success: false, error: "ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª" }, { status: 500 });
    }
}

