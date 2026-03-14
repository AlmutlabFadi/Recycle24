import {
  AuctionDepositWorkflowStatus,
  AuctionExtensionStage,
  AuctionWorkflowStatus,
} from "@prisma/client";

import { db } from "@/lib/db";
import { LedgerPostingService } from "@/lib/ledger/service";
import {
  HoldStatus,
  LedgerAccountSlug,
  TransactionType,
} from "@/lib/ledger/types";

type AuctionParticipantWithUser = {
  userId: string;
  user: {
    id: string;
    userType: string;
  };
};

export class AuctionSettlementService {
  private static async findOpenAuctionDepositHold(
    userId: string,
    auctionId: string
  ) {
    const prisma = await db;

    const account = await LedgerPostingService.getOrCreateAccount(
      `USER_${userId}_SYP`,
      userId,
      "SYP"
    );

    return prisma.ledgerHold.findFirst({
      where: {
        accountId: account.id,
        referenceType: "AUCTION_DEPOSIT",
        referenceId: auctionId,
        status: HoldStatus.OPEN,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  private static async postWinnerCommission(params: {
    auctionId: string;
    auctionTitle: string;
    winnerId: string;
    winningAmount: number;
    isGovernment: boolean;
  }) {
    const { auctionId, auctionTitle, winnerId, winningAmount, isGovernment } =
      params;

    const commissionAmount = Math.round(winningAmount * 0.01 * 100) / 100;
    const effectiveAmount = isGovernment ? 0 : commissionAmount;

    if (commissionAmount <= 0) {
      return;
    }

    await LedgerPostingService.postEntry({
      type: TransactionType.PLATFORM_COMMISSION,
      description: isGovernment
        ? `إعفاء من عمولة الفوز بالمزاد "${auctionTitle}" - القيمة الأصلية ${commissionAmount.toLocaleString()} ل.س`
        : `عمولة الفوز بالمزاد "${auctionTitle}"`,
      lines: [
        {
          accountSlug: `USER_${winnerId}_SYP`,
          amount: -effectiveAmount,
          description: isGovernment
            ? `إعفاء عمولة فائز للمزاد ${auctionId}`
            : `عمولة فائز للمزاد ${auctionId}`,
        },
        {
          accountSlug: LedgerAccountSlug.SYSTEM_FEE_COLLECTION,
          amount: effectiveAmount,
          description: `عمولة فائز من المستخدم ${winnerId}`,
        },
      ],
      metadata: {
        auctionId,
        winnerId,
        originalAmount: commissionAmount,
        effectiveAmount,
        isExempt: isGovernment,
      },
    });
  }

  private static async postSellerCommission(params: {
    auctionId: string;
    auctionTitle: string;
    sellerId: string;
    winningAmount: number;
    isGovernment: boolean;
  }) {
    const { auctionId, auctionTitle, sellerId, winningAmount, isGovernment } =
      params;

    const commissionAmount = Math.round(winningAmount * 0.01 * 100) / 100;
    const effectiveAmount = isGovernment ? 0 : commissionAmount;

    if (commissionAmount <= 0) {
      return;
    }

    await LedgerPostingService.postEntry({
      type: TransactionType.PLATFORM_COMMISSION,
      description: isGovernment
        ? `إعفاء من عمولة بيع المزاد "${auctionTitle}" - القيمة الأصلية ${commissionAmount.toLocaleString()} ل.س`
        : `عمولة بيع المزاد "${auctionTitle}"`,
      lines: [
        {
          accountSlug: `USER_${sellerId}_SYP`,
          amount: -effectiveAmount,
          description: isGovernment
            ? `إعفاء عمولة بائع للمزاد ${auctionId}`
            : `عمولة بائع للمزاد ${auctionId}`,
        },
        {
          accountSlug: LedgerAccountSlug.SYSTEM_FEE_COLLECTION,
          amount: effectiveAmount,
          description: `عمولة بائع من المستخدم ${sellerId}`,
        },
      ],
      metadata: {
        auctionId,
        sellerId,
        originalAmount: commissionAmount,
        effectiveAmount,
        isExempt: isGovernment,
      },
    });
  }

  private static async notifyLoser(params: {
    userId: string;
    auctionId: string;
    auctionTitle: string;
  }) {
    const { NotificationService } = await import("@/lib/notifications/service");

    await NotificationService.create({
      userId: params.userId,
      title: "انتهى المزاد",
      message: `انتهى مزاد "${params.auctionTitle}". لم تفز هذه المرة وتم تحرير مبلغ التأمين الخاص بك.`,
      type: "INFO",
      link: `/auctions/${params.auctionId}`,
      metadata: { auctionId: params.auctionId },
    });
  }

  private static async notifyWinner(params: {
    userId: string;
    auctionId: string;
    auctionTitle: string;
    amount: number;
  }) {
    const { NotificationService } = await import("@/lib/notifications/service");

    await NotificationService.create({
      userId: params.userId,
      title: "تهانينا! لقد فزت في المزاد",
      message: `لقد فزت بمزاد "${params.auctionTitle}" بمبلغ ${params.amount.toLocaleString()} ل.س. تم تثبيت مبلغ التأمين بانتظار براءة الذمة من البائع.`,
      type: "SUCCESS",
      link: `/auctions/${params.auctionId}`,
      metadata: {
        auctionId: params.auctionId,
        amount: params.amount,
      },
    });
  }

  static async closeAuctionFinancials(auctionId: string) {
    const prisma = await db;

    const auction = await prisma.auction.findUnique({
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
        participants: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                userType: true,
              },
            },
          },
        },
        bids: {
          orderBy: [{ amount: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: {
            id: true,
            bidderId: true,
            amount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!auction) {
      throw new Error("Auction not found");
    }

    if (auction.isFinallyClosed) {
      throw new Error("Auction financials already closed");
    }

    if (auction.workflowStatus !== AuctionWorkflowStatus.OPEN) {
      throw new Error(
        `Auction cannot be financially closed from state ${auction.workflowStatus}`
      );
    }

    const deadline = auction.effectiveEndsAt ?? auction.endsAt;
    if (!deadline) {
      throw new Error("Auction deadline is not configured");
    }

    if (Date.now() < deadline.getTime()) {
      throw new Error("Auction has not reached its deadline yet");
    }

    const topBid = auction.bids[0] ?? null;
    const winningBid =
      auction.winningBidId && topBid && topBid.id === auction.winningBidId
        ? topBid
        : topBid;

    const winnerId = winningBid?.bidderId ?? null;
    const finalPrice = winningBid?.amount ?? auction.currentBid ?? null;

    const seller = await prisma.user.findUnique({
      where: { id: auction.sellerId },
      select: {
        id: true,
        userType: true,
      },
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    const openDispute = await prisma.auctionDispute.findFirst({
      where: {
        auctionId,
        status: {
          in: ["OPEN", "UNDER_REVIEW", "ESCALATED"],
        },
      },
      select: { id: true },
    });

    if (openDispute) {
      throw new Error("Auction has an open dispute and cannot be closed");
    }

    const loserIds: string[] = [];

    for (const participant of auction.participants as AuctionParticipantWithUser[]) {
      const hold = await this.findOpenAuctionDepositHold(participant.userId, auctionId);

      if (winnerId && participant.userId === winnerId) {
        await prisma.auctionParticipant.update({
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

      if (hold) {
        await LedgerPostingService.releaseHold(hold.id);
      }

      await prisma.auctionParticipant.update({
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

      loserIds.push(participant.userId);

      await prisma.auctionEventLog.create({
        data: {
          auctionId,
          actorId: participant.userId,
          eventType: "AUCTION_DEPOSIT_RELEASED_TO_LOSER",
          payload: {
            userId: participant.userId,
            holdReleased: Boolean(hold),
          },
        },
      });

      await this.notifyLoser({
        userId: participant.userId,
        auctionId,
        auctionTitle: auction.title,
      });
    }

    let nextWorkflowStatus: AuctionWorkflowStatus = AuctionWorkflowStatus.FAILED;

    if (winnerId && winningBid && finalPrice) {
      await this.postWinnerCommission({
        auctionId,
        auctionTitle: auction.title,
        winnerId,
        winningAmount: finalPrice,
        isGovernment: auction.participants.some(
          (p) => p.userId === winnerId && p.user.userType === "GOVERNMENT"
        ),
      });

      await this.postSellerCommission({
        auctionId,
        auctionTitle: auction.title,
        sellerId: auction.sellerId,
        winningAmount: finalPrice,
        isGovernment: seller.userType === "GOVERNMENT",
      });

      nextWorkflowStatus = AuctionWorkflowStatus.AWAITING_PAYMENT_PROOF;

      await this.notifyWinner({
        userId: winnerId,
        auctionId,
        auctionTitle: auction.title,
        amount: finalPrice,
      });
    }

    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
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
      select: {
        id: true,
        winnerId: true,
        winningBidId: true,
        finalPrice: true,
        workflowStatus: true,
      },
    });

    await prisma.auctionEventLog.create({
      data: {
        auctionId,
        actorId: auction.sellerId,
        eventType: "AUCTION_FINANCIALS_CLOSED",
        payload: {
          winnerId,
          winningBidId: winningBid?.id ?? null,
          finalPrice,
          releasedLoserDepositsCount: loserIds.length,
          workflowStatus: updatedAuction.workflowStatus,
        },
      },
    });

    return {
      success: true,
      winnerId: updatedAuction.winnerId,
      winningBidId: updatedAuction.winningBidId,
      finalPrice: updatedAuction.finalPrice,
      workflowStatus: updatedAuction.workflowStatus,
    };
  }

  static async dischargeWinner(auctionId: string, sellerId: string) {
    const prisma = await db;

    const auction = await prisma.auction.findUnique({
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
      throw new Error("Auction not found");
    }

    if (auction.sellerId !== sellerId) {
      throw new Error("Unauthorized discharge attempt");
    }

    if (!auction.winnerId) {
      throw new Error("No winner assigned to this auction");
    }

    const openDispute = await prisma.auctionDispute.findFirst({
      where: {
        auctionId,
        status: {
          in: ["OPEN", "UNDER_REVIEW", "ESCALATED"],
        },
      },
      select: { id: true },
    });

    if (openDispute) {
      throw new Error("Cannot discharge winner while dispute is open");
    }

    const participant = await prisma.auctionParticipant.findUnique({
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
      },
    });

    if (!participant) {
      throw new Error("Winner participant record not found");
    }

    const hold = await this.findOpenAuctionDepositHold(auction.winnerId, auctionId);

    if (!hold) {
      if (
        participant.depositWorkflowStatus === AuctionDepositWorkflowStatus.RELEASED
      ) {
        return { success: true, alreadyDischarged: true };
      }

      throw new Error("Winner hold not found");
    }

    await LedgerPostingService.releaseHold(hold.id);

    await prisma.auctionParticipant.update({
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

    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        workflowStatus: AuctionWorkflowStatus.COMPLETED,
        status: "CLOSED",
      },
    });

    await prisma.auctionEventLog.create({
      data: {
        auctionId,
        actorId: sellerId,
        eventType: "AUCTION_WINNER_DISCHARGED",
        payload: {
          winnerId: auction.winnerId,
          holdId: hold.id,
        },
      },
    });

    const { NotificationService } = await import("@/lib/notifications/service");

    await NotificationService.create({
      userId: auction.winnerId,
      title: "تم منحك براءة ذمة",
      message: `قام البائع بمنحك براءة ذمة لمزاد "${auction.title}". تم تحرير مبلغ التأمين الخاص بك.`,
      type: "SUCCESS",
      link: "/wallet",
      metadata: { auctionId },
    });

    return { success: true, holdReleased: true };
  }
}