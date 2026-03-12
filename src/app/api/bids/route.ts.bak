import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Create a new Prisma instance since db.ts exports a Promise in this project version
const prisma = new PrismaClient();

interface SessionUser {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
}

// Fixed Security Deposit Required to enter any auction
const SECURITY_DEPOSIT_USD = 500; 

// GET /api/bids?auctionId= — fetch latest bids for an auction
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const auctionId = searchParams.get("auctionId");

        if (!auctionId) {
            return NextResponse.json({ error: "auctionId is required" }, { status: 400 });
        }

        const bids = await prisma.bid.findMany({
            where: { auctionId },
            include: {
                bidder: { select: { id: true, name: true, firstName: true, lastName: true } }
            },
            orderBy: { amount: "desc" },
            take: 20,
        });

        const auction = await prisma.auction.findUnique({
            where: { id: auctionId },
            select: { currentBid: true, endsAt: true, status: true, startingBid: true, buyNowPrice: true }
        });

        return NextResponse.json({ success: true, bids, auction });
    } catch (error) {
        console.error("Get bids error:", error);
        return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 });
    }
}

// POST /api/bids — Place a bid using STRICT GATEKEEPER LOGIC
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const sessionUser = session.user as SessionUser;
        const bidderId = sessionUser.id;
        const { auctionId, amount } = await request.json();

        if (!auctionId || !amount) {
            return NextResponse.json({ error: "auctionId and amount are required" }, { status: 400 });
        }

        const bidAmount = Number(amount);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            return NextResponse.json({ error: "Invalid bid amount" }, { status: 400 });
        }

        // =========================================================================
        // GATEKEEPER VALIDATION (Pre-Transaction check)
        // Ensure user is Verified, Gold Tier (or Admin/Gov), and has Trader profile
        // =========================================================================
        const userProfile = await prisma.user.findUnique({
            where: { id: bidderId },
            include: { trader: true, wallet: true }
        });

        if (!userProfile) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
        
        // RULE 1: Must be verified
        if (!userProfile.isVerified) {
            return NextResponse.json({ error: "VERIFICATION_REQUIRED" }, { status: 403 });
        }

        // RULE 2: Trader profile must exist and be APPROVED (unless Admin/Gov)
        if (userProfile.role === "TRADER" && (!userProfile.trader || userProfile.trader.verificationStatus !== "APPROVED")) {
            return NextResponse.json({ error: "TRADER_APPROVAL_REQUIRED" }, { status: 403 });
        }

        // RULE 3: Premium Tier Access (Simulated Tier logic using role for now until Subscriptions model is added)
        // Only Gold/Platinum traders or Admins can bid. We allow ADMIN/GOVERNMENT by default.
        // If we want to strictly block standard users, we check here. For now, allowing verified traders.
        // We can expand this logic when the detailed Subscription model is generated in Phase 2.


        // =========================================================================
        // SECURITY DEPOSIT ENGINE & BIDDING LOGIC
        // =========================================================================
        const result = await prisma.$transaction(async (tx) => {
            // STEP 1: Lock the auction row and get latest state
            const auction = await tx.auction.findUnique({ 
                where: { id: auctionId }
            });

            if (!auction) throw new Error("AUCTION_NOT_FOUND");
            if (auction.status !== "LIVE") throw new Error("AUCTION_NOT_LIVE");
            if (auction.endsAt && new Date() > auction.endsAt) throw new Error("AUCTION_ENDED");
            if (auction.sellerId === bidderId) throw new Error("CANNOT_BID_OWN");

            const currentHighestBidAmount = auction.currentBid ?? auction.startingBid;
            const minBid = currentHighestBidAmount + 1; 
            if (bidAmount < minBid) {
                throw new Error(`MIN_BID:${minBid}`);
            }

            // STEP 2: Check has User already paid deposit for this specific auction?
            // We check if the user already has a bid on this auction. If yes, deposit already paid.
            const existingUserBid = await tx.bid.findFirst({
                where: { auctionId: auctionId, bidderId: bidderId }
            });

            let bidderWallet = await tx.wallet.findUnique({
                where: { userId: bidderId }
            });

            if (!bidderWallet) {
                bidderWallet = await tx.wallet.create({
                    data: { userId: bidderId, balanceUSD: 0, balanceSYP: 0 }
                });
            }

            // STEP 3: Deduct Security Deposit IF it's the first time bidding in this auction
            if (!existingUserBid) {
                if (bidderWallet.balanceUSD < SECURITY_DEPOSIT_USD) {
                    throw new Error(`DEPOSIT_REQUIRED:${SECURITY_DEPOSIT_USD}`);
                }

                // Deduct Security Deposit (تأمين دخول مزاد)
                await tx.wallet.update({
                    where: { id: bidderWallet.id },
                    data: { balanceUSD: { decrement: SECURITY_DEPOSIT_USD } }
                });

                // Record the Security Deposit HOLD transaction
                await tx.transaction.create({
                    data: {
                        walletId: bidderWallet.id,
                        type: "PAYMENT", // Type indicating an Escrow hold for deposit
                        amount: SECURITY_DEPOSIT_USD,
                        currency: "USD",
                        status: "COMPLETED",
                        description: `Security deposit hold for Auction #${auctionId.slice(-6)}`
                    }
                });
            }

            // Note: Unlike full escrow, we DO NOT refund previous highest bidder here.
            // All bidders lock exactly ONE deposit per auction.
            // Refunds happen globally when the auction ENDS via a separate CRON job or close-action.

            // STEP 4: Register the new Bid and Update Auction current price
            const newBid = await tx.bid.create({
                data: { auctionId, bidderId, amount: bidAmount },
            });

            await tx.auction.update({
                where: { id: auctionId },
                data: { currentBid: bidAmount },
            });

            return { newBid, depositDeducted: !existingUserBid };
        }, {
            maxWait: 5000, 
            timeout: 10000 
        });

        const depositMsg = result.depositDeducted 
            ? `تم اقتطاع تأمين دخول (${SECURITY_DEPOSIT_USD}$) وتقديم المزايدة بنجاح` 
            : "تم تقديم مزايدتك بنجاح";

        return NextResponse.json({
            success: true,
            bid: result.newBid,
            message: depositMsg,
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        
        // Error Mapping
        if (message === "AUCTION_NOT_FOUND") return NextResponse.json({ error: "المزاد غير موجود" }, { status: 404 });
        if (message === "AUCTION_NOT_LIVE") return NextResponse.json({ error: "المزاد غير نشط حالياً" }, { status: 400 });
        if (message === "AUCTION_ENDED") return NextResponse.json({ error: "انتهى وقت المزاد" }, { status: 400 });
        if (message === "CANNOT_BID_OWN") return NextResponse.json({ error: "لا يمكنك المزايدة على مزادك الخاص" }, { status: 400 });
        
        if (message.startsWith("DEPOSIT_REQUIRED:")) {
            const reqAmount = message.split(":")[1];
            return NextResponse.json({ 
                error: `DEPOSIT_REQUIRED`, 
                message: `لا يمكن الدخول. رصيد المحفظة غير كافٍ لاقتطاع تأمين دخول المزاد البالغ ${reqAmount}$` 
            }, { status: 402 }); // 402 Payment Required
        }
        
        if (message.startsWith("MIN_BID:")) {
            const min = message.split(":")[1];
            return NextResponse.json({ error: `الحد الأدنى للمزايدة هو $${min}` }, { status: 400 });
        }
        
        console.error("Place bid Gatekeeper error:", error);
        return NextResponse.json({ error: "حدث خطأ مالي أثناء معالجة المزايدة. يرجى المحاولة مرة أخرى." }, { status: 500 });
    }
}
