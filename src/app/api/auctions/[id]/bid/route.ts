import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationService } from "@/lib/notifications/service";
import { placeBid } from "@/core/auction/auction-engine";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  userType?: string;
}

type BidRequestBody = {
  amount?: number;
  requestKey?: string;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function mapFailureToStatus(code: string) {
  switch (code) {
    case "AUCTION_NOT_FOUND":
      return 404;
    case "AUCTION_NOT_OPEN":
    case "AUCTION_ENDED":
    case "SELF_OUTBID_FORBIDDEN":
    case "INVALID_BID_AMOUNT":
    case "BID_TOO_LOW":
      return 400;
    case "BID_CONFLICT":
      return 409;
    default:
      return 400;
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auctionId } = await context.params;
    const body = (await request.json()) as BidRequestBody;
    const amount = Number(body.amount);

    const requestKey =
      request.headers.get("x-idempotency-key") ??
      request.headers.get("idempotency-key") ??
      body.requestKey ??
      null;

    if (!requestKey || requestKey.trim().length === 0) {
      return NextResponse.json(
        { error: "Idempotency key is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Bid amount must be a positive number." },
        { status: 400 }
      );
    }

    const participant = await db.auctionParticipant.findFirst({
      where: {
        auctionId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You must join the auction before bidding." },
        { status: 403 }
      );
    }

    const result = await placeBid({
      auctionId,
      bidderId: user.id,
      participantId: participant.id,
      amount: roundMoney(amount),
      requestKey,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status: mapFailureToStatus(result.code) }
      );
    }

    const auction = await db.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        sellerId: true,
        title: true,
        currentBid: true,
        winningBidId: true,
        effectiveEndsAt: true,
        extensionCount: true,
        version: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found after bid execution." },
        { status: 404 }
      );
    }

    if (!result.replayed) {
      if (auction.sellerId !== user.id) {
        await NotificationService.create({
          userId: auction.sellerId,
          title: "New bid received",
          message: `A new bid of ${result.amount} was placed on ${auction.title}.`,
        });
      }

      if (
        result.previousHighestBidderId &&
        result.previousHighestBidderId !== user.id
      ) {
        await NotificationService.create({
          userId: result.previousHighestBidderId,
          title: "You have been outbid",
          message: `You have been outbid on ${auction.title}.`,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        replayed: result.replayed,
        bid: {
          id: result.bidId,
          amount: result.amount,
          bidderId: result.bidderId,
          currentBid: auction.currentBid,
          winningBidId: auction.winningBidId,
          effectiveEndsAt: auction.effectiveEndsAt,
          extensionCount: auction.extensionCount,
          extended: result.extended,
          version: auction.version,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auction bid route failed", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
