import { db } from "@/lib/db";

import { computeExtendedEndAt } from "./anti-sniping";
import { bidFailure } from "./auction-errors";
import { getMinimumAllowedBid } from "./increment-policy";
import type { PlaceBidInput, PlaceBidResult } from "./auction-types";

type AuctionRecord = {
  id: string;
  status: string;
  endAt: Date;
  currentPrice: number;
  highestBidderId: string | null;
};

export async function placeBid(input: PlaceBidInput): Promise<PlaceBidResult> {
  const now = input.now ?? new Date();

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return bidFailure("INVALID_BID_AMOUNT", "Bid amount must be a positive number.");
  }

  const result = await db.$transaction(async (tx) => {
    const auction = (await tx.auction.findUnique({
      where: { id: input.auctionId },
      select: {
        id: true,
        status: true,
        endAt: true,
        currentPrice: true,
        highestBidderId: true,
      },
    })) as AuctionRecord | null;

    if (!auction) {
      return bidFailure("AUCTION_NOT_FOUND", "Auction not found.");
    }

    if (auction.status !== "LIVE") {
      return bidFailure("AUCTION_NOT_LIVE", "Auction is not live.");
    }

    if (auction.endAt.getTime() <= now.getTime()) {
      return bidFailure("AUCTION_ENDED", "Auction already ended.");
    }

    if (auction.highestBidderId && auction.highestBidderId === input.bidderId) {
      return bidFailure("SELF_OUTBID_FORBIDDEN", "Highest bidder cannot outbid themselves.");
    }

    const minimumAllowedBid = getMinimumAllowedBid(auction.currentPrice);

    if (input.amount < minimumAllowedBid) {
      return bidFailure(
        "BID_TOO_LOW",
        `Bid must be at least ${minimumAllowedBid}.`,
      );
    }

    const nextEndAt = computeExtendedEndAt(auction.endAt, now);
    const extended = nextEndAt.getTime() !== auction.endAt.getTime();

    await tx.bid.create({
      data: {
        auctionId: input.auctionId,
        bidderId: input.bidderId,
        amount: input.amount,
      },
    });

    await tx.auction.update({
      where: { id: input.auctionId },
      data: {
        currentPrice: input.amount,
        highestBidderId: input.bidderId,
        endAt: nextEndAt,
      },
    });

    return {
      ok: true as const,
      auctionId: input.auctionId,
      amount: input.amount,
      highestBidderId: input.bidderId,
      currentPrice: input.amount,
      extended,
      endAt: nextEndAt,
    };
  });

  return result;
}