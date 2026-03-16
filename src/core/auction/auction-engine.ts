import {
  AuctionDepositWorkflowStatus,
  AuctionExtensionStage,
  AuctionParticipantWorkflowStatus,
  AuctionWorkflowStatus,
  BidWorkflowStatus,
} from "@prisma/client";

import { db } from "@/lib/db";
import { LedgerEnforcementService } from "@/lib/ledger/enforcement";
import { HoldStatus } from "@/lib/ledger/types";

import { computeExtendedEndAt } from "./anti-sniping";
import { bidFailure } from "./auction-errors";
import { getMinimumAllowedBid } from "./increment-policy";
import type {
  AuctionRuntimeSnapshot,
  HighestBidSnapshot,
  PlaceBidInput,
  PlaceBidResult,
} from "./auction-types";

class BidConflictError extends Error {
  constructor() {
    super("Auction state changed during bidding.");
    this.name = "BidConflictError";
  }
}

function isAuctionOpen(auction: AuctionRuntimeSnapshot) {
  return (
    !auction.isFinallyClosed &&
    auction.workflowStatus === AuctionWorkflowStatus.OPEN
  );
}

function resolveAuctionDeadline(auction: {
  effectiveEndsAt: Date | null;
  endsAt: Date | null;
}) {
  return auction.effectiveEndsAt ?? auction.endsAt;
}

function resolveCurrentBidAmount(
  auction: Pick<AuctionRuntimeSnapshot, "currentBid" | "startingBid">,
  winningBid: HighestBidSnapshot | null
) {
  return winningBid?.amount ?? auction.currentBid ?? auction.startingBid;
}

function mapExtensionStage(extensionCount: number): AuctionExtensionStage {
  if (extensionCount <= 0) return AuctionExtensionStage.NONE;
  if (extensionCount === 1) return AuctionExtensionStage.FIRST;
  if (extensionCount === 2) return AuctionExtensionStage.SECOND;
  return AuctionExtensionStage.THIRD;
}

