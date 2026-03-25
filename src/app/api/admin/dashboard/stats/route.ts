import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const ADMIN_PERMISSIONS = new Set<string>([
  "MANAGE_USERS",
  "MANAGE_FINANCE",
  "FINANCE_FINAL_APPROVE",
  "MANAGE_DRIVERS",
  "REVIEW_DRIVER_DOCS",
  "MANAGE_SUPPORT",
  "MANAGE_REWARDS",
  "MANAGE_KNOWLEDGE",
  "UPLOAD_MEDIA",
  "MANAGE_ACCESS",
  "ACCESS_SAFETY",
  "ACCESS_CONSULTATIONS",
  "ACCESS_ACADEMY",
]);

function hasAdminAccess(user: { userType?: string | null; permissions?: string[] } | null | undefined) {
  if (!user) return false;
  if (user.userType === "ADMIN") return true;

  const permissions = user.permissions ?? [];
  return permissions.some((permission) => ADMIN_PERMISSIONS.has(permission));
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [
      userCount,
      pendingTraders,
      openTickets,
      dealStats,
      activeAuctions,
      revenueStats,
    ] = await Promise.all([
      db.user.count(),
      db.trader.count({
        where: { verificationStatus: { in: ["PENDING", "UNDER_REVIEW"] } },
      }),
      db.supportTicket.count({ where: { status: "OPEN" } }),
      db.deal.aggregate({
        _sum: { totalAmount: true, platformFee: true },
        _count: { id: true },
      }),
      db.auction.count({ where: { status: "LIVE" } }),
      db.userSubscription.aggregate({
        _sum: { pricePaid: true },
      }),
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
        },
      },
    });
  } catch (error) {
    console.error("Admin dashboard stats GET error:", error);
    return NextResponse.json(
      { success: false, error: "???? ????? ???????? ???? ??????" },
      { status: 500 }
    );
  }
}
