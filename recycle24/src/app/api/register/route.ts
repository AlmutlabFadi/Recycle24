import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// POST /api/register - تسجيل مستخدم جديد
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, password, name, userType } = body;

        // التحقق من البيانات
        if (!phone || !password || !name || !userType) {
            return NextResponse.json(
                { error: "جميع الحقول مطلوبة" },
                { status: 400 }
            );
        }

        // التحقق من عدم وجود المستخدم
        const existingUser = await prisma.user.findUnique({
            where: { phone },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "رقم الهاتف مسجل مسبقاً" },
                { status: 409 }
            );
        }

        // تشفير كلمة المرور
        const hashedPassword = await hash(password, 10);

        // إنشاء المستخدم
        const user = await prisma.user.create({
            data: {
                phone,
                password: hashedPassword,
                name,
                userType,
                status: "PENDING",
            },
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                userType: user.userType,
            },
            message: "تم التسجيل بنجاح، يمكنك الآن تسجيل الدخول"
        });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء التسجيل" },
            { status: 500 }
        );
    }
}
