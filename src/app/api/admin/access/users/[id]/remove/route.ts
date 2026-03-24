import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const targetUserId = params.id;

        await db.$transaction(async (tx) => {
            // 1. Remove all roles
            await tx.userRole.deleteMany({
                where: { userId: targetUserId },
            });

            // 2. Revert User fields
            await tx.user.update({
                where: { id: targetUserId },
                data: {
                    userType: "CLIENT",
                    role: "CLIENT",
                    currentAdminStatus: "OFFLINE",
                },
            });

            // 3. Log the action
            await tx.securityLog.create({
                data: {
                    userId: access.userId,
                    event: "REMOVE_TEAM_MEMBER",
                    details: `Removed user ${targetUserId} from administrative team.`,
                    ip: req.headers.get("x-forwarded-for") || "unknown",
                    level: "HIGH",
                },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Remove team member error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
