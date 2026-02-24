import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/deals - الحصول على قائمة الصفقات
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        const where: { status?: string; sellerId?: string; buyerId?: string; OR?: Array<{ sellerId: string } | { buyerId: string }> } = {};
        
        if (userId) {
            where.OR = [
                { sellerId: userId },
                { buyerId: userId },
            ];
        }

        if (status) {
            where.status = status;
        }

        const deals = await db.deal.findMany({
            where,
            include: {
                seller: {
                    select: { id: true, name: true, phone: true },
                },
                buyer: {
                    select: { id: true, name: true, phone: true },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await db.deal.count({ where });

        return NextResponse.json({
            success: true,
            deals,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get deals error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء جلب الصفقات" },
            { status: 500 }
        );
    }
}

// POST /api/deals - إنشاء صفقة جديدة
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            sellerId,
            buyerId,
            auctionId,
            materialType,
            weight,
            totalAmount,
        } = body;

        // التحقق من البيانات
        if (!sellerId || !buyerId || !materialType || !weight || !totalAmount) {
            return NextResponse.json(
                { error: "جميع الحقول الأساسية مطلوبة" },
                { status: 400 }
            );
        }

        // حساب عمولة المنصة (2%)
        const platformFee = totalAmount * 0.02;

        const deal = await db.deal.create({
            data: {
                sellerId,
                buyerId,
                auctionId,
                materialType,
                weight: parseFloat(weight),
                totalAmount: parseFloat(totalAmount),
                platformFee,
                status: "PENDING",
            },
            include: {
                seller: {
                    select: { id: true, name: true, phone: true },
                },
                buyer: {
                    select: { id: true, name: true, phone: true },
                },
            },
        });

        return NextResponse.json({
            success: true,
            deal,
            message: "تم إنشاء الصفقة بنجاح",
        });
    } catch (error) {
        console.error("Create deal error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء إنشاء الصفقة" },
            { status: 500 }
        );
    }
}

// PATCH /api/deals - تحديث حالة الصفقة
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { dealId, status, contractSigned } = body;

        if (!dealId) {
            return NextResponse.json(
                { error: "معرف الصفقة مطلوب" },
                { status: 400 }
            );
        }

        const updateData: { status?: string; contractSigned?: boolean; signedAt?: Date } = {};
        if (status) updateData.status = status;
        if (contractSigned !== undefined) {
            updateData.contractSigned = contractSigned;
            if (contractSigned) {
                updateData.signedAt = new Date();
            }
        }

        const deal = await db.deal.update({
            where: { id: dealId },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            deal,
            message: "تم تحديث الصفقة بنجاح",
        });
    } catch (error) {
        console.error("Update deal error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء تحديث الصفقة" },
            { status: 500 }
        );
    }
}
