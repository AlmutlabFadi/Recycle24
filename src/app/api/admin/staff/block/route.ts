import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

const OWNER_EMAIL = process.env.OWNER_EMAIL || "emixdigitall@gmail.com";

export async function POST(req: Request) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { userId, reason } = await req.json();

        // Check if target is the OWNER — cannot be blocked
        const targetUser = await db.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
        });

        if (targetUser?.email === OWNER_EMAIL) {
            return NextResponse.json(
                { error: "لا يمكن حظر مالك المشروع" },
                { status: 403 }
            );
        }

        await db.$transaction(async (tx) => {
            // 0. Invalidate all active sessions for this user
            await tx.session.deleteMany({ where: { userId } });

            // 1. Lock the account
            await tx.user.update({
                where: { id: userId },
                data: {
                    isLocked: true,
                    lockReason: reason || "تم الحظر بواسطة الإدارة",
                    currentAdminStatus: "OFFLINE",
                } as any,
            });

            // 2. Remove all roles
            await tx.userRole.deleteMany({
                where: { userId },
            });

            // 3. Revert to CLIENT
            await tx.user.update({
                where: { id: userId },
                data: {
                    userType: "CLIENT",
                    role: "CLIENT",
                },
            });

            // 4. Log the action
            await tx.securityLog.create({
                data: {
                    userId: access.userId,
                    event: "BLOCK_STAFF_ACCOUNT",
                    details: `Blocked account ${targetUser?.name} (${targetUser?.email}). Reason: ${reason}`,
                    ip: req.headers.get("x-forwarded-for") || "unknown",
                    level: "HIGH",
                },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Block staff error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
