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
  metadata?: Prisma.InputJsonValue;
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
  winnersCount: number;
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
      currency: string;
      lotId?: string;
    }
  ) {
    const commissionAmount = this.roundMoney(params.winningAmount * 0.01);
    const effectiveAmount = params.isGovernment ? 0 : commissionAmount;

    await LedgerPostingService.postEntryInTransaction(tx, {
      type: TransactionType.PLATFORM_COMMISSION,
      description: params.isGovernment
        ? `Winner commission exempted for auction "${params.auctionTitle}"${params.lotId ? ` (Lot ${params.lotId})` : ""}`
        : `Winner commission for auction "${params.auctionTitle}"${params.lotId ? ` (Lot ${params.lotId})` : ""}`,
      idempotencyKey: `auction-close:winner-commission:${params.auctionId}${params.lotId ? `:${params.lotId}` : ""}`,
      lines: [
        {
          accountSlug: `USER_${params.winnerId}_${params.currency}`,
          amount: -effectiveAmount,
          description: `Winner commission for auction ${params.auctionId}`,
        },
        {
          accountSlug: `SYSTEM_FEE_COLLECTION_${params.currency}`,
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
      currency: string;
      lotId?: string;
    }
  ) {
    const commissionAmount = this.roundMoney(params.winningAmount * 0.01);
    const effectiveAmount = params.isGovernment ? 0 : commissionAmount;

    await LedgerPostingService.postEntryInTransaction(tx, {
      type: TransactionType.PLATFORM_COMMISSION,
      description: params.isGovernment
        ? `Seller commission exempted for auction "${params.auctionTitle}"${params.lotId ? ` (Lot ${params.lotId})` : ""}`
        : `Seller commission for auction "${params.auctionTitle}"${params.lotId ? ` (Lot ${params.lotId})` : ""}`,
      idempotencyKey: `auction-close:seller-commission:${params.auctionId}${params.lotId ? `:${params.lotId}` : ""}`,
      lines: [
        {
          accountSlug: `USER_${params.sellerId}_${params.currency}`,
          amount: -effectiveAmount,
          description: `Seller commission for auction ${params.auctionId}`,
        },
        {
          accountSlug: `SYSTEM_FEE_COLLECTION_${params.currency}`,
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
          winnerId: true,
          finalPrice: true,
          currency: true,
          workflowStatus: true,
          isFinallyClosed: true,
          endsAt: true,
          effectiveEndsAt: true,
          winnerSelectionMode: true,
          lots: {
            select: {
              id: true,
              winnerId: true,
              finalPrice: true,
              currency: true,
              winningBidId: true,
            },
          },
          bids: {
            orderBy: { amount: "desc" },
            take: 1,
            select: { id: true, bidderId: true, amount: true },
          },
          participants: {
            select: {
              id: true,
              userId: true,
              depositStatus: true,
              depositWorkflowStatus: true,
              depositHoldId: true,
              selectedLots: {
                select: {
                  lotId: true,
                  depositHoldId: true,
                  depositWorkflowStatus: true,
                  depositRequired: true,
                },
              },
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
        throw new AuctionSettlementError("Auction seller not found", 404);
      }

      const lotWinningBidIds = auction.lots
        .map((lot) => lot.winningBidId)
        .filter((id): id is string => Boolean(id));

      const winningBids = lotWinningBidIds.length > 0
        ? await tx.bid.findMany({
            where: { id: { in: lotWinningBidIds } },
            select: {
              id: true,
              bidderId: true,
              amount: true,
            },
          })
        : [];

      const winningBidMap = new Map(
        winningBids.map((bid) => [bid.id, bid])
      );

      // 1. Identify all winners
      const winnersMap = new Map<string, { totalAmount: number; currency: string; lotId?: string }[]>();

      if (auction.winnerSelectionMode === "PER_LOT") {
        for (const lot of auction.lots) {
          const winningBid = lot.winningBidId
            ? winningBidMap.get(lot.winningBidId)
            : undefined;
          const resolvedWinnerId = lot.winnerId ?? winningBid?.bidderId ?? null;
          const resolvedFinalPrice =
            lot.finalPrice ?? (winningBid ? winningBid.amount : null);

          if (resolvedWinnerId && resolvedFinalPrice !== null) {
            if (!lot.winnerId || lot.finalPrice === null) {
              await tx.auctionLot.update({
                where: { id: lot.id },
                data: {
                  winnerId: resolvedWinnerId,
                  finalPrice: resolvedFinalPrice,
                },
              });
            }

            const list = winnersMap.get(resolvedWinnerId) || [];
            list.push({
              totalAmount: resolvedFinalPrice,
              currency: lot.currency || auction.currency,
              lotId: lot.id,
            });
            winnersMap.set(resolvedWinnerId, list);
          }
        }
      } else if (auction.winnerId) {
        winnersMap.set(auction.winnerId, [
          { totalAmount: auction.finalPrice!, currency: auction.currency },
        ]);
      }

      const allWinnerIds = new Set(winnersMap.keys());

      // 2. Iterate participants to release/hold deposits
      for (const participant of auction.participants) {
        const isWinner = allWinnerIds.has(participant.userId);

        if (isWinner) {
          // Keep deposits held for winners
          // They will be released manually or on payment confirmation (Discharge)
          // For PER_LOT, we might want to release specific lots they DIDN'T win, 
          // but for simplicity, if they won ANY lot, we keep their auction-level and won-lot deposits.
          
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

        const participantLots = participant.selectedLots || [];
        const releasedLotIds: string[] = [];

        for (const lot of participantLots) {
          if (!lot.depositHoldId) {
            continue;
          }

          await LedgerPostingService.releaseHoldInTransaction(
            tx,
            lot.depositHoldId,
            {
              expectedReferenceType: "AUCTION_DEPOSIT",
              expectedReferenceId: lot.lotId,
            }
          );

          releasedLotIds.push(lot.lotId);

          await tx.auctionParticipantLot.update({
            where: {
              participantId_lotId: {
                participantId: participant.id,
                lotId: lot.lotId,
              },
            },
            data: {
              depositWorkflowStatus: AuctionDepositWorkflowStatus.RELEASED,
            },
          });
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
              releasedLotIds,
            },
          },
        });

        notifications.push({
          userId: participant.userId,
          title: "انتهى المزاد",
          message: `لقد انتهى المزاد "${auction.title}". تم فك حجز مبالغ التأمين الخاصة بك لهذا المزاد.`,
          type: "INFO",
          link: `/auctions/${auctionId}`,
          metadata: { auctionId },
        });
      }

      let nextWorkflowStatus: AuctionWorkflowStatus = AuctionWorkflowStatus.FAILED;
      let resolvedAuctionWinnerId: string | null = null;
      let resolvedAuctionFinalPrice: number | null = null;

      if (winnersMap.size > 0) {
        nextWorkflowStatus = AuctionWorkflowStatus.AWAITING_PAYMENT_PROOF;

        for (const [winnerId, awards] of winnersMap.entries()) {
          const winnerParticipant = auction.participants.find(
            (participant) => participant.userId === winnerId
          );

          if (!winnerParticipant) continue;

          for (const award of awards) {
            // Post commission for THIS specific award (lot or full auction)
            await this.postWinnerCommissionInTransaction(tx, {
              auctionId,
              auctionTitle: auction.title,
              winnerId,
              winningAmount: award.totalAmount,
              isGovernment: winnerParticipant.user.userType === "GOVERNMENT",
              currency: award.currency,
              lotId: award.lotId,
            });

            await this.postSellerCommissionInTransaction(tx, {
              auctionId,
              auctionTitle: auction.title,
              sellerId: auction.sellerId,
              winningAmount: award.totalAmount,
              isGovernment: seller.userType === "GOVERNMENT",
              currency: award.currency,
              lotId: award.lotId,
            });
          }

          // Single notification per winner (or per award if preferred, let's do once)
          const totalWon = awards.reduce((sum, a) => sum + a.totalAmount, 0);
          notifications.push({
            userId: winnerId,
            title: "تهانينا! لقد فزت في المزاد",
            message: `لقد فزت في المزاد "${auction.title}". عدد الأجزاء الفائزة: ${awards.length}. إجمالي المبلغ: ${totalWon.toLocaleString()} ${auction.currency}. يرجى إتمام السداد.`,
            type: "SUCCESS",
            link: `/auctions/${auctionId}`,
            metadata: {
              auctionId,
              amount: totalWon,
              currency: auction.currency,
            },
          });
        }
      }

      if (auction.winnerSelectionMode === "PER_LOT" && auction.lots.length === 1) {
        const onlyLot = auction.lots[0];
        const winningBid = onlyLot.winningBidId
          ? winningBidMap.get(onlyLot.winningBidId)
          : undefined;
        const lotWinnerId = onlyLot.winnerId ?? winningBid?.bidderId ?? null;
        const lotFinalPrice =
          onlyLot.finalPrice ?? (winningBid ? winningBid.amount : null);

        if (lotWinnerId && lotFinalPrice !== null) {
          resolvedAuctionWinnerId = lotWinnerId;
          resolvedAuctionFinalPrice = lotFinalPrice;
        }
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
          ...(resolvedAuctionWinnerId
            ? { winnerId: resolvedAuctionWinnerId, finalPrice: resolvedAuctionFinalPrice }
            : {}),
          // Note: in multi-winner mode, auction.winnerId might only be the FIRST winner or NULL.
          // We rely on lot.winnerId and separate Deals.
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
            winnersCount: winnersMap.size,
            winnerIds: Array.from(allWinnerIds),
            workflowStatus: nextWorkflowStatus,
          },
        },
      });

      return {
        result: {
          success: true as const,
          winnersCount: winnersMap.size,
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
    sellerId: string,
    winnerId?: string
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

      const targetWinnerId = winnerId || auction.winnerId;

      if (!targetWinnerId) {
        throw new AuctionSettlementError(
          "No winner specified or assigned to this auction",
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
            userId: targetWinnerId as string,
          },
        },
        select: {
          id: true,
          depositStatus: true,
          depositWorkflowStatus: true,
          depositHoldId: true,
          selectedLots: {
            select: {
              lotId: true,
              depositHoldId: true,
              depositWorkflowStatus: true,
            },
          },
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

      const releasedLotIds: string[] = [];
      for (const lot of participant.selectedLots || []) {
        if (!lot.depositHoldId) {
          continue;
        }

        await LedgerPostingService.releaseHoldInTransaction(
          tx,
          lot.depositHoldId,
          {
            expectedReferenceType: "AUCTION_DEPOSIT",
            expectedReferenceId: lot.lotId,
          }
        );

        releasedLotIds.push(lot.lotId);

        await tx.auctionParticipantLot.update({
          where: {
            participantId_lotId: {
              participantId: participant.id,
              lotId: lot.lotId,
            },
          },
          data: {
            depositWorkflowStatus: AuctionDepositWorkflowStatus.RELEASED,
          },
        });
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
      }

      await tx.auctionParticipant.update({
        where: {
          auctionId_userId: {
            auctionId,
            userId: targetWinnerId as string,
          },
        },
        data: {
          depositStatus: "RELEASED",
          depositWorkflowStatus: AuctionDepositWorkflowStatus.RELEASED,
        },
      });

      // 3. Conditional status transition (only if ALL winners are discharged)
      const allLotWinners = await tx.auctionLot.findMany({
        where: { auctionId, winnerId: { not: null } },
        select: { winnerId: true },
      });
      
      // If no lot winners (shouldn't happen here usually), check auction-level winner
      const uniqueWinnerIds = allLotWinners.length > 0 
        ? new Set(allLotWinners.map(l => l.winnerId!))
        : new Set(auction.winnerId ? [auction.winnerId] : []);

      const releasedWinnersCount = await tx.auctionParticipant.count({
        where: {
          auctionId,
          userId: { in: Array.from(uniqueWinnerIds) },
          depositWorkflowStatus: AuctionDepositWorkflowStatus.RELEASED
        }
      });

      const allDischarged = releasedWinnersCount >= uniqueWinnerIds.size;

      if (allDischarged) {
        await tx.auction.updateMany({
          where: {
            id: auctionId,
            workflowStatus: AuctionWorkflowStatus.AWAITING_PAYMENT_PROOF,
          },
          data: {
            workflowStatus: AuctionWorkflowStatus.COMPLETED,
            status: "CLOSED",
          },
        });
      }

      await tx.auctionEventLog.create({
        data: {
          auctionId,
          actorId: sellerId,
          eventType: "AUCTION_WINNER_DISCHARGED",
          payload: {
            winnerId: targetWinnerId,
            holdId: participant.depositHoldId,
            releasedLotIds,
          },
        },
      });

      notifications.push({
        userId: targetWinnerId,
        title: "تم فك حجز التأمين",
        message: `تم تحرير مبلغ التأمين الخاص بك في المزاد "${auction.title}". يمكنك الآن استخدامه في محفظتك.`,
        type: "SUCCESS",
        link: "/wallet",
        metadata: { auctionId },
      });

      return {
        result: {
          success: true as const,
          holdReleased: releasedLotIds.length > 0,
        },
        notifications,
      };
    });

    await this.dispatchNotifications(result.notifications);

    return result.result;
  }
}

export { AuctionSettlementError };

