import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_FINANCE");
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || undefined;
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const deals = await db.deal.findMany({
            where: {
                ...(status ? { status } : {}),
            },
            include: {
                buyer: { select: { name: true, phone: true, email: true } },
                seller: { select: { name: true, phone: true, email: true } },
                transactions: {
                    orderBy: { createdAt: "desc" }
                },
            },
            orderBy: { createdAt: "desc" },
            take: Math.min(limit, 200),
        });

        // Summary calculations
        const [totalStats, completedStats] = await Promise.all([
            db.deal.aggregate({
                _sum: { totalAmount: true, platformFee: true },
                _count: { id: true }
            }),
            db.deal.aggregate({
                where: { status: "COMPLETED" },
                _sum: { totalAmount: true, platformFee: true },
                _count: { id: true }
            })
        ]);

        return NextResponse.json({ 
            success: true, 
            deals,
            summary: {
                totalVolume: totalStats._sum.totalAmount || 0,
                totalFees: totalStats._sum.platformFee || 0,
                totalCount: totalStats._count.id || 0,
                completedVolume: completedStats._sum.totalAmount || 0,
                completedCount: completedStats._count.id || 0,
            }
        });
    } catch (error) {
        console.error("Admin deals GET error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل بيانات الصفقات" },
            { status: 500 }
        );
    }
}
