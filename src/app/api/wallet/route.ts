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

import { LedgerPostingService } from "@/lib/ledger/service";
import { LedgerEnforcementService } from "@/lib/ledger/enforcement";
import { HoldStatus, TransactionType, LedgerAccountSlug } from "@/lib/ledger/types";

// GET /api/wallet - الحصول على معلومات المحفظة
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }
        
        const sessionUser = session.user as SessionUser;
        const userId = sessionUser.id;

        // 1. Get/Sync Ledger Account
        const ledgerAccount = await LedgerPostingService.getOrCreateAccount(`USER_${userId}_SYP`, userId);
        
        // 2. Calculate Held Amounts
        const activeHolds = await db.ledgerHold.aggregate({
          where: { accountId: ledgerAccount.id, status: HoldStatus.OPEN },
          _sum: { amount: true },
        });
        const totalHeld = activeHolds._sum.amount || 0;

        // 3. Get Old Wallet Model
        let wallet = await db.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });

        // 4. Migration: If wallet has balance but ledger is zero, initialize ledger
        if (wallet && wallet.balanceSYP > 0 && ledgerAccount.balance === 0) {
          await LedgerPostingService.postEntry({
            type: TransactionType.WALLET_DEPOSIT, // Or a specific OPENING_BALANCE type
            description: 'Migration to Bank-Grade Ledger',
            lines: [
              {
                accountSlug: LedgerAccountSlug.SYSTEM_LIQUIDITY_POOL,
                amount: -wallet.balanceSYP,
                description: `Initial balance for user ${userId}`,
              },
              {
                accountSlug: ledgerAccount.slug,
                amount: wallet.balanceSYP,
                description: `Initial balance migration`,
              }
            ],
            metadata: { migration: true }
          });
          // Refresh ledger account after migration
          const updatedLedger = await db.ledgerAccount.findUnique({ where: { id: ledgerAccount.id } });
          if (updatedLedger) {
            ledgerAccount.balance = updatedLedger.balance;
          }
        }

        if (!wallet) {
            wallet = await db.wallet.create({
                data: {
                    userId,
                    balanceSYP: ledgerAccount.balance,
                    balanceUSD: 0,
                },
                include: {
                    transactions: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                    },
                },
            });
        } else if (wallet.balanceSYP !== ledgerAccount.balance) {
          // Sync wallet cache if needed
          await db.wallet.update({
            where: { id: wallet.id },
            data: { balanceSYP: ledgerAccount.balance }
          });
          wallet.balanceSYP = ledgerAccount.balance;
        }

        // 5. Check for Debt & Grace Period (Phase 18)
        const debtDetails = await LedgerEnforcementService.getDebtDetails(userId);
        const debtStatus = await LedgerEnforcementService.verifyDebtStatus(userId);

        // 6. Get Recent Ledger History (Phase 20)
        // Fetch journal lines for this account to move away from the old transaction model
        const ledgerHistory = await db.journalLine.findMany({
            where: { accountId: ledgerAccount.id },
            include: {
                entry: true
            },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        const formattedHistory = ledgerHistory.map(line => ({
            id: line.id,
            amount: line.amount,
            description: line.description || line.entry.description,
            type: line.entry.type,
            date: line.createdAt,
            metadata: line.metadata as any || line.entry.metadata as any
        }));

        return NextResponse.json({
            success: true,
            wallet: {
              ...wallet,
              verifiedBalance: ledgerAccount.balance,
              availableBalance: ledgerAccount.balance - totalHeld,
              heldAmount: totalHeld,
              debtDetails,
              history: formattedHistory, // Use ledger history instead of old transactions
              isLocked: debtStatus.isLocked,
              lockReason: debtStatus.reason,
            },
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
