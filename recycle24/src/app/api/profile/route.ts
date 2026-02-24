import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/demo-data";

type DemoUser = {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    titleId?: string;
    gender?: string;
    companyName?: string;
    companyType?: string;
    businessType?: string;
    jobTitle?: string;
    bio?: string;
};

const demoUsers: Map<string, DemoUser> = new Map();

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

        if (isDemoMode) {
            let user = demoUsers.get(userId) ?? {
                id: userId,
                name: "",
                firstName: "",
                lastName: "",
                titleId: "",
                gender: "unknown",
            };

            const fullName = firstName && lastName 
                ? `${firstName} ${lastName}`.trim()
                : user.name || "";

            user = {
                ...user,
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(fullName && { name: fullName }),
                ...(titleId && { titleId }),
                ...(gender && { gender }),
                ...(companyName !== undefined && { companyName }),
                ...(companyType && { companyType }),
                ...(businessType && { businessType }),
                ...(jobTitle && { jobTitle }),
                ...(bio !== undefined && { bio }),
            };

            demoUsers.set(userId, user);

            return NextResponse.json({
                success: true,
                user,
            });
        }

        const updateData: { firstName?: string; lastName?: string; titleId?: string; gender?: string } = {};
        
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (titleId !== undefined) updateData.titleId = titleId;
        if (gender !== undefined) updateData.gender = gender;

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

        if (isDemoMode) {
            const user = demoUsers.get(userId);
            if (!user) {
                return NextResponse.json({
                    user: null,
                });
            }
            return NextResponse.json({ user });
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
