import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  AuctionDepositWorkflowStatus,
  AuctionParticipantWorkflowStatus,
  AuctionType,
  AuctionWorkflowStatus,
} from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { LedgerPostingService } from "@/lib/ledger/service";
import { LedgerAccountSlug, TransactionType } from "@/lib/ledger/types";

type JoinAuctionBody = {
  agreedToTerms?: boolean;
  agreedToPrivacy?: boolean;
  agreedToCommission?: boolean;
  agreedToDataSharing?: boolean;
  hasInspectedGoods?: boolean;
  agreedToInvoice?: boolean;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function isTruthyAgreements(body: JoinAuctionBody) {
  return Boolean(
    body.agreedToTerms &&
      body.agreedToPrivacy &&
      body.agreedToCommission &&
      body.agreedToDataSharing &&
      body.hasInspectedGoods &&
      body.agreedToInvoice
  );
}

function canJoinAuction(auction: {
  status: string;
  workflowStatus: AuctionWorkflowStatus;
  isFinallyClosed: boolean;
}) {
  const legacyOpen = auction.status === "LIVE" || auction.status === "SCHEDULED";
  const workflowOpen =
    auction.workflowStatus === AuctionWorkflowStatus.SCHEDULED ||
    auction.workflowStatus === AuctionWorkflowStatus.OPEN;

  return !auction.isFinallyClosed && (workflowOpen || legacyOpen);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let createdHoldId: string | null = null;

  try {
    const resolvedParams = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auctionId = resolvedParams.id;
    const userId = session.user.id;

    if (!auctionId) {
      return NextResponse.json(
        { error: "Auction ID is required" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as JoinAuctionBody;

    if (!isTruthyAgreements(body)) {
      return NextResponse.json(
        {
          error:
            "All policy agreements, goods inspection, and invoice acknowledgment must be accepted before joining an auction.",
        },
        { status: 400 }
      );
    }

    const prisma = await db;

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        sellerId: true,
        title: true,
        type: true,
        status: true,
        workflowStatus: true,
        isFinallyClosed: true,
        startingBid: true,
        securityDeposit: true,
        depositPercent: true,
        entryFee: true,
        endsAt: true,
        effectiveEndsAt: true,
      },
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (!canJoinAuction(auction)) {
      return NextResponse.json(
        { error: "Auction is not open for joining" },
        { status: 400 }
      );
    }

    if (auction.sellerId === userId) {
      return NextResponse.json(
        { error: "Seller cannot join their own auction" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trader: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isLocked) {
      return NextResponse.json(
        {
          error: `Your account is currently locked. Reason: ${user.lockReason || "Account restriction"}`,
        },
        { status: 403 }
      );
    }

    const isTraderVerified = user.trader?.verificationStatus === "APPROVED";
    const isGovernmentVerified =
      user.userType === "GOVERNMENT" && user.isVerified === true;

    if (!isTraderVerified && !isGovernmentVerified) {
      return NextResponse.json(
        {
          error:
            "Only Trader Verified and Government Verified accounts may join auctions.",
        },
        { status: 403 }
      );
    }

    const existingParticipant = await prisma.auctionParticipant.findUnique({
      where: {
        auctionId_userId: { auctionId, userId },
      },
    });

    if (existingParticipant) {
      return NextResponse.json({
        success: true,
        message: "Already joined",
        participant: existingParticipant,
      });
    }

    const computedDeposit =
      auction.depositPercent > 0
        ? roundMoney((auction.startingBid * auction.depositPercent) / 100)
        : roundMoney(auction.securityDeposit || 0);

    if (computedDeposit <= 0) {
      return NextResponse.json(
        {
          error:
            "Auction configuration is invalid. A positive security deposit is required before joining.",
        },
        { status: 400 }
      );
    }

    const entryFeeToCharge = roundMoney(auction.entryFee || 0);

    const userAccountSlug = `USER_${userId}_SYP`;
    const ledgerAccount = await LedgerPostingService.getOrCreateAccount(
      userAccountSlug,
      userId,
      "SYP"
    );

    const totalHolds = await prisma.ledgerHold.aggregate({
      where: {
        accountId: ledgerAccount.id,
        status: "OPEN",
      },
      _sum: {
        amount: true,
      },
    });

    const heldAmount = totalHolds._sum.amount || 0;
    const availableBalance = ledgerAccount.balance - heldAmount;

    const totalRequiredUpfront = computedDeposit + entryFeeToCharge;

    if (availableBalance < totalRequiredUpfront) {
      return NextResponse.json(
        {
          error: "Insufficient funds to join auction.",
          required: totalRequiredUpfront,
          requiredDeposit: computedDeposit,
          requiredEntryFee: entryFeeToCharge,
          available: availableBalance,
        },
        { status: 402 }
      );
    }

    const hold = await LedgerPostingService.createHold(
      userAccountSlug,
      computedDeposit,
      "AUCTION_DEPOSIT",
      auctionId,
      auction.effectiveEndsAt ?? auction.endsAt ?? undefined
    );

    createdHoldId = hold.id;

    if (entryFeeToCharge > 0) {
      await LedgerPostingService.postEntry({
        type: TransactionType.AUCTION_JOIN_FEE,
        description: `Auction entry fee for: ${auction.title}`,
        lines: [
          {
            accountSlug: userAccountSlug,
            amount: -entryFeeToCharge,
            description: `Auction entry fee for auction ${auctionId}`,
          },
          {
            accountSlug: LedgerAccountSlug.SYSTEM_FEE_COLLECTION,
            amount: entryFeeToCharge,
            description: `Auction entry fee collected from user ${userId}`,
          },
        ],
        metadata: {
          auctionId,
          userId,
          entryFee: entryFeeToCharge,
        },
      });
    }

    const participant = await prisma.$transaction(async (tx) => {
      const createdParticipant = await tx.auctionParticipant.create({
        data: {
          auctionId,
          userId,
          depositPaid: computedDeposit,
          entryFeePaid: entryFeeToCharge,
          isExempt: false,
          depositStatus: "HELD",
          workflowStatus: AuctionParticipantWorkflowStatus.APPROVED,
          depositWorkflowStatus: AuctionDepositWorkflowStatus.HELD,
          depositHoldId: hold.id,
          approvedAt: new Date(),
          agreedToTerms: true,
          agreedToPrivacy: true,
          agreedToCommission: true,
          agreedToDataSharing: true,
          hasInspectedGoods: true,
          agreedToInvoice: true,
        },
      });

      await tx.auctionEventLog.create({
        data: {
          auctionId,
          actorId: userId,
          eventType: "AUCTION_PARTICIPANT_JOINED",
          payload: {
            participantId: createdParticipant.id,
            userId,
            auctionType: auction.type,
            depositPercent: auction.depositPercent,
            depositAmount: computedDeposit,
            entryFeeAmount: entryFeeToCharge,
            holdId: hold.id,
            verificationPath: isGovernmentVerified
              ? "GOVERNMENT_VERIFIED"
              : "TRADER_VERIFIED",
          },
        },
      });

      if (
        auction.workflowStatus === AuctionWorkflowStatus.SCHEDULED &&
        auction.type === AuctionType.PRIVATE
      ) {
        await tx.auction.update({
          where: { id: auctionId },
          data: {
            workflowStatus: AuctionWorkflowStatus.SCHEDULED,
          },
        });
      }

      return createdParticipant;
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined the auction",
      participant,
      financials: {
        depositLocked: computedDeposit,
        entryFeeCharged: entryFeeToCharge,
        totalCommitted: totalRequiredUpfront,
      },
    });
  } catch (error) {
    if (createdHoldId) {
      try {
        await LedgerPostingService.releaseHold(createdHoldId);
      } catch (releaseError) {
        console.error("[JOIN_AUCTION_HOLD_ROLLBACK_ERROR]", releaseError);
      }
    }

    console.error("[JOIN_AUCTION_ERROR]", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}