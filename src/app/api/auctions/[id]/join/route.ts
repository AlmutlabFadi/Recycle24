import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  AuctionDepositWorkflowStatus,
  AuctionParticipantWorkflowStatus,
  AuctionParticipantLotWorkflowStatus,
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
  lotIds?: string[];
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
  let createdHoldIds: string[] = [];

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
        currency: true,
        entryFee: true,
        effectiveEndsAt: true,
        endsAt: true,
        lots: {
          select: {
            id: true,
            lineNo: true,
            title: true,
            startingPrice: true,
            depositModeOverride: true,
            depositAmountOverride: true,
            status: true,
            currency: true,
          },
          orderBy: { lineNo: "asc" },
        },
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

    const eligibleLots = (auction.lots || []).filter((lot) => lot.status !== "CANCELLED");
    if (eligibleLots.length === 0) {
      return NextResponse.json(
        { error: "No available lots to join in this auction." },
        { status: 400 }
      );
    }

    const selectedLotIds = Array.isArray(body.lotIds) && body.lotIds.length > 0
      ? body.lotIds
      : eligibleLots.map((lot) => lot.id);

    const selectedLots = eligibleLots.filter((lot) => selectedLotIds.includes(lot.id));

    if (selectedLots.length === 0) {
      return NextResponse.json(
        { error: "You must select at least one lot to join." },
        { status: 400 }
      );
    }

    const computeLotDeposit = (lot: any) => {
      const mode = lot.depositModeOverride || "NONE";
      const value = lot.depositAmountOverride || 0;
      if (mode === "PERCENTAGE") {
        return roundMoney(((lot.startingPrice || 0) * value) / 100);
      }
      if (mode === "FIXED") {
        return roundMoney(value);
      }
      return 0;
    };

    const lotDeposits = selectedLots.map((lot) => ({
      lot,
      depositAmount: computeLotDeposit(lot),
      currency: lot.currency || (auction as any).currency || "SYP",
    }));

    const totalDepositCommitted = roundMoney(
      lotDeposits.reduce((sum, d) => sum + d.depositAmount, 0)
    );

    const entryFeeToCharge = roundMoney((auction as any).entryFee || 0);
    const auctionCurrency = (auction as any).currency || "SYP";

    // Group deposits by currency
    const depositsByCurrency: Record<string, number> = {};
    for (const d of lotDeposits) {
      depositsByCurrency[d.currency] = (depositsByCurrency[d.currency] || 0) + d.depositAmount;
    }
    // Add entry fee to the auction currency group
    if (entryFeeToCharge > 0) {
      depositsByCurrency[auctionCurrency] = (depositsByCurrency[auctionCurrency] || 0) + entryFeeToCharge;
    }

    // Check balances for each involved currency
    for (const [curr, totalRequired] of Object.entries(depositsByCurrency)) {
      if (totalRequired <= 0) continue;

      const userAccountSlug = `USER_${userId}_${curr}`;
      const ledgerAccount = await LedgerPostingService.getOrCreateAccount(
        userAccountSlug,
        userId,
        curr
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

      if (availableBalance < totalRequired) {
        return NextResponse.json(
          {
            error: `Insufficient ${curr} funds to join auction.`,
            currency: curr,
            required: totalRequired,
            available: availableBalance,
          },
          { status: 402 }
        );
      }
    }

    const lotHoldMap = new Map<string, string>();
    for (const entry of lotDeposits) {
      if (entry.depositAmount <= 0) continue;
      
      const userAccountSlug = `USER_${userId}_${entry.currency}`;
      const hold = await LedgerPostingService.createHold(
        userAccountSlug,
        entry.depositAmount,
        "AUCTION_DEPOSIT",
        entry.lot.id,
        (auction as any).effectiveEndsAt ?? (auction as any).endsAt ?? undefined
      );
      createdHoldIds.push(hold.id);
      lotHoldMap.set(entry.lot.id, hold.id);
    }

    if (entryFeeToCharge > 0) {
      const userAccountSlug = `USER_${userId}_${auctionCurrency}`;
      await LedgerPostingService.postEntry({
        type: TransactionType.AUCTION_JOIN_FEE,
        description: `Auction entry fee for: ${auction.title} (${auctionCurrency})`,
        lines: [
          {
            accountSlug: userAccountSlug,
            amount: -entryFeeToCharge,
            description: `Auction entry fee for auction ${auctionId}`,
          },
          {
            accountSlug: `SYSTEM_FEE_COLLECTION_${auctionCurrency}`,
            amount: entryFeeToCharge,
            description: `Auction entry fee collected from user ${userId}`,
          },
        ],
        metadata: {
          auctionId,
          userId,
          entryFee: entryFeeToCharge,
          currency: auctionCurrency,
        },
      });
    }

    const participant = await prisma.$transaction(async (tx) => {
        const createdParticipant = await tx.auctionParticipant.create({
          data: {
            auctionId,
            userId,
            depositPaid: totalDepositCommitted,
            entryFeePaid: entryFeeToCharge,
            isExempt: false,
            depositStatus: totalDepositCommitted > 0 ? "HELD" : "NONE",
            workflowStatus: AuctionParticipantWorkflowStatus.APPROVED,
            depositWorkflowStatus: totalDepositCommitted > 0 ? AuctionDepositWorkflowStatus.HELD : AuctionDepositWorkflowStatus.NONE,
            depositHoldId: null,
            approvedAt: new Date(),
            agreedToTerms: true,
            agreedToPrivacy: true,
            agreedToCommission: true,
            agreedToDataSharing: true,
            hasInspectedGoods: true,
            agreedToInvoice: true,
          },
        });

        await tx.auctionParticipantLot.createMany({
          data: lotDeposits.map((entry) => ({
            participantId: createdParticipant.id,
            auctionId: auctionId,
            lotId: entry.lot.id,
            isSelected: true,
            depositRequired: entry.depositAmount,
            depositHoldId: lotHoldMap.get(entry.lot.id) ?? null,
            depositWorkflowStatus:
              entry.depositAmount > 0
                ? AuctionDepositWorkflowStatus.HELD
                : AuctionDepositWorkflowStatus.NONE,
            workflowStatus: AuctionParticipantLotWorkflowStatus.APPROVED,
          })),
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
            depositAmount: totalDepositCommitted,
            entryFeeAmount: entryFeeToCharge,
            currency: auctionCurrency,
            lotDeposits: lotDeposits.map((entry) => ({
              lotId: entry.lot.id,
              amount: entry.depositAmount,
              currency: entry.currency,
            })),
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
        depositLocked: totalDepositCommitted,
        entryFeeCharged: entryFeeToCharge,
        currency: auctionCurrency,
        breakdown: lotDeposits.map(d => ({
          lotId: d.lot.id,
          amount: d.depositAmount,
          currency: d.currency
        }))
      },
    });
  } catch (error) {
    if (createdHoldIds.length > 0) {
      for (const holdId of createdHoldIds) {
        try {
          await LedgerPostingService.releaseHold(holdId);
        } catch (releaseError) {
          console.error("[JOIN_AUCTION_HOLD_ROLLBACK_ERROR]", releaseError);
        }
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
