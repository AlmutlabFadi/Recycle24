import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

const OWNER_EMAIL = "emixdigitall@gmail.com";

export async function POST(req: Request) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { userId, enabled } = await req.json();

        if (typeof enabled !== "boolean") {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        const targetUser = await db.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
        });

        if (targetUser?.email === OWNER_EMAIL) {
            return NextResponse.json(
                { error: "لا يمكن تعديل وصول مالك المشروع" },
                { status: 403 }
            );
        }

        await db.$transaction(async (tx) => {
            // Update the flag
            await (tx.user.update as any)({
                where: { id: userId },
                data: { adminAccessEnabled: enabled },
            });

            // If disabling, invalidate all sessions immediately
            if (!enabled) {
                await tx.session.deleteMany({ where: { userId } });
            }

            // Log the action
            await tx.securityLog.create({
                data: {
                    userId: access.userId,
                    event: enabled ? "ENABLE_STAFF_ACCESS" : "DISABLE_STAFF_ACCESS",
                    details: `${enabled ? "Enabled" : "Disabled"} dashboard access for ${targetUser?.name}.`,
                    ip: req.headers.get("x-forwarded-for") || "unknown",
                    level: "MEDIUM",
                },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Access toggle error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