export async function placeBid(input: PlaceBidInput): Promise<PlaceBidResult> {
  const now = input.now ?? new Date();

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return bidFailure(
      "INVALID_BID_AMOUNT",
      "Bid amount must be a positive number."
    );
  }

  try {
    return await db.$transaction(async (tx) => {
      if (input.requestKey) {
        const existingBid = await tx.bid.findFirst({
          where: {
            requestKey: input.requestKey,
          },
          select: {
            id: true,
            auctionId: true,
            bidderId: true,
            amount: true,
            createdAt: true,
          },
        });

        if (existingBid) {
          if (
            existingBid.auctionId !== input.auctionId ||
            existingBid.bidderId !== input.bidderId
          ) {
            return bidFailure(
              "BID_CONFLICT",
              "Idempotency key already belongs to a different bid context."
            );
          }

          const replayAuction = await tx.auction.findUnique({
            where: { id: input.auctionId },
            select: {
              currentBid: true,
              winningBidId: true,
              effectiveEndsAt: true,
              extensionCount: true,
            },
          });

          if (!replayAuction) {
            return bidFailure("AUCTION_NOT_FOUND", "Auction not found.");
          }

          return {
            ok: true,
            auctionId: input.auctionId,
            bidId: existingBid.id,
            amount: existingBid.amount,
            bidderId: existingBid.bidderId,
            previousHighestBidId: null,
            previousHighestBidderId: null,
            currentBid: replayAuction.currentBid ?? existingBid.amount,
            winningBidId: replayAuction.winningBidId ?? existingBid.id,
            effectiveEndsAt: replayAuction.effectiveEndsAt,
            extensionCount: replayAuction.extensionCount ?? 0,
            extended: false,
            replayed: true,
          };
        }
      }

      const auction = (await tx.auction.findUnique({
        where: { id: input.auctionId },
        select: {
          id: true,
          sellerId: true,
          title: true,
          startingBid: true,
          status: true,
          workflowStatus: true,
          isFinallyClosed: true,
          endsAt: true,
          effectiveEndsAt: true,
          extensionCount: true,
          currentBid: true,
          winningBidId: true,
          version: true,
        },
      })) as AuctionRuntimeSnapshot | null;

      if (!auction) {
        return bidFailure("AUCTION_NOT_FOUND", "Auction not found.");
      }

      if (!isAuctionOpen(auction)) {
        return bidFailure("AUCTION_NOT_OPEN", "Auction is not open for bidding.");
      }

      const deadline = resolveAuctionDeadline(auction);

      if (!deadline || deadline.getTime() <= now.getTime()) {
        return bidFailure("AUCTION_ENDED", "Auction already ended.");
      }

      const participant = await tx.auctionParticipant.findUnique({
        where: { id: input.participantId },
        select: {
          id: true,
          auctionId: true,
          userId: true,
          isExempt: true,
          workflowStatus: true,
          depositWorkflowStatus: true,
          depositHoldId: true,
        },
      });

      if (!participant || participant.auctionId !== input.auctionId) {
        return bidFailure(
          "BID_CONFLICT",
          "Auction participant context is invalid."
        );
      }

      if (participant.userId !== input.bidderId) {
        return bidFailure(
          "BID_CONFLICT",
          "Bidder does not match the participant record."
        );
      }

      if (
        participant.workflowStatus !== AuctionParticipantWorkflowStatus.APPROVED
      ) {
        return bidFailure(
          "AUCTION_NOT_OPEN",
          "Your auction participation is not approved for bidding."
        );
      }

      const debtSnapshot = await LedgerEnforcementService.verifyDebtStatus(
        input.bidderId
      );

      if (debtSnapshot.isLocked) {
        return bidFailure(
          "AUCTION_NOT_OPEN",
          debtSnapshot.reason ?? "Your account is locked due to unpaid debt."
        );
      }

      if (!participant.isExempt) {
        const depositWorkflowSatisfied =
          participant.depositWorkflowStatus ===
          AuctionDepositWorkflowStatus.HELD;

        if (!depositWorkflowSatisfied) {
          return bidFailure(
            "AUCTION_NOT_OPEN",
            "Security deposit must be held before bidding."
          );
        }

        if (!participant.depositHoldId) {
          return bidFailure(
            "BID_CONFLICT",
            "Missing deposit hold for participant."
          );
        }

        const hold = await tx.ledgerHold.findUnique({
          where: { id: participant.depositHoldId },
          select: {
            id: true,
            status: true,
            referenceType: true,
            referenceId: true,
            amount: true,
          },
        });

        if (!hold) {
          return bidFailure(
            "BID_CONFLICT",
            "Deposit hold was not found."
          );
        }

        if (hold.status !== HoldStatus.OPEN) {
          return bidFailure(
            "AUCTION_NOT_OPEN",
            "Security deposit hold is no longer active."
          );
        }

        if (hold.referenceId !== input.auctionId) {
          return bidFailure(
            "BID_CONFLICT",
            "Deposit hold does not belong to this auction."
          );
        }
      } else {
        const depositWorkflowSatisfied =
          participant.depositWorkflowStatus ===
            AuctionDepositWorkflowStatus.EXEMPT ||
          participant.depositWorkflowStatus ===
            AuctionDepositWorkflowStatus.HELD;

        if (!depositWorkflowSatisfied) {
          return bidFailure(
            "BID_CONFLICT",
            "Participant exemption state is invalid."
          );
        }
      }

      const currentWinningBid = auction.winningBidId
        ? ((await tx.bid.findFirst({
            where: { id: auction.winningBidId },
            select: {
              id: true,
              bidderId: true,
              amount: true,
              status: true,
              createdAt: true,
            },
          })) as HighestBidSnapshot | null)
        : null;

      if (currentWinningBid?.bidderId === input.bidderId) {
        return bidFailure(
          "SELF_OUTBID_FORBIDDEN",
          "Highest bidder cannot outbid themselves."
        );
      }

      const currentAmount = resolveCurrentBidAmount(auction, currentWinningBid);
      const minimumAllowedBid = getMinimumAllowedBid(currentAmount);

      if (input.amount < minimumAllowedBid) {
        return bidFailure(
          "BID_TOO_LOW",
          `Bid must be at least ${minimumAllowedBid}.`
        );
      }

      const nextEffectiveEndsAt = computeExtendedEndAt(deadline, now);
      const extended = nextEffectiveEndsAt.getTime() !== deadline.getTime();
      const nextExtensionCount = extended
        ? auction.extensionCount + 1
        : auction.extensionCount;

      if (currentWinningBid?.status === BidWorkflowStatus.WINNING) {
        await tx.bid.update({
          where: { id: currentWinningBid.id },
          data: {
            status: BidWorkflowStatus.OUTBID,
          },
        });
      }

      const newBid = await tx.bid.create({
        data: {
          auctionId: input.auctionId,
          bidderId: input.bidderId,
          participantId: input.participantId,
          amount: input.amount,
          requestKey: input.requestKey ?? null,
          status: BidWorkflowStatus.WINNING,
          acceptedAt: now,
        },
        select: {
          id: true,
          bidderId: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      });

      const updated = await tx.auction.updateMany({
        where: {
          id: input.auctionId,
          version: auction.version,
          workflowStatus: AuctionWorkflowStatus.OPEN,
          isFinallyClosed: false,
        },
        data: {
          currentBid: input.amount,
          winningBidId: newBid.id,
          effectiveEndsAt: nextEffectiveEndsAt,
          extensionCount: nextExtensionCount,
          extensionStage: mapExtensionStage(nextExtensionCount),
          lastExtensionAt: extended ? now : undefined,
          version: {
            increment: 1,
          },
        },
      });

      if (updated.count === 0) {
        throw new BidConflictError();
      }

      await tx.auctionEventLog.create({
        data: {
          auctionId: input.auctionId,
          actorId: input.bidderId,
          eventType: "AUCTION_BID_PLACED",
          payload: {
            bidId: newBid.id,
            amount: input.amount,
            bidderId: input.bidderId,
            participantId: input.participantId,
            requestKey: input.requestKey ?? null,
            previousHighestBidId: currentWinningBid?.id ?? null,
            previousHighestBidderId:
              currentWinningBid?.bidderId && currentWinningBid.bidderId !== input.bidderId
                ? currentWinningBid.bidderId
                : null,
            currentBid: input.amount,
            winningBidId: newBid.id,
            effectiveEndsAt: nextEffectiveEndsAt,
            extensionCount: nextExtensionCount,
            extended,
            versionAfterUpdate: auction.version + 1,
          },
        },
      });

      return {
        ok: true,
        auctionId: input.auctionId,
        bidId: newBid.id,
        amount: input.amount,
        bidderId: input.bidderId,
        previousHighestBidId: currentWinningBid?.id ?? null,
        previousHighestBidderId:
          currentWinningBid?.bidderId && currentWinningBid.bidderId !== input.bidderId
            ? currentWinningBid.bidderId
            : null,
        currentBid: input.amount,
        winningBidId: newBid.id,
        effectiveEndsAt: nextEffectiveEndsAt,
        extensionCount: nextExtensionCount,
        extended,
        replayed: false,
      };
    });
  } catch (error) {
    if (error instanceof BidConflictError) {
      return bidFailure(
        "BID_CONFLICT",
        "Auction state changed during bidding. Please retry."
      );
    }

    throw error;
  }
}
