import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { specialization, roleTasks } = await req.json();
        const roleId = params.id;

        const role = await db.role.update({
            where: { id: roleId },
            data: {
                specialization,
                roleTasks: roleTasks || [],
            },
        });

        // Log the action
        await db.securityLog.create({
            data: {
                userId: access.userId,
                event: "UPDATE_ROLE_SPECIALIZATION",
                details: `Updated specialization for role ${role.name}: ${specialization}`,
                ip: req.headers.get("x-forwarded-for") || "unknown",
                level: "MEDIUM",
            },
        });

        return NextResponse.json({ success: true, role });
    } catch (error) {
        console.error("Update role specialization error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
