import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function GET() {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        // Fetch activity counts for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const logs = await db.securityLog.groupBy({
            by: ['userId'],
            where: {
                createdAt: { gte: thirtyDaysAgo },
                userId: { not: null }
            },
            _count: {
                _all: true
            }
        });

        // Fetch user details for these IDs
        const userIds = logs.map(l => l.userId as string);
        const users = await db.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                currentAdminStatus: true,
                userRoles: {
                    select: {
                        role: { select: { name: true } }
                    }
                }
            }
        });

        const leaderboard = logs.map(log => {
            const user = users.find(u => u.id === log.userId) as any;
            return {
                userId: log.userId,
                name: user?.name || "موظف مجهول",
                email: user?.email,
                role: user?.userRoles?.[0]?.role?.name || "بدون دور",
                score: log._count._all,
                status: user?.currentAdminStatus || "OFFLINE"
            };
        }).sort((a, b) => b.score - a.score);

        return NextResponse.json({ leaderboard });
    } catch (error) {
        console.error("Leaderboard fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
