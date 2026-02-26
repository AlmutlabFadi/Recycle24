import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: auctionId } = await params;

    if (!auctionId) {
      return NextResponse.json({ error: "Auction ID is required" }, { status: 400 });
    }

    const prisma = db;

    // 1. Check if auction exists and is active
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    // Allow joining scheduled auctions so people can prepare
    if (auction.status !== "LIVE" && auction.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Auction is not open for joining" }, { status: 400 });
    }

    if (auction.sellerId === userId) {
      return NextResponse.json({ error: "Seller cannot join their own auction" }, { status: 400 });
    }

    // 2. Check if user already joined
    const existingParticipant = await prisma.auctionParticipant.findUnique({
      where: {
        auctionId_userId: {
          auctionId,
          userId,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json({ message: "Already joined", participant: existingParticipant });
    }

    // 3. User & Wallet Verification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is exempt (e.g. government accounts)
    const isExempt = user.role === "ADMIN" || user.userType === "GOVERNMENT";

    let depositToCharge = auction.securityDeposit;
    let entryFeeToCharge = auction.entryFee;

    if (isExempt) {
      depositToCharge = 0;
      entryFeeToCharge = 0;
    }

    const totalToDeduct = depositToCharge + entryFeeToCharge;

    // Verify wallet balance if not exempt and fees > 0
    if (!isExempt && totalToDeduct > 0) {
      if (!user.wallet) {
        return NextResponse.json({ error: "Wallet not found. Please setup your wallet." }, { status: 400 });
      }

      if (user.wallet.balanceSYP < totalToDeduct) {
        return NextResponse.json({ 
          error: "Insufficient funds", 
          required: totalToDeduct, 
          balance: user.wallet.balanceSYP 
        }, { status: 402 }); // Payment Required
      }
    }

    // 4. Execute Transaction
    const participant = await prisma.$transaction(async (tx: any) => {
      // Deduct from wallet if needed
      if (!isExempt && totalToDeduct > 0 && user.wallet) {
        // Decrement balance
        await tx.wallet.update({
          where: { id: user.wallet.id },
          data: {
            balanceSYP: { decrement: totalToDeduct },
            // If frozenTotal isn't defined in your schema, we need to map it correctly. Assuming it's tracked in Wallet or we just create TRANSACTIONS.
          },
        });

        // Record Transactions
        // 1. Entry Fee (Non-refundable)
        if (entryFeeToCharge > 0) {
          await tx.transaction.create({
            data: {
              walletId: user.wallet.id,
              type: "PAYMENT",
              amount: entryFeeToCharge,
              status: "COMPLETED",
              reference: `AUCTION_FEE_${auctionId}`,
              description: `Entry fee for auction: ${auction.title}`,
            },
          });
        }

        // 2. Security Deposit (Held/Frozen)
        if (depositToCharge > 0) {
          await tx.transaction.create({
            data: {
              walletId: user.wallet.id,
              type: "DEPOSIT", // Or a specific type like SECURITY_DEPOSIT
              amount: depositToCharge,
              status: "PENDING", // Pending until auction ends
              reference: `AUCTION_DEPOSIT_${auctionId}`,
              description: `Security deposit held for auction: ${auction.title}`,
            },
          });
        }
      }

      // 5. Create Participant Record
      return await tx.auctionParticipant.create({
        data: {
          auctionId,
          userId,
          depositPaid: depositToCharge,
          entryFeePaid: entryFeeToCharge,
          isExempt,
          depositStatus: depositToCharge > 0 ? "HELD" : "EXEMPT",
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
