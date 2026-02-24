import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/demo-data";
import { Prisma } from "@prisma/client";

type TransactionWhereInput = Prisma.TransactionWhereInput;

interface DemoTransaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    description: string;
    createdAt: Date;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const type = searchParams.get("type");
        const limit = parseInt(searchParams.get("limit") || "50");

        if (!userId) {
            return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
        }

        if (isDemoMode) {
            const demoTransactions: DemoTransaction[] = [
                {
                    id: "tx_1",
                    type: "DEPOSIT",
                    amount: 250000,
                    status: "COMPLETED",
                    description: "إيداع عبر حريم",
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                },
                {
                    id: "tx_2",
                    type: "WITHDRAWAL",
                    amount: 150000,
                    status: "COMPLETED",
                    description: "سحب إلى سيرياتيل كاش",
                    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                },
                {
                    id: "tx_3",
                    type: "PAYMENT",
                    amount: 45000,
                    status: "COMPLETED",
                    description: "رسوم مزاد #402",
                    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                },
                {
                    id: "tx_4",
                    type: "REFUND",
                    amount: 25000,
                    status: "COMPLETED",
                    description: "استرداد رسوم",
                    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                },
                {
                    id: "tx_5",
                    type: "DEPOSIT",
                    amount: 500000,
                    status: "PENDING",
                    description: "إيداع عبر MTN كاش",
                    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
                },
            ];

            const filtered = type && type !== "all"
                ? demoTransactions.filter((tx) => tx.type === type.toUpperCase())
                : demoTransactions;

            return NextResponse.json({
                success: true,
                transactions: filtered.slice(0, limit),
                total: filtered.length,
            });
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
