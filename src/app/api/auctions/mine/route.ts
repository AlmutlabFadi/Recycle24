import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/auctions/mine - Get current user's auctions
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const auctions = await db.auction.findMany({
            where: { sellerId: (session.user as { id: string }).id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                category: true,
                weight: true,
                weightUnit: true,
                
                pricingMode: true,
                startingBidCurrency: true,
                startingBidUnit: true,
                startingBid: true,
                buyNowPriceCurrency: true,
                buyNowPrice: true,
                securityDepositCurrency: true,
                securityDeposit: true,
                securityDepositMethod: true,
                
                location: true,
                status: true,
                workflowStatus: true,
                scheduledAt: true,
                createdAt: true,
                endsAt: true,
                duration: true,
                
                items: { orderBy: { createdAt: "asc" } },
                images: { orderBy: { order: "asc" } },
            },
        });

        return NextResponse.json({ success: true, auctions });
    } catch (error) {
        console.error("Get my auctions error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب مزاداتك" }, { status: 500 });
    }
}
