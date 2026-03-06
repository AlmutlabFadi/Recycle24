import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // 1. Get user's points
        const userPoints = await db.recyclePoints.findUnique({
            where: { userId }
        });

        // 2. Get Leadboard (Top 10)
        const leaders = await db.recyclePoints.findMany({
            include: {
                user: {
                    select: { name: true, firstName: true, lastName: true, companyName: true }
                }
            },
            orderBy: { points: "desc" },
            take: 10
        });

        return NextResponse.json({ 
            success: true, 
            points: userPoints?.points || 0,
            leaders: leaders.map(l => ({
                name: l.user.companyName || l.user.name || `${l.user.firstName} ${l.user.lastName}`,
                points: l.points,
                avatar: null // Could add real avatar logic if needed
            }))
        });
    } catch (error) {
        console.error("Public rewards GET error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل بيانات المكافآت" }, { status: 500 });
    }
}
