import {
  AuctionDepositWorkflowStatus,
  AuctionExtensionStage,
  AuctionWorkflowStatus,
  Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";
import { LedgerPostingService } from "@/lib/ledger/service";
import { TransactionType } from "@/lib/ledger/types";

type SettlementNotification = {
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS";
  link: string;
  metadata?: Record<string, unknown>;
};

class AuctionSettlementError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AuctionSettlementError";
    this.status = status;
  }
}

type CloseAuctionFinancialsResult = {
  success: true;
  winnerId: string | null;
  winningBidId: string | null;
  finalPrice: number | null;
  workflowStatus: AuctionWorkflowStatus;
};

type DischargeWinnerResult = {
  success: true;
  alreadyDischarged?: boolean;
  holdReleased?: boolean;
};

export class AuctionSettlementService {
  private static async dispatchNotifications(
    notifications: SettlementNotification[]
  ) {
    if (notifications.length === 0) {
      return;
    }

    const { NotificationService } = await import("@/lib/notifications/service");

    for (const notification of notifications) {
      await NotificationService.create(notification);
    }
  }

  private static roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }

  private static async postWinnerCommissionInTransaction(
    tx: Prisma.TransactionClient,
    params: {
      auctionId: string;
      auctionTitle: string;
      winnerId: string;
      winningAmount: number;
      isGovernment: boolean;
    }
  ) {
    const commissionAmount = this.roundMoney(params.winningAmount * 0.01);
    const effectiveAmount = params.isGovernment ? 0 : commissionAmount;

    await LedgerPostingService.postEntryInTransaction(tx, {
      type: TransactionType.PLATFORM_COMMISSION,
      description: params.isGovernment
        ? `Winner commission exempted for auction "${params.auctionTitle}"`
        : `Winner commission for auction "${params.auctionTitle}"`,
      idempotencyKey: `auction-close:winner-commission:${params.auctionId}`,
      lines: [
        {
          accountSlug: `USER_${params.winnerId}_SYP`,
          amount: -effectiveAmount,
          description: `Winner commission for auction ${params.auctionId}`,
        },
        {
          accountSlug: "SYSTEM_FEE_COLLECTION",
          amount: effectiveAmount,
          description: `Winner commission collected from ${params.winnerId}`,
        },
      ],
      metadata: {
        auctionId: params.auctionId,
        winnerId: params.winnerId,
        originalAmount: commissionAmount,
        effectiveAmount,
        isExempt: params.isGovernment,
      },
    });
  }

  private static async postSellerCommissionInTransaction(
    tx: Prisma.TransactionClient,
    params: {
      auctionId: string;
      auctionTitle: string;
      sellerId: string;
      winningAmount: number;
      isGovernment: boolean;
    }
  ) {
    const commissionAmount = this.roundMoney(params.winningAmount * 0.01);
    const effectiveAmount = params.isGovernment ? 0 : commissionAmount;

    await LedgerPostingService.postEntryInTransaction(tx, {
      type: TransactionType.PLATFORM_COMMISSION,
      description: params.isGovernment
        ? `Seller commission exempted for auction "${params.auctionTitle}"`
        : `Seller commission for auction "${params.auctionTitle}"`,
      idempotencyKey: `auction-close:seller-commission:${params.auctionId}`,
      lines: [
        {
          accountSlug: `USER_${params.sellerId}_SYP`,
          amount: -effectiveAmount,
          description: `Seller commission for auction ${params.auctionId}`,
        },
        {
          accountSlug: "SYSTEM_FEE_COLLECTION",
          amount: effectiveAmount,
          description: `Seller commission collected from ${params.sellerId}`,
        },
      ],
      metadata: {
        auctionId: params.auctionId,
        sellerId: params.sellerId,
        originalAmount: commissionAmount,
        effectiveAmount,
        isExempt: params.isGovernment,
      },
    });
  }

  static async closeAuctionFinancials(
    auctionId: string
  ): Promise<CloseAuctionFinancialsResult> {
    const result = await db.$transaction(async (tx) => {
      const notifications: SettlementNotification[] = [];

      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        select: {
          id: true,
          title: true,
          sellerId: true,
          status: true,
          workflowStatus: true,
          endsAt: true,
          effectiveEndsAt: true,
          currentBid: true,
          winningBidId: true,
          winnerId: true,
          isFinallyClosed: true,
          type: true,
          participants: {
            select: {
              userId: true,
              depositStatus: true,
              depositWorkflowStatus: true,
              depositHoldId: true,
              user: {
                select: {
                  id: true,
                  userType: true,
                },
              },
            },
          },
        },
      });

      if (!auction) {
        throw new AuctionSettlementError("Auction not found", 404);
      }

      if (auction.isFinallyClosed) {
        throw new AuctionSettlementError(
          "Auction financials already closed",
          409
        );
      }

      if (auction.workflowStatus !== AuctionWorkflowStatus.OPEN) {
        throw new AuctionSettlementError(
          `Auction cannot be financially closed from state ${auction.workflowStatus}`,
          409
        );
      }

      const deadline = auction.effectiveEndsAt ?? auction.endsAt;

      if (!deadline) {
        throw new AuctionSettlementError("Auction deadline is not configured", 500);
      }

      if (Date.now() < deadline.getTime()) {
        throw new AuctionSettlementError(
          "Auction has not reached its deadline yet",
          409
        );
      }

      const openDispute = await tx.auctionDispute.findFirst({
        where: {
          auctionId,
          status: {
            in: ["OPEN", "UNDER_REVIEW", "ESCALATED"],
          },
        },
        select: { id: true },
      });

      if (openDispute) {
        throw new AuctionSettlementError(
          "Auction has an open dispute and cannot be closed",
          409
        );
      }

      const seller = await tx.user.findUnique({
        where: { id: auction.sellerId },
        select: {
          id: true,
          userType: true,
        },
      });

      if (!seller) {
        throw new AuctionSettlementError("Seller not found", 500);
      }

      let winningBid:
        | {
            id: string;
            bidderId: string;
            amount: number;
          }
        | null = null;

      if (auction.winningBidId) {
        winningBid = await tx.bid.findUnique({
          where: { id: auction.winningBidId },
          select: {
            id: true,
            bidderId: true,
            amount: true,
          },
        });

        if (!winningBid) {
          throw new AuctionSettlementError(
            "Winning bid reference is invalid",
            409
          );
        }

        if (
          auction.currentBid !== null &&
          winningBid.amount !== auction.currentBid
        ) {
          throw new AuctionSettlementError(
            "Winning bid amount does not match current bid",
            409
          );
        }
      }

      const winnerId = winningBid?.bidderId ?? null;
      const finalPrice = winningBid?.amount ?? null;

      for (const participant of auction.participants) {
        const isWinner = winnerId !== null && participant.userId === winnerId;

        if (isWinner) {
          if (!participant.depositHoldId) {
            throw new AuctionSettlementError(
              "Winner deposit hold reference is missing",
              409
            );
          }

          await tx.auctionParticipant.update({
            where: {
              auctionId_userId: {
                auctionId,
                userId: participant.userId,
              },
            },
            data: {
              depositStatus: "HELD",
              depositWorkflowStatus: AuctionDepositWorkflowStatus.HELD,
            },
          });

          continue;
        }

        if (participant.depositHoldId) {
          await LedgerPostingService.releaseHoldInTransaction(
            tx,
            participant.depositHoldId,
            {
              expectedReferenceType: "AUCTION_DEPOSIT",
              expectedReferenceId: auctionId,
            }
          );
        } else if (
          participant.depositWorkflowStatus !==
          AuctionDepositWorkflowStatus.RELEASED
        ) {
          throw new AuctionSettlementError(
            `Missing deposit hold reference for participant ${participant.userId}`,
            409
          );
        }

        await tx.auctionParticipant.update({
          where: {
            auctionId_userId: {
              auctionId,
              userId: participant.userId,
            },
          },
          data: {
            depositStatus: "RELEASED",
            depositWorkflowStatus: AuctionDepositWorkflowStatus.RELEASED,
          },
        });

        await tx.auctionEventLog.create({
          data: {
            auctionId,
            actorId: participant.userId,
            eventType: "AUCTION_DEPOSIT_RELEASED_TO_LOSER",
            payload: {
              userId: participant.userId,
              depositHoldId: participant.depositHoldId,
            },
          },
        });

        notifications.push({
          userId: participant.userId,
          title: "????? ??????",
          message: `????? ???? "${auction.title}". ?? ??? ??? ????? ??? ????? ???? ??????? ????? ??.`,
          type: "INFO",
          link: `/auctions/${auctionId}`,
          metadata: { auctionId },
        });
      }

      let nextWorkflowStatus = AuctionWorkflowStatus.FAILED;

      if (winnerId && winningBid && finalPrice !== null) {
        const winnerParticipant = auction.participants.find(
          (participant) => participant.userId === winnerId
        );

        if (!winnerParticipant) {
          throw new AuctionSettlementError("Winner participant record not found", 409);
        }

        await this.postWinnerCommissionInTransaction(tx, {
          auctionId,
          auctionTitle: auction.title,
          winnerId,
          winningAmount: finalPrice,
          isGovernment: winnerParticipant.user.userType === "GOVERNMENT",
        });

        await this.postSellerCommissionInTransaction(tx, {
          auctionId,
          auctionTitle: auction.title,
          sellerId: auction.sellerId,
          winningAmount: finalPrice,
          isGovernment: seller.userType === "GOVERNMENT",
        });

        nextWorkflowStatus = AuctionWorkflowStatus.AWAITING_PAYMENT_PROOF;

        notifications.push({
          userId: winnerId,
          title: "???????! ??? ??? ?? ??????",
          message: `??? ??? ????? "${auction.title}" ????? ${finalPrice.toLocaleString()} ?.?. ?? ????? ???? ??????? ??????? ????? ????? ?? ??????.`,
          type: "SUCCESS",
          link: `/auctions/${auctionId}`,
          metadata: {
            auctionId,
            amount: finalPrice,
          },
        });
      }

      const updateResult = await tx.auction.updateMany({
        where: {
          id: auctionId,
          workflowStatus: AuctionWorkflowStatus.OPEN,
          isFinallyClosed: false,
        },
        data: {
          status: "CLOSED",
          workflowStatus: nextWorkflowStatus,
          winnerId,
          winningBidId: winningBid?.id ?? null,
          finalPrice,
          finalClosedAt: new Date(),
          isFinallyClosed: true,
          extensionStage: AuctionExtensionStage.FINAL_CLOSED,
        },
      });

      if (updateResult.count === 0) {
        throw new AuctionSettlementError(
          "Auction state changed during financial closing",
          409
        );
      }

      await tx.auctionEventLog.create({
        data: {
          auctionId,
          actorId: auction.sellerId,
          eventType: "AUCTION_FINANCIALS_CLOSED",
          payload: {
            winnerId,
            winningBidId: winningBid?.id ?? null,
            finalPrice,
            releasedLoserDepositsCount: auction.participants.filter(
              (participant) => participant.userId !== winnerId
            ).length,
            workflowStatus: nextWorkflowStatus,
          },
        },
      });

      return {
        result: {
          success: true as const,
          winnerId,
          winningBidId: winningBid?.id ?? null,
          finalPrice,
          workflowStatus: nextWorkflowStatus,
        },
        notifications,
      };
    });

    await this.dispatchNotifications(result.notifications);

    return result.result;
  }

  static async dischargeWinner(
    auctionId: string,
    sellerId: string
  ): Promise<DischargeWinnerResult> {
    const result = await db.$transaction(async (tx) => {
      const notifications: SettlementNotification[] = [];

      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        select: {
          id: true,
          title: true,
          sellerId: true,
          winnerId: true,
          workflowStatus: true,
        },
      });

      if (!auction) {
        throw new AuctionSettlementError("Auction not found", 404);
      }

      if (auction.sellerId !== sellerId) {
        throw new AuctionSettlementError("Unauthorized discharge attempt", 403);
      }

      if (!auction.winnerId) {
        throw new AuctionSettlementError(
          "No winner assigned to this auction",
          409
        );
      }

      if (auction.workflowStatus !== AuctionWorkflowStatus.AWAITING_PAYMENT_PROOF) {
        throw new AuctionSettlementError(
          `Winner cannot be discharged from state ${auction.workflowStatus}`,
          409
        );
      }

      const openDispute = await tx.auctionDispute.findFirst({
        where: {
          auctionId,
          status: {
            in: ["OPEN", "UNDER_REVIEW", "ESCALATED"],
          },
        },
        select: { id: true },
      });

      if (openDispute) {
        throw new AuctionSettlementError(
          "Cannot discharge winner while dispute is open",
          409
        );
      }

      const participant = await tx.auctionParticipant.findUnique({
        where: {
          auctionId_userId: {
            auctionId,
            userId: auction.winnerId,
          },
        },
        select: {
          id: true,
          depositStatus: true,
          depositWorkflowStatus: true,
          depositHoldId: true,
        },
      });

      if (!participant) {
        throw new AuctionSettlementError(
          "Winner participant record not found",
          409
        );
      }

      if (
        participant.depositWorkflowStatus ===
        AuctionDepositWorkflowStatus.RELEASED
      ) {
        return {
          result: {
            success: true as const,
            alreadyDischarged: true,
          },
          notifications,
        };
      }

      if (!participant.depositHoldId) {
        throw new AuctionSettlementError("Winner hold reference not found", 409);
      }

      const releaseResult = await LedgerPostingService.releaseHoldInTransaction(
        tx,
        participant.depositHoldId,
        {
          expectedReferenceType: "AUCTION_DEPOSIT",
          expectedReferenceId: auctionId,
        }
      );

      await tx.auctionParticipant.update({
        where: {
          auctionId_userId: {
            auctionId,
            userId: auction.winnerId,
          },
        },
        data: {
          depositStatus: "RELEASED",
          depositWorkflowStatus: AuctionDepositWorkflowStatus.RELEASED,
        },
      });

      const updateResult = await tx.auction.updateMany({
        where: {
          id: auctionId,
          workflowStatus: AuctionWorkflowStatus.AWAITING_PAYMENT_PROOF,
        },
        data: {
          workflowStatus: AuctionWorkflowStatus.COMPLETED,
          status: "CLOSED",
        },
      });

      if (updateResult.count === 0) {
        throw new AuctionSettlementError(
          "Auction state changed during discharge",
          409
        );
      }

      await tx.auctionEventLog.create({
        data: {
          auctionId,
          actorId: sellerId,
          eventType: "AUCTION_WINNER_DISCHARGED",
          payload: {
            winnerId: auction.winnerId,
            holdId: participant.depositHoldId,
          },
        },
      });

      notifications.push({
        userId: auction.winnerId,
        title: "?? ???? ????? ???",
        message: `??? ?????? ????? ????? ??? ????? "${auction.title}". ?? ????? ???? ??????? ????? ??.`,
        type: "SUCCESS",
        link: "/wallet",
        metadata: { auctionId },
      });

      return {
        result: {
          success: true as const,
          holdReleased: releaseResult.releasedNow,
        },
        notifications,
      };
    });

    await this.dispatchNotifications(result.notifications);

    return result.result;
  }
}

export { AuctionSettlementError };
