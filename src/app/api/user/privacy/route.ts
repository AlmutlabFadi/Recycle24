import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                showPhone: true,
                hideWarehouseLocation: true,
                allowFactoryContact: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
        }

        const auctionsCount = await db.auction.count({ where: { sellerId: userId } });
        const dealsCount = await db.deal.count({
            where: {
                OR: [{ sellerId: userId }, { buyerId: userId }],
            },
        });
        const bidsCount = await db.bid.count({ where: { bidderId: userId } });

        return NextResponse.json({
            success: true,
            privacySettings: {
                showPhone: user.showPhone,
                hideWarehouseLocation: user.hideWarehouseLocation,
                allowFactoryContact: user.allowFactoryContact,
            },
            accountStats: {
                memberSince: user.createdAt,
                auctionsCount,
                dealsCount,
                bidsCount,
            },
        });
    } catch (error) {
        console.error("Get privacy settings error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب إعدادات الخصوصية" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, action, ...data } = body;

        if (!userId) {
            return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
        }

        if (action === "updatePrivacy") {
            const user = await db.user.update({
                where: { id: userId },
                data: {
                    showPhone: data.showPhone,
                    hideWarehouseLocation: data.hideWarehouseLocation,
                    allowFactoryContact: data.allowFactoryContact,
                },
            });
            return NextResponse.json({
                success: true,
                message: "تم تحديث إعدادات الخصوصية",
                privacySettings: {
                    showPhone: user.showPhone,
                    hideWarehouseLocation: user.hideWarehouseLocation,
                    allowFactoryContact: user.allowFactoryContact,
                },
            });
        }

        if (action === "exportData") {
            const userData = await db.user.findUnique({
                where: { id: userId },
                include: {
                    auctions: true,
                    bids: true,
                    wallet: { include: { transactions: true } },
                    deals: { include: { transactions: true } },
                    alerts: true,
                },
            });

            return NextResponse.json({
                success: true,
                data: userData,
                message: "تم تصدير البيانات بنجاح",
            });
        }

        if (action === "deleteAccount") {
            await db.user.delete({
                where: { id: userId },
            });

            return NextResponse.json({
                success: true,
                message: "تم حذف الحساب بنجاح",
            });
        }

        return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
    } catch (error) {
        console.error("Update privacy settings error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء تحديث إعدادات الخصوصية" }, { status: 500 });
    }
}
