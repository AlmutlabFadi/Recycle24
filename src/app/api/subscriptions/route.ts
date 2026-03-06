import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { packageId, billingCycle } = await request.json();
        const userId = (session.user as any).id;

        if (!packageId) {
            return NextResponse.json({ success: false, error: "باقة الاشتراك مطلوبة" }, { status: 400 });
        }

        // 1. Get package details
        const pkg = await db.subscriptionPackage.findUnique({
            where: { id: packageId }
        });

        if (!pkg || !pkg.isActive) {
            return NextResponse.json({ success: false, error: "الباقة غير متوفرة" }, { status: 404 });
        }

        // 2. Calculate price (apply yearly discount if needed)
        let price = pkg.price;
        let duration = pkg.durationDays;
        
        if (billingCycle === "yearly") {
            price = price * 12 * 0.8; // 20% discount
            duration = 365;
        }

        // 3. Update User Subscription
        const subscription = await db.userSubscription.upsert({
            where: { userId },
            update: {
                packageId: pkg.id,
                plan: pkg.name,
                status: "ACTIVE",
                startDate: new Date(),
                endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
                pricePaid: price,
            },
            create: {
                userId,
                packageId: pkg.id,
                plan: pkg.name,
                status: "ACTIVE",
                startDate: new Date(),
                endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
                pricePaid: price,
            }
        });

        // 4. Update Company Wallet
        try {
            const wallet = await db.companyWallet.findFirst();
            if (wallet) {
                await db.companyWallet.update({
                    where: { id: wallet.id },
                    data: {
                        totalRevenue: { increment: price },
                        balanceSYP: { increment: price }
                    }
                });
            } else {
                await db.companyWallet.create({
                    data: {
                        totalRevenue: price,
                        balanceSYP: price,
                        totalCommissions: 0,
                    }
                });
            }
        } catch (err) {
            console.error("Failed to update company wallet for subscription:", err);
        }

        // 5. Log Transaction for User
        const userWallet = await db.wallet.findUnique({ where: { userId } });
        if (userWallet) {
            await db.transaction.create({
                data: {
                    walletId: userWallet.id,
                    type: "PAYMENT",
                    amount: price,
                    currency: "SYP",
                    description: `اشتراك في باقة ${pkg.name}`,
                    status: "COMPLETED"
                }
            });
            
            // Deduct from user wallet if they use balance (Mock logic for now, usually handles external payment)
            // For now, let's assume successful "external" payment
        }

        return NextResponse.json({ success: true, subscription });
    } catch (error) {
        console.error("Subscription purchase error:", error);
        return NextResponse.json({ success: false, error: "تعذر إتمام عملية الاشتراك" }, { status: 500 });
    }
}
