import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface SessionUser {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string;
    userType?: string;
}

// POST /api/auctions/[id]/bid - تقديم مزايدة جديدة
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "يجب تسجيل الدخول للمزايدة" },
                { status: 401 }
            );
        }

        const sessionUser = session.user as SessionUser;
        const bidderId = sessionUser.id;

        if (!bidderId) {
            return NextResponse.json(
                { error: "معلومات المستخدم غير صالحة" },
                { status: 401 }
            );
        }

        const { id: auctionId } = await params;
        const body = await request.json();
        const { amount } = body;

        // التحقق من البيانات
        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: "مبلغ المزايدة مطلوب ويجب أن يكون أكبر من صفر" },
                { status: 400 }
            );
        }

        // جلب المزاد
        const auction = await db.auction.findUnique({
            where: { id: auctionId },
            include: {
                bids: {
                    orderBy: { amount: "desc" },
                    take: 1,
                },
            },
        });

        if (!auction) {
            return NextResponse.json(
                { error: "المزاد غير موجود" },
                { status: 404 }
            );
        }

        // التحقق من حالة المزاد
        if (auction.status !== "LIVE") {
            return NextResponse.json(
                { error: "المزاد غير نشط حالياً" },
                { status: 400 }
            );
        }

        // التحقق من انتهاء وقت المزاد
        if (auction.endsAt && new Date() > auction.endsAt) {
            return NextResponse.json(
                { error: "انتهى وقت المزاد" },
                { status: 400 }
            );
        }

        // التحقق من أن المزايدة أعلى من الحالية
        const currentHighest = auction.bids[0]?.amount || auction.startingBid;
        if (amount <= currentHighest) {
            return NextResponse.json(
                { error: `يجب أن تكون المزايدة أعلى من ${currentHighest.toLocaleString()} ل.س` },
                { status: 400 }
            );
        }

        // التحقق من أن البائع لا يزايد على مزاده
        if (auction.sellerId === bidderId) {
            return NextResponse.json(
                { error: "لا يمكنك المزايدة على مزادك الخاص" },
                { status: 400 }
            );
        }

        // إنشاء المزايدة
        const bid = await db.bid.create({
            data: {
                auctionId,
                bidderId,
                amount: parseFloat(amount.toString()),
            },
            include: {
                bidder: {
                    select: { id: true, name: true },
                },
            },
        });

        // تمديد وقت المزاد إذا كان قريباً من الانتهاء (آخر دقيقتين)
        if (auction.endsAt) {
            const timeRemaining = auction.endsAt.getTime() - Date.now();
            if (timeRemaining < 2 * 60 * 1000) { // أقل من دقيقتين
                const newEndsAt = new Date(Date.now() + 2 * 60 * 1000); // تمديد دقيقتين
                await db.auction.update({
                    where: { id: auctionId },
                    data: { endsAt: newEndsAt },
                });
            }
        }

        return NextResponse.json({
            success: true,
            bid: {
                id: bid.id,
                amount: bid.amount,
                bidder: bid.bidder,
                createdAt: bid.createdAt,
            },
            message: "تم تقديم المزايدة بنجاح",
        });
    } catch (error) {
        console.error("Place bid error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء تقديم المزايدة" },
            { status: 500 }
        );
    }
}

// GET /api/auctions/[id]/bid - الحصول على قائمة المزايدات
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: auctionId } = await params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "20");

        const bids = await db.bid.findMany({
            where: { auctionId },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                bidder: {
                    select: { id: true, name: true },
                },
            },
        });

        const total = await db.bid.count({ where: { auctionId } });

        return NextResponse.json({
            success: true,
            bids: bids.map((bid: { id: string; amount: number; bidder: { id: string; name: string | null }; createdAt: Date }) => ({
                id: bid.id,
                amount: bid.amount,
                bidder: bid.bidder,
                createdAt: bid.createdAt,
            })),
            total,
        });
    } catch (error) {
        console.error("Get bids error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء جلب المزايدات" },
            { status: 500 }
        );
    }
}
