import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

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
    userType: "TRADER" | "CLIENT" | "DRIVER" | "GOVERNMENT" | "ADMIN" | "BUYER";
    referralCode?: string; // This will be the inviter's userId for now
}

export async function POST(request: NextRequest) {
    try {
        const body: RegisterBody = await request.json();
        const { phone, email, password, name, firstName, lastName, titleId, gender, userType, referralCode } = body;

        const normalizedUserType = userType === "BUYER" ? "CLIENT" : userType;
        const allowedUserTypes = ["TRADER", "CLIENT", "DRIVER", "GOVERNMENT", "ADMIN"];
        if (!allowedUserTypes.includes(normalizedUserType)) {
            return NextResponse.json(
                { error: "نوع الحساب غير صالح" },
                { status: 400 }
            );
        }

        if ((!phone && !email) || !password || !name || !userType) {
            return NextResponse.json(
                { error: "جميع الحقول مطلوبة" },
                { status: 400 }
            );
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

        // 🛡️ Create user and wallet in an atomic transaction
        const { user, wallet } = await db.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    phone: phone || null,
                    email: email || null,
                    password: hashedPassword,
                    name,
                    userType: normalizedUserType,
                    status: "PENDING",
                    firstName: firstName || name?.split(' ')[0] || null,
                    lastName: lastName || name?.split(' ').slice(1).join(' ') || null,
                    titleId: titleId || null,
                    gender: gender || "unknown",
                },
            });

            // 💰 Initialize wallet for the new user
            const newWallet = await tx.wallet.create({
                data: {
                    userId: newUser.id,
                    balanceSYP: 0,
                    balanceUSD: 0,
                }
            });

            return { user: newUser, wallet: newWallet };
        });

        // وإذا تم تقديم كود إحالة، قم بمكافأة الداعي
        if (referralCode) {
            try {
                const inviter = await db.user.findUnique({ where: { id: referralCode } });
                if (inviter) {
                    await db.recyclePoints.upsert({
                        where: { userId: referralCode },
                        update: { points: { increment: 500 } },
                        create: { userId: referralCode, points: 500 }
                    });
                }
            } catch (err) {
                console.error("Referral credit error:", err);
            }
        }

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
                firstName: user.firstName,
                lastName: user.lastName,
                titleId: user.titleId,
                gender: user.gender,
                userType: user.userType,
                status: user.status,
            },
        });
    } catch (error) {
        console.error("Critical Registration Failure:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { 
                error: "حدث خطأ أثناء التسجيل",
                details: errorMessage,
                code: (error as any)?.code // Prisma error code if available
            },
            { status: 500 }
        );
    }
}
