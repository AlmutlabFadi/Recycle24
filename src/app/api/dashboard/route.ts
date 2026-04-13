import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getUserWalletSummary } from "@/lib/ledger/wallet-summary";

interface AuctionWithRelations {
  id: string;
  title: string;
  startingBid: number;
  status: string;
  endsAt: Date | null;
  bids: { amount: number }[];
  _count: { bids: number };
}

interface DealWithBuyer {
  id: string;
  materialType: string;
  totalAmount: number;
  status: string;
  buyer: { id: string; name: string | null };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const [activeAuctions, recentDeals, walletSummary, activeDealsCount] =
      await Promise.all([
        db.auction.findMany({
          where: { sellerId: userId, status: "LIVE" },
          include: {
            _count: { select: { bids: true } },
            bids: { orderBy: { amount: "desc" }, take: 1 },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        db.deal.findMany({
          where: { sellerId: userId },
          include: { buyer: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        getUserWalletSummary(userId),
        db.deal.count({
          where: {
            OR: [{ sellerId: userId }, { buyerId: userId }],
            status: { in: ["PENDING", "CONTRACT_SIGNED", "DEPOSIT_PAID"] },
          },
        }),
      ]);

    const totalSales = (recentDeals as DealWithBuyer[])
      .filter((deal) => deal.status === "COMPLETED")
      .reduce((sum, deal) => sum + deal.totalAmount, 0);

    const now = new Date();

    const auctionsResponse = (activeAuctions as AuctionWithRelations[]).map(
      (auction) => {
        let timeLeft = "منتهي";

        if (auction.endsAt) {
          const diff = new Date(auction.endsAt).getTime() - now.getTime();

          if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(hours / 24);

            if (days > 0) {
              timeLeft = `${days} يوم`;
            } else if (hours > 0) {
              timeLeft = `${hours} ساعة`;
            } else {
              const minutes = Math.floor(diff / (1000 * 60));
              timeLeft = `${minutes} دقيقة`;
            }
          }
        }

        return {
          id: auction.id,
          title: auction.title,
          currentBid: auction.bids[0]?.amount || auction.startingBid,
          bidders: auction._count.bids,
          timeLeft,
          status: auction.status,
        };
      }
    );

    const dealsResponse = (recentDeals as DealWithBuyer[]).map((deal) => ({
      id: deal.id,
      buyer: deal.buyer,
      material: deal.materialType,
      amount: deal.totalAmount,
      status: deal.status,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalSales,
        activeAuctions: activeAuctions.length,
        activeDeals: activeDealsCount,
        walletBalance: walletSummary.syp.availableBalance,
        walletVerifiedBalance: walletSummary.syp.balance,
        walletHeldBalance: walletSummary.syp.heldAmount,
        loyaltyPoints: 0,
        monthlyRevenue: 0,
      },
      wallet: {
        availableBalanceSYP: walletSummary.syp.availableBalance,
        verifiedBalanceSYP: walletSummary.syp.balance,
        heldAmountSYP: walletSummary.syp.heldAmount,
        availableBalanceUSD: walletSummary.usd.availableBalance,
        verifiedBalanceUSD: walletSummary.usd.balance,
        heldAmountUSD: walletSummary.usd.heldAmount,
        isLocked: walletSummary.isLocked,
      },
      activeAuctions: auctionsResponse,
      recentDeals: dealsResponse,
    });
  } catch (error) {
    console.error("Get dashboard error:", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب لوحة التحكم" },
      { status: 500 }
    );
  }
}