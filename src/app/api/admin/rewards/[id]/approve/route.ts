import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { getRequestMeta } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const access = await requirePermission("MANAGE_REWARDS");
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        const rewardId = params.id;
        const reward = await db.driverReward.findUnique({ where: { id: rewardId } });
        if (!reward) {
            return NextResponse.json({ error: "REWARD_NOT_FOUND" }, { status: 404 });
        }

        const updated = await db.driverReward.update({
            where: { id: rewardId },
            data: { status: "APPROVED", approvedBy: access.userId, approvedAt: new Date() },
        });

        const { ip, userAgent } = getRequestMeta(request);
        await db.auditLog.create({
            data: {
                actorRole: "ADMIN",
                actorId: access.userId,
                action: "DRIVER_REWARD_APPROVED",
                entityType: "DriverReward",
                entityId: rewardId,
                afterJson: { status: "APPROVED" },
                ip,
                userAgent,
            },
        });

        return NextResponse.json({ ok: true, reward: updated });
    } catch (error) {
        console.error("Approve driver reward error:", error);
        return NextResponse.json({ error: "APPROVE_REWARD_FAILED" }, { status: 500 });
    }
}
