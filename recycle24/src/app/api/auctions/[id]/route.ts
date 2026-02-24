import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/auctions/[id] - الحصول على تفاصيل مزاد واحد
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const auction = await db.auction.findUnique({
            where: { id },
            include: {
                seller: {
                    select: { id: true, name: true, phone: true },
                },
                bids: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                    include: {
                        bidder: {
                            select: { id: true, name: true },
                        },
                    },
                },
                images: {
                    orderBy: { order: "asc" },
                },
            },
        });

        if (!auction) {
            return NextResponse.json(
                { error: "المزاد غير موجود" },
                { status: 404 }
            );
        }

        // حساب أعلى مزايدة
        const highestBid = auction.bids[0]?.amount || auction.startingBid;
        const bidsCount = await db.bid.count({ where: { auctionId: id } });

        // تحويل البيانات للواجهة
        const auctionResponse = {
            id: auction.id,
            title: auction.title,
            category: auction.category,
            weight: auction.weight,
            weightUnit: auction.weightUnit,
            location: auction.location,
            startingBid: auction.startingBid,
            buyNowPrice: auction.buyNowPrice,
            currentBid: highestBid,
            status: auction.status,
            duration: auction.duration,
            scheduledAt: auction.scheduledAt,
            startedAt: auction.startedAt,
            endsAt: auction.endsAt,
            winnerId: auction.winnerId,
            finalPrice: auction.finalPrice,
            createdAt: auction.createdAt,
            seller: auction.seller,
            images: auction.images,
            bidsCount,
            recentBids: auction.bids.map((bid: { id: string; amount: number; bidder: { id: string; name: string | null }; createdAt: Date }) => ({
                id: bid.id,
                amount: bid.amount,
                bidder: bid.bidder,
                createdAt: bid.createdAt,
            })),
        };

        return NextResponse.json({
            success: true,
            auction: auctionResponse,
        });
    } catch (error) {
        console.error("Get auction error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء جلب المزاد" },
            { status: 500 }
        );
    }
}

// DELETE /api/auctions/[id] - حذف مزاد
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // التحقق من وجود المزاد
        const auction = await db.auction.findUnique({
            where: { id },
        });

        if (!auction) {
            return NextResponse.json(
                { error: "المزاد غير موجود" },
                { status: 404 }
            );
        }

        // حذف المزاد (سيتم حذف الصور والمزايدات تلقائياً بسبب cascade)
        await db.auction.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "تم حذف المزاد بنجاح",
        });
    } catch (error) {
        console.error("Delete auction error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء حذف المزاد" },
            { status: 500 }
        );
    }
}
