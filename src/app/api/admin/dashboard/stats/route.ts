import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_USERS"); // Base admin check
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        const [
            userCount,
            pendingTraders,
            openTickets,
            dealStats,
            activeAuctions,
            revenueStats
        ] = await Promise.all([
            db.user.count(),
            db.trader.count({ where: { verificationStatus: { in: ["PENDING", "UNDER_REVIEW"] } } }),
            db.supportTicket.count({ where: { status: "OPEN" } }),
            db.deal.aggregate({
                _sum: { totalAmount: true, platformFee: true },
                _count: { id: true }
            }),
            db.auction.count({ where: { status: "LIVE" } }),
            db.userSubscription.aggregate({
                _sum: { pricePaid: true }
            })
        ]);

        return NextResponse.json({
            success: true,
            stats: {
                users: {
                    total: userCount,
                },
                verification: {
                    pending: pendingTraders,
                },
                support: {
                    open: openTickets,
                },
                financial: {
                    totalVolume: dealStats._sum.totalAmount || 0,
                    totalFees: dealStats._sum.platformFee || 0,
                    subscriptionRevenue: revenueStats._sum.pricePaid || 0,
                    dealCount: dealStats._count.id || 0,
                },
                auctions: {
                    active: activeAuctions,
                }
            }
        });
    } catch (error) {
        console.error("Admin dashboard stats GET error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل إحصائيات لوحة التحكم" }, { status: 500 });
    }
}
