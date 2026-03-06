import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { getRequestMeta } from "@/lib/audit";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_REWARDS");
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const rankings = await db.recyclePoints.findMany({
            include: {
                user: {
                    select: { name: true, phone: true, email: true, firstName: true, lastName: true }
                }
            },
            orderBy: { points: "desc" },
            take: Math.min(limit, 100),
        });

        return NextResponse.json({ success: true, rankings });
    } catch (error) {
        console.error("Admin rewards GET error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل بيانات المكافآت" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_REWARDS");
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        const body = await request.json();
        const { userId, points, driverId, type, amount, reason, referenceId } = body || {};

        if (driverId && type && typeof amount === "number") {
            const reward = await db.driverReward.create({
                data: {
                    driverId,
                    type,
                    amount,
                    reason: reason || "-",
                    referenceId: referenceId || null,
                },
            });

            const { ip, userAgent } = getRequestMeta(request);
            await db.auditLog.create({
                data: {
                    actorRole: "ADMIN",
                    actorId: access.userId,
                    action: "DRIVER_REWARD_CREATED",
                    entityType: "DriverReward",
                    entityId: reward.id,
                    afterJson: { driverId, type, amount, referenceId },
                    ip,
                    userAgent,
                },
            });

            return NextResponse.json({ success: true, reward });
        }

        if (!userId || typeof points !== "number") {
            return NextResponse.json({ success: false, error: "بيانات غير مكتملة" }, { status: 400 });
        }

        const updatedPoints = await db.recyclePoints.upsert({
            where: { userId },
            update: {
                points: { increment: points },
            },
            create: {
                userId,
                points,
            }
        });

        return NextResponse.json({ success: true, points: updatedPoints });
    } catch (error) {
        console.error("Admin rewards POST error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحديث النقاط" }, { status: 500 });
    }
}
