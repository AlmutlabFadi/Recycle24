import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            userId, 
            firstName, 
            lastName, 
            titleId, 
            gender,
            companyName,
            companyType,
            businessType,
            jobTitle,
            bio 
        } = body;

        if (!userId) {
            return NextResponse.json(
                { error: "معرف المستخدم مطلوب" },
                { status: 400 }
            );
        }

        const updateData: { 
            firstName?: string; 
            lastName?: string; 
            titleId?: string; 
            gender?: string;
            userType?: string;
            status?: string;
        } = {};
        
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (titleId !== undefined) updateData.titleId = titleId;
        if (gender !== undefined) updateData.gender = gender;

        // Special handling for trader upgrade request
        if (body.upgradeToTrader) {
            // We only need to check or initialize the Trader record
            const existingTrader = await db.trader.findUnique({
                where: { userId }
            });

            if (!existingTrader) {
                await db.trader.create({
                    data: {
                        userId,
                        businessName: firstName && lastName ? `${firstName} ${lastName}` : "قيد الإعداد",
                        verificationStatus: "PENDING"
                    }
                });
            }
        }

        const user = await db.user.update({
            where: { id: userId },
            data: updateData,
        });

        const fullName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`.trim()
            : user.name || "";

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: fullName,
                firstName: user.firstName,
                lastName: user.lastName,
                titleId: user.titleId,
                gender: user.gender,
                email: user.email,
                phone: user.phone,
                userType: user.userType,
                status: user.status,
            },
        });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء تحديث الملف الشخصي" },
            { status: 500 }
        );
    }
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
            select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                titleId: true,
                gender: true,
                email: true,
                phone: true,
                userType: true,
                status: true,
                trader: {
                    select: {
                        trustScore: true,
                        successRate: true,
                        totalReviews: true,
                    }
                },
                driver: {
                    select: {
                        trustScore: true,
                        successRate: true,
                        totalReviews: true,
                    }
                }
            },
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء جلب الملف الشخصي" },
            { status: 500 }
        );
    }
}
