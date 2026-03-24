import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function GET(req: Request) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const period = searchParams.get("period") || "today"; // today, week, month
        const customStart = searchParams.get("startDate");
        const customEnd = searchParams.get("endDate");

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        let endDate = now;

        if (period === "today") {
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
        } else if (period === "week") {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === "month") {
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 1);
        } else {
            startDate = customStart ? new Date(customStart) : new Date(now.setHours(0, 0, 0, 0));
            endDate = customEnd ? new Date(customEnd) : now;
        }

        // Build query
        const where: any = {
            startTime: { gte: startDate, lte: endDate },
        };
        if (userId) where.userId = userId;

        // Fetch all activity segments
        const activities = await db.staffActivity.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
            orderBy: { startTime: "asc" },
        });

        // Group by user and calculate totals
        const userMap = new Map<string, {
            userId: string;
            name: string;
            email: string;
            totalOnline: number;
            totalIdle: number;
            totalOffline: number;
            totalBreak: number;
            sessions: Array<{
                startTime: string;
                endTime: string | null;
                status: string;
                duration: number;
            }>;
        }>();

        for (const act of activities) {
            const uid = act.userId;
            if (!userMap.has(uid)) {
                userMap.set(uid, {
                    userId: uid,
                    name: act.user?.name || "بدون اسم",
                    email: act.user?.email || "",
                    totalOnline: 0,
                    totalIdle: 0,
                    totalOffline: 0,
                    totalBreak: 0,
                    sessions: [],
                });
            }

            const entry = userMap.get(uid)!;
            const dur = act.duration || (act.endTime
                ? Math.floor((act.endTime.getTime() - act.startTime.getTime()) / 1000)
                : Math.floor((now.getTime() - act.startTime.getTime()) / 1000));

            // Accumulate by status
            if (act.status === "ONLINE") entry.totalOnline += dur;
            else if (act.status === "IDLE") entry.totalIdle += dur;
            else if (act.status === "OFFLINE") entry.totalOffline += dur;
            else if (act.status === "BREAK") entry.totalBreak += dur;

            entry.sessions.push({
                startTime: act.startTime.toISOString(),
                endTime: act.endTime?.toISOString() || null,
                status: act.status,
                duration: dur,
            });
        }

        const summaries = Array.from(userMap.values());

        return NextResponse.json({
            period,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            summaries,
        });
    } catch (error) {
        console.error("Activity summary error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
