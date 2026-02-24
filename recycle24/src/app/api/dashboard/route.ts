import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/demo-data";

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
            return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
        }

        if (isDemoMode) {
            return NextResponse.json({
                success: true,
                stats: {
                    totalSales: 45680000,
                    activeAuctions: 3,
                    activeDeals: 5,
                    walletBalance: 8300000,
                    loyaltyPoints: 2450,
                    monthlyRevenue: 12.5,
                },
                activeAuctions: [
                    {
                        id: "demo_1",
                        title: "طن حديد HMS",
                        currentBid: 18500000,
                        bidders: 8,
                        timeLeft: "4 ساعات",
                        status: "LIVE",
                    },
                    {
                        id: "demo_2",
                        title: "ألمنيوم نظيف",
                        currentBid: 12000000,
                        bidders: 5,
                        timeLeft: "1 يوم",
                        status: "LIVE",
                    },
                    {
                        id: "demo_3",
                        title: "نحاس أسلاك",
                        currentBid: 9200000,
                        bidders: 12,
                        timeLeft: "8 ساعات",
                        status: "LIVE",
                    },
                ],
                recentDeals: [
                    {
                        id: "DEAL-7782",
                        buyer: { id: "buyer_1", name: "محمد التجاري" },
                        material: "حديد",
                        amount: 15000000,
                        status: "COMPLETED",
                    },
                    {
                        id: "DEAL-7781",
                        buyer: { id: "buyer_2", name: "أحمد الصناعي" },
                        material: "نحاس",
                        amount: 8500000,
                        status: "PENDING",
                    },
                ],
            });
        }

        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
        }

        const [activeAuctions, recentDeals, wallet] = await Promise.all([
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
            db.wallet.findUnique({
                where: { userId },
                select: { balanceSYP: true },
            }),
        ]);

        const totalSales = recentDeals
            .filter((d: DealWithBuyer) => d.status === "COMPLETED")
            .reduce((sum: number, d: DealWithBuyer) => sum + d.totalAmount, 0);

        const activeDealsCount = await db.deal.count({
            where: {
                OR: [{ sellerId: userId }, { buyerId: userId }],
                status: { in: ["PENDING", "CONTRACT_SIGNED", "DEPOSIT_PAID"] },
            },
        });

        const now = new Date();
        const auctionsResponse = (activeAuctions as AuctionWithRelations[]).map((auction) => {
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
        });

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
                walletBalance: wallet?.balanceSYP || 0,
                loyaltyPoints: 0,
                monthlyRevenue: 0,
            },
            activeAuctions: auctionsResponse,
            recentDeals: dealsResponse,
        });
    } catch (error) {
        console.error("Get dashboard error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب لوحة التحكم" }, { status: 500 });
    }
}
