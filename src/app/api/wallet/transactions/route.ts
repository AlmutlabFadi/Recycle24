import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

type TransactionWhereInput = Prisma.TransactionWhereInput;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const type = searchParams.get("type");
        const limit = parseInt(searchParams.get("limit") || "50");

        if (!userId) {
            return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
        }

        const wallet = await db.wallet.findUnique({
            where: { userId },
        });

        if (!wallet) {
            return NextResponse.json({
                success: true,
                transactions: [],
                total: 0,
            });
        }

        const where: TransactionWhereInput = { walletId: wallet.id };

        if (type && type !== "all") {
            where.type = type.toUpperCase();
        }

        const transactions = await db.transaction.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        const total = await db.transaction.count({ where });

        return NextResponse.json({
            success: true,
            transactions: transactions.map((tx) => ({
                id: tx.id,
                type: tx.type,
                amount: tx.amount,
                status: tx.status,
                description: tx.description,
                createdAt: tx.createdAt,
            })),
            total,
        });
    } catch (error) {
        console.error("Get transactions error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب المعاملات" }, { status: 500 });
    }
}
