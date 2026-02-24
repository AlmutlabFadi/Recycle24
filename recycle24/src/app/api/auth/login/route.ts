import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { isDemoMode, DEMO_USERS } from "@/lib/demo-data";

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("JWT_SECRET or NEXTAUTH_SECRET must be set in production");
        }
        console.warn("WARNING: Using insecure JWT secret in development mode");
        return "dev-only-insecure-secret-change-in-production";
    }
    return secret;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, email, password } = body;

        const identifier = email || phone;

        if (!identifier || !password) {
            return NextResponse.json(
                { error: "يرجى إدخال البريد الإلكتروني/الهاتف وكلمة المرور" },
                { status: 400 }
            );
        }

        if (isDemoMode) {
            const demoUser = DEMO_USERS[identifier];
            if (!demoUser) {
                return NextResponse.json(
                    { error: "بيانات الدخول غير صحيحة" },
                    { status: 401 }
                );
            }

            const isValidPassword = password === "123456";
            if (!isValidPassword) {
                return NextResponse.json(
                    { error: "بيانات الدخول غير صحيحة" },
                    { status: 401 }
                );
            }

            const token = sign(
                { userId: demoUser.id, email: demoUser.email },
                getJwtSecret(),
                { expiresIn: "24h" }
            );

            return NextResponse.json({
                success: true,
                token,
                user: {
                    id: demoUser.id,
                    phone: demoUser.phone,
                    email: demoUser.email,
                    name: demoUser.name,
                    firstName: demoUser.firstName || null,
                    lastName: demoUser.lastName || null,
                    titleId: demoUser.titleId || null,
                    gender: demoUser.gender || "unknown",
                    userType: demoUser.userType,
                    status: demoUser.status,
                },
            });
        }

        const user = await db.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { phone: identifier }
                ]
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "بيانات الدخول غير صحيحة" },
                { status: 401 }
            );
        }

        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: "بيانات الدخول غير صحيحة" },
                { status: 401 }
            );
        }

        const token = sign(
            { userId: user.id, email: user.email, phone: user.phone },
            getJwtSecret(),
            { expiresIn: "24h" }
        );

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                phone: user.phone,
                email: user.email,
                name: user.name,
                firstName: user.firstName ?? null,
                lastName: user.lastName ?? null,
                titleId: user.titleId ?? null,
                gender: user.gender || "unknown",
                userType: user.userType,
                status: user.status,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء تسجيل الدخول" },
            { status: 500 }
        );
    }
}
