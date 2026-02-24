import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

        const trader = await db.trader.findUnique({
            where: { userId },
            include: {
                documents: true,
            },
        });

        if (!trader) {
            return NextResponse.json({
                success: true,
                trader: null,
                verificationStatus: "NOT_STARTED",
            });
        }

        return NextResponse.json({
            success: true,
            trader,
            verificationStatus: trader.verificationStatus,
        });
    } catch (error) {
        console.error("Get verification error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء جلب بيانات التوثيق" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, businessName, licenseNumber, location } = body;

        if (!userId || !businessName) {
            return NextResponse.json(
                { error: "جميع الحقول الأساسية مطلوبة" },
                { status: 400 }
            );
        }

        const existingTrader = await db.trader.findUnique({
            where: { userId },
        });

        let trader;
        if (existingTrader) {
            trader = await db.trader.update({
                where: { userId },
                data: {
                    businessName,
                    licenseNumber,
                    location,
                    verificationStatus: "UNDER_REVIEW",
                },
            });
        } else {
            trader = await db.trader.create({
                data: {
                    userId,
                    businessName,
                    licenseNumber,
                    location,
                    verificationStatus: "UNDER_REVIEW",
                },
            });
        }

        await db.user.update({
            where: { id: userId },
            data: { status: "UNDER_REVIEW" },
        });

        return NextResponse.json({
            success: true,
            trader,
            message: "تم إرسال طلب التوثيق بنجاح، سيتم مراجعته خلال 24-48 ساعة",
        });
    } catch (error) {
        console.error("Create verification error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء إرسال طلب التوثيق" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { traderId, documentType, fileUrl } = body;

        if (!traderId || !documentType || !fileUrl) {
            return NextResponse.json(
                { error: "جميع الحقول مطلوبة" },
                { status: 400 }
            );
        }

        const document = await db.traderDocument.create({
            data: {
                traderId,
                type: documentType,
                fileUrl,
                status: "PENDING",
            },
        });

        return NextResponse.json({
            success: true,
            document,
            message: "تم رفع المستند بنجاح",
        });
    } catch (error) {
        console.error("Upload document error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء رفع المستند" },
            { status: 500 }
        );
    }
}
