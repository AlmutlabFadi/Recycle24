import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const { status } = await req.json(); // ONLINE or IDLE

        const now = new Date();

        // 1. Update User's basic status and last active time
        await db.user.update({
            where: { id: userId },
            data: {
                lastActiveAt: now,
                currentAdminStatus: status === "IDLE" ? "IDLE" : "ONLINE",
            },
        });

        // 2. Manage StaffActivity Log
        // Find the most recent active log for this user
        const lastLog = await db.staffActivity.findFirst({
            where: { userId, endTime: null },
            orderBy: { startTime: "desc" },
        });

        if (lastLog) {
            if (lastLog.status !== status) {
                // Status changed: Close the previous log and start a new one
                const duration = Math.floor((now.getTime() - lastLog.startTime.getTime()) / 1000);
                await db.staffActivity.update({
                    where: { id: lastLog.id },
                    data: {
                        endTime: now,
                        duration,
                    },
                });

                await db.staffActivity.create({
                    data: {
                        userId,
                        status,
                        startTime: now,
                    },
                });
            } else {
                // Same status: just keep it open, maybe update a "lastContentAt" if we had one
                // For now, simple transition-based logging is enough.
            }
        } else {
            // No open log: Start a new one
            await db.staffActivity.create({
                data: {
                    userId,
                    status,
                    startTime: now,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Heartbeat error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
