import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LedgerPostingService } from "@/lib/ledger/service";
import { TransactionType, LedgerAccountSlug } from "@/lib/ledger/types";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const auctionId = resolvedParams.id;
    const body = await request.json();
    const { 
      agreedToTerms, 
      agreedToPrivacy, 
      agreedToCommission, 
      agreedToDataSharing,
      hasInspectedGoods,
      agreedToInvoice
    } = body;

    // Validate agreements
    if (!agreedToTerms || !agreedToPrivacy || !agreedToCommission || !agreedToDataSharing || !hasInspectedGoods || !agreedToInvoice) {
      return NextResponse.json({ 
        error: "All policy agreements, goods inspection, and invoice acknowledgment must be accepted before joining an auction." 
      }, { status: 400 });
    }

    if (!auctionId) {
      return NextResponse.json({ error: "Auction ID is required" }, { status: 400 });
    }

    const prisma = await db;

    // 1. Check if auction exists and is active
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (auction.status !== "LIVE" && auction.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Auction is not open for joining" }, { status: 400 });
    }

    if (auction.sellerId === userId) {
      return NextResponse.json({ error: "Seller cannot join their own auction" }, { status: 400 });
    }

    // 2. Comprehensive User & Trader Verification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        trader: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if account is locked
    if (user.isLocked) {
      return NextResponse.json({ 
        error: `Your account is currently locked. Reason: ${user.lockReason || "Unpaid debt"}` 
      }, { status: 403 });
    }

    // Check if user is an approved trader
    const isExempt = user.role === "ADMIN" || user.userType === "GOVERNMENT";
    if (!isExempt && (!user.trader || user.trader.verificationStatus !== "APPROVED")) {
      return NextResponse.json({ 
        error: "Non-authorized. You must be an approved trader to join auctions." 
      }, { status: 403 });
    }

    // 3. User Already Joined Check
    const existingParticipant = await prisma.auctionParticipant.findUnique({
      where: {
        auctionId_userId: { auctionId, userId },
      },
    });

    if (existingParticipant) {
      return NextResponse.json({ message: "Already joined", participant: existingParticipant });
    }

    // 4. Ledger Balance Verification
    const userAccountSlug = `USER_${userId}_SYP`;
    const ledgerAccount = await LedgerPostingService.getOrCreateAccount(userAccountSlug, userId, "SYP");
    
    // Calculate current available balance (Balance - Total Holds)
    const totalHolds = await prisma.ledgerHold.aggregate({
      where: { accountId: ledgerAccount.id, status: "OPEN" },
      _sum: { amount: true },
    });
    
    const heldAmount = totalHolds._sum.amount || 0;
    const availableBalance = ledgerAccount.balance - heldAmount;

    let depositToCharge = auction.securityDeposit;
    let entryFeeToCharge = auction.entryFee;

    if (isExempt) {
      depositToCharge = 0;
      entryFeeToCharge = 0;
    }

    // HARD BLOCK: Security deposit must be covered by available balance
    if (!isExempt && depositToCharge > 0 && availableBalance < depositToCharge) {
      return NextResponse.json({ 
        error: "Insufficient funds for security deposit", 
        required: depositToCharge, 
        available: availableBalance 
      }, { status: 402 });
    }

    // 5. Execute Transaction via Ledger Service
    const participant = await prisma.$transaction(async (tx: any) => {
      if (!isExempt) {
        // 1. Handle Security Deposit (Create Ledger Hold)
        if (depositToCharge > 0) {
          await LedgerPostingService.createHold(
            userAccountSlug,
            depositToCharge,
            'AUCTION',
            auctionId,
            auction.endsAt || undefined
          );
        }

        // 2. Handle Entry Fee (Non-refundable Ledger Posting)
        if (entryFeeToCharge > 0) {
          await LedgerPostingService.postEntry({
            type: TransactionType.AUCTION_JOIN_FEE,
            description: `Entry fee for auction: ${auction.title}`,
            lines: [
              {
                accountSlug: userAccountSlug,
                amount: -entryFeeToCharge, // Debit User
                description: `Auction entry fee: ${auctionId}`,
              },
              {
                accountSlug: LedgerAccountSlug.SYSTEM_FEE_COLLECTION,
                amount: entryFeeToCharge, // Credit System
                description: `Fee from user ${userId} for auction ${auctionId}`,
              },
            ],
            metadata: { 
              auctionId, 
              userId,
              invoiceBreakdown: {
                securityDeposit: depositToCharge,
                entryFee: entryFeeToCharge,
                totalRefundable: depositToCharge,
                totalNonRefundable: entryFeeToCharge,
                isExempt
              },
              agreedAt: new Date().toISOString()
            },
          });
        }
      }

      // 6. Create Participant Record with Agreements
      return await tx.auctionParticipant.create({
        data: {
          auctionId,
          userId,
          depositPaid: depositToCharge,
          entryFeePaid: entryFeeToCharge,
          isExempt,
          depositStatus: depositToCharge > 0 ? "HELD" : "EXEMPT",
          agreedToTerms: true,
          agreedToPrivacy: true,
          agreedToCommission: true,
          agreedToDataSharing: true,
          hasInspectedGoods: true,
          agreedToInvoice: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined the auction",
      participant,
    });

  } catch (error: any) {
    console.error("[JOIN_AUCTION_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
