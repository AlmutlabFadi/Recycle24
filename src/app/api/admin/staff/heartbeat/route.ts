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
        const { status } = await req.json(); // ONLINE, IDLE, OFFLINE, BREAK

        // 🛡️ SECURITY CHECK: Verify real-time access status
        const dbUser = await (db.user.findUnique as any)({
            where: { id: userId },
            select: { adminAccessEnabled: true, userType: true }
        });

        if (!dbUser || (dbUser as any).adminAccessEnabled === false || (dbUser as any).userType !== 'ADMIN') {
            return NextResponse.json({ 
                success: true, 
                authorized: false, 
                message: "Access revoked or invalid user type" 
            });
        }

        const now = new Date();

        // 1. Update User's status and last active time
        await db.$executeRawUnsafe(
            `UPDATE "User" SET "lastActiveAt" = $1, "currentAdminStatus" = $2 WHERE "id" = $3`,
            now,
            status === "BREAK" ? "BREAK" : status === "IDLE" ? "IDLE" : status === "OFFLINE" ? "OFFLINE" : "ONLINE",
            userId
        );

        // 2. Manage StaffActivity session log
        const lastLog = await (db as any).staffActivity.findFirst({
            where: { userId, endTime: null },
            orderBy: { startTime: "desc" },
        });

        if (lastLog) {
            if (lastLog.status !== status) {
                // Status changed: Close the previous segment and start a new one
                const duration = Math.floor((now.getTime() - lastLog.startTime.getTime()) / 1000);
                await (db as any).staffActivity.update({
                    where: { id: lastLog.id },
                    data: {
                        endTime: now,
                        duration,
                    },
                });

                await (db as any).staffActivity.create({
                    data: {
                        userId,
                        status,
                        startTime: now,
                    },
                });
            }
            // Same status: keep the segment open
        } else {
            // No open segment: Start a new one (login event)
            await (db as any).staffActivity.create({
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
