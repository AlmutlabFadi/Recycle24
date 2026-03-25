import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

const OWNER_EMAIL = process.env.OWNER_EMAIL || "emixdigitall@gmail.com";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { id: targetUserId } = await params;

        // OWNER protection: cannot remove the project owner
        const targetUser = await db.user.findUnique({
            where: { id: targetUserId },
            select: { email: true },
        });

        if (targetUser?.email === OWNER_EMAIL) {
            return NextResponse.json(
                { error: "لا يمكن إزالة مالك المشروع من فريق العمل" },
                { status: 403 }
            );
        }

        await db.$transaction(async (tx) => {
            // Invalidate all active sessions for this user
            await tx.session.deleteMany({ where: { userId: targetUserId } });

            // 1. Remove all roles
            await tx.userRole.deleteMany({ where: { userId: targetUserId } });

            // 2. Revert User fields and set admin status
            await (tx.user.update as any)({
                where: { id: targetUserId },
                data: {
                    status: "REMOVED",
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
