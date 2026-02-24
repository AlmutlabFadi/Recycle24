import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { isDemoMode } from "@/lib/demo-data";

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

interface RegisterBody {
    phone?: string;
    email?: string;
    password: string;
    name: string;
    firstName?: string;
    lastName?: string;
    titleId?: string;
    gender?: "male" | "female" | "unknown";
    userType: "TRADER" | "BUYER" | "ADMIN";
}

const demoRegisteredUsers: Map<string, { 
    id: string; 
    phone: string | null; 
    email: string | null; 
    name: string;
    firstName?: string;
    lastName?: string;
    titleId?: string;
    gender?: string;
    userType: string; 
    status: string 
}> = new Map();

export async function POST(request: NextRequest) {
    try {
        const body: RegisterBody = await request.json();
        const { phone, email, password, name, firstName, lastName, titleId, gender, userType } = body;

        if ((!phone && !email) || !password || !name || !userType) {
            return NextResponse.json(
                { error: "جميع الحقول مطلوبة" },
                { status: 400 }
            );
        }

            const identifier = email || phone || "";

        if (isDemoMode) {
            if (demoRegisteredUsers.has(identifier)) {
                return NextResponse.json(
                    { error: "هذا الحساب مسجل مسبقاً" },
                    { status: 409 }
                );
            }

            const newUser = {
                id: `demo_user_${Date.now()}`,
                phone: phone || null,
                email: email || null,
                name,
                firstName: firstName || (name ? name.split(' ')[0] : ""),
                lastName: lastName || (name ? name.split(' ').slice(1).join(' ') : ""),
                titleId: titleId || "",
                gender: gender || "unknown",
                userType,
                status: "ACTIVE"
            };

            demoRegisteredUsers.set(identifier, newUser);

            const token = sign(
                { userId: newUser.id, email: newUser.email },
                getJwtSecret(),
                { expiresIn: "24h" }
            );

            return NextResponse.json({
                success: true,
                token,
                user: newUser,
            });
        }

        if (email) {
            const existingUser = await db.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                return NextResponse.json(
                    { error: "البريد الإلكتروني مسجل مسبقاً" },
                    { status: 409 }
                );
            }
        }

        if (phone) {
            const existingUser = await db.user.findUnique({
                where: { phone },
            });
            if (existingUser) {
                return NextResponse.json(
                    { error: "رقم الهاتف مسجل مسبقاً" },
                    { status: 409 }
                );
            }
        }

        const hashedPassword = await hash(password, 10);

        const user = await db.user.create({
            data: {
                phone: phone || null,
                email: email || null,
                password: hashedPassword,
                name,
                userType,
                status: "PENDING",
                firstName: firstName || name?.split(' ')[0] || null,
                lastName: lastName || name?.split(' ').slice(1).join(' ') || null,
                titleId: titleId || null,
                gender: gender || "unknown",
            },
        });

        const token = sign(
            { userId: user.id, phone: user.phone, email: user.email },
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
                firstName: firstName || name?.split(' ')[0] || null,
                lastName: lastName || name?.split(' ').slice(1).join(' ') || null,
                titleId: titleId || null,
                gender: gender || "unknown",
                userType: user.userType,
                status: user.status,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء التسجيل" },
            { status: 500 }
        );
    }
}
