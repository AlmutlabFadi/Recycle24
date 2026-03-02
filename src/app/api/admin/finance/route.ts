import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_FINANCE");
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        // 1. Fetch Company Wallet
        let companyWallet = await db.companyWallet.findFirst();
        if (!companyWallet) {
            companyWallet = await db.companyWallet.create({ data: {} });
        }

        // 2. Calculate Total Government Support (Real-time from Ledger)
        // We sum the 'originalAmount' from metadata where 'isExempt' is true
        const supportResult = await db.$queryRaw<any[]>`
            SELECT COALESCE(SUM((metadata->>'originalAmount')::numeric), 0) as "totalSupport"
            FROM "JournalLine"
            WHERE (metadata->>'isExempt')::boolean = true
        `;
        const totalSupportSYP = Number(supportResult[0].totalSupport || 0);

        // 3. Calculate Escrow Liquidity (Total Open Ledger Holds)
        const escrowResult = await db.ledgerHold.aggregate({
            where: { status: "OPEN" },
            _sum: { amount: true }
        });
        const totalEscrowSYP = escrowResult._sum.amount || 0;

        // 4. Fetch User Wallets (Top holders)
        const userWallets = await db.wallet.findMany({
            include: { user: { select: { name: true, phone: true, email: true, isLocked: true } } },
            orderBy: { balanceSYP: "desc" },
            take: 20,
        });

        // 5. Calculate Risk Metrics
        const riskAccountsCount = await db.user.count({
            where: {
                OR: [
                    { isLocked: true },
                    { wallet: { balanceSYP: { lt: 0 } } }
                ]
            }
        });

        return NextResponse.json({ 
            success: true, 
            companyWallet,
            totalSupportSYP,
            totalEscrowSYP,
            riskAccountsCount,
            userWallets 
        });
    } catch (error) {
        console.error("Admin finance GET error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل البيانات المالية" }, { status: 500 });
    }
}
