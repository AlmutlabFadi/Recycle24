import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface SessionUser {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
}

// GET /api/wallet - الحصول على معلومات المحفظة
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }
        
        const sessionUser = session.user as SessionUser;
        const userId = sessionUser.id;

        // الحصول على أو إنشاء المحفظة
        let wallet = await db.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });

        if (!wallet) {
            wallet = await db.wallet.create({
                data: {
                    userId,
                    balanceSYP: 0,
                    balanceUSD: 0,
                },
                include: {
                    transactions: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                    },
                },
            });
        }

        return NextResponse.json({
            success: true,
            wallet,
        });
    } catch (error) {
        console.error("Get wallet error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء جلب المحفظة" },
            { status: 500 }
        );
    }
}

// POST /api/wallet/deposit - إيداع مبلغ
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }
        
        const sessionUser = session.user as SessionUser;
        const userId = sessionUser.id;

        const body = await request.json();
        const { amount, method } = body;

        if (!amount || !method) {
            return NextResponse.json(
                { error: "جميع الحقول مطلوبة" },
                { status: 400 }
            );
        }

        const wallet = await db.wallet.findUnique({ where: { userId } });
        if (!wallet) {
            return NextResponse.json({ error: "المحفظة غير موجودة" }, { status: 404 });
        }

        // إنشاء العملية
        const transaction = await db.transaction.create({
            data: {
                walletId: wallet.id,
                type: "DEPOSIT",
                amount,
                currency: "SYP", // Defaulting to SYP as currency wasn't provided in old mock API
                description: method, // Using method as description since method field doesn't exist on Transaction
                status: "PENDING",
            },
        });

        return NextResponse.json({
            success: true,
            transaction,
            message: "تم إنشاء طلب الإيداع بنجاح، سيتم التحقق منه خلال 24 ساعة",
        });
    } catch (error) {
        console.error("Deposit error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء الإيداع" },
            { status: 500 }
        );
    }
}

// PUT /api/wallet/withdraw - سحب مبلغ
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }
        
        const sessionUser = session.user as SessionUser;
        const userId = sessionUser.id;

        const body = await request.json();
        const { amount, method, accountNumber } = body;

        if (!amount || !method || !accountNumber) {
            return NextResponse.json(
                { error: "جميع الحقول مطلوبة" },
                { status: 400 }
            );
        }

        // التحقق من الرصيد
        const wallet = await db.wallet.findUnique({
            where: { userId },
        });

        if (!wallet || wallet.balanceSYP < amount) {
            return NextResponse.json(
                { error: "رصيد غير كافٍ" },
                { status: 400 }
            );
        }

        // إنشاء عملية السحب
        const transaction = await db.transaction.create({
            data: {
                walletId: wallet.id,
                type: "WITHDRAWAL",
                amount,
                currency: "SYP",
                description: `Withdrawing via ${method} to ${accountNumber}`,
                status: "PENDING",
            },
        });

        // خصم المبلغ من الرصيد
        await db.wallet.update({
            where: { userId },
            data: { balanceSYP: { decrement: amount } },
        });

        return NextResponse.json({
            success: true,
            transaction,
            message: "تم إنشاء طلب السحب بنجاح، سيتم معالجته خلال 24 ساعة",
        });
    } catch (error) {
        console.error("Withdrawal error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء السحب" },
            { status: 500 }
        );
    }
}
