/**
 * 🏛️ BUSINESS AGENT — Auction Close Agent
 * 
 * Automatically closes expired auctions, selects the winner (highest bidder),
 * and creates a Deal record visible in the platform UI.
 * 
 * Visible Effect: Auction status changes from LIVE → ENDED in the DB.
 * Winner and final price are set. A Deal is created.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";

import prisma from "../prisma";

export class AuctionAgent extends BaseAgent {
  constructor() {
    super("AuctionAgent", "TASK_MANAGER");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "AUCTION_CLOSE":
        return this.closeExpiredAuctions();
      case "AUCTION_START":
        return this.startScheduledAuctions();
      default:
        return { message: `AuctionAgent: unhandled task type ${task.type}` };
    }
  }

  /**
   * Finds LIVE auctions whose `endsAt` has passed, picks the winner,
   * sets finalPrice, and creates a Deal record.
   */
  private async closeExpiredAuctions() {
    const now = new Date();

    const expiredAuctions = (await prisma.auction.findMany({
      where: {
        status: "LIVE",
        endsAt: { lte: now },
      },
      select: {
        id: true,
        title: true,
        sellerId: true,
        weight: true,
        currency: true,
        winnerSelectionMode: true,
        lots: {
          select: {
            id: true,
            title: true,
            category: true,
            quantity: true,
            unit: true,
            currency: true,
            bids: {
              orderBy: { amount: "desc" },
              take: 1,
            },
          },
        },
        bids: {
          orderBy: { amount: "desc" },
          take: 1,
        },
      },
    })) as any[];

    const results = {
      closedCount: 0,
      dealsCreated: 0,
      noWinner: 0,
      timestamp: now.toISOString(),
    };

    for (const auction of expiredAuctions) {
      if (auction.winnerSelectionMode === "PER_LOT") {
        let awardedLots = 0;
        for (const lot of auction.lots || []) {
          const winningBid = lot.bids?.[0];
          if (!winningBid) {
            await prisma.auctionLot.update({
              where: { id: lot.id },
              data: { status: "FAILED" },
            });
            continue;
          }

          // Award Lot
          await prisma.auctionLot.update({
            where: { id: lot.id },
            data: {
              status: "AWARDED",
              winnerId: winningBid.bidderId,
              finalPrice: winningBid.amount,
              winningBidId: winningBid.id,
            },
          });

          // Create Deal for this lot
          await prisma.deal.create({
            data: {
              auctionId: auction.id,
              sellerId: auction.sellerId,
              buyerId: winningBid.bidderId,
              materialType: lot.category || auction.category,
              weight: lot.quantity,
              totalAmount: winningBid.amount,
              platformFee: winningBid.amount * 0.01,
              currency: lot.currency || auction.currency || "SYP",
              status: "PENDING",
            },
          });

          awardedLots++;
          results.dealsCreated++;
        }

        // Mark auction as ENDED
        await prisma.auction.update({
          where: { id: auction.id },
          data: { status: "ENDED" },
        });

        // Financial Settlement
        const { AuctionSettlementService } = await import("@/lib/auction/settlement");
        await AuctionSettlementService.closeAuctionFinancials(auction.id);

        results.closedCount++;
        console.log(`[AuctionAgent] 🏆 PER_LOT Auction closed: "${auction.title}" — ${awardedLots} lots awarded.`);
        continue;
      }

      // legacy / SINGLE_WINNER behavior
      const winningBid = auction.bids[0];

      if (!winningBid) {
        // No bids — close with no winner
        await prisma.auction.update({
          where: { id: auction.id },
          data: { status: "ENDED" },
        });
        results.noWinner++;
        console.log(`[AuctionAgent] 📭 Auction ended with no bids: ${auction.title}`);
        continue;
      }

      // Update auction: ENDED + winner + final price
      await prisma.auction.update({
        where: { id: auction.id },
        data: {
          status: "ENDED",
          winnerId: winningBid.bidderId,
          finalPrice: winningBid.amount,
        },
      });

      // 🏛️ BANK-GRADE SETTLEMENT (Phase 19)
      const { AuctionSettlementService } = await import("@/lib/auction/settlement");
      await AuctionSettlementService.closeAuctionFinancials(auction.id);

      // Create a Deal record
      await prisma.deal.create({
        data: {
          auctionId: auction.id,
          sellerId: auction.sellerId,
          buyerId: winningBid.bidderId,
          materialType: auction.category,
          weight: auction.weight,
          totalAmount: winningBid.amount,
          platformFee: winningBid.amount * 0.01,
          currency: auction.currency || "SYP",
          status: "PENDING",
        },
      });

      // Log to SecurityLog ... (skipping for brevity in chunk but it should be preserved if I didn't replace it)
      // I'll wrap the security log in the loop correctly
      await prisma.securityLog.create({
        data: {
          level: "INFO",
          event: "ADMIN_ACTION",
          details: JSON.stringify({
            action: "AUCTION_AUTO_CLOSED",
            auctionId: auction.id,
            title: auction.title,
            finalPrice: winningBid.amount,
            winnerId: winningBid.bidderId,
            settlement: "COMPLETED",
          }),
          ip: "ORCHESTRATOR",
        },
      });

      results.closedCount++;
      results.dealsCreated++;
      console.log(`[AuctionAgent] 🏆 Auction closed: "${auction.title}" — Winner: ${winningBid.bidderId} | Price: ${winningBid.amount}`);
    }

    if (expiredAuctions.length > 0) {
      console.log(
        `[AuctionAgent] ✅ Processed ${expiredAuctions.length} auctions: ${results.closedCount} closed, ${results.dealsCreated} deals created.`
      );
    }

    return results;
  }

  /**
   * Finds SCHEDULED auctions whose `scheduledAt` has arrived and starts them.
   */
  private async startScheduledAuctions() {
    const now = new Date();

    const toStart = await prisma.auction.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now },
      },
    });

    const results = { startedCount: 0, timestamp: now.toISOString() };

    for (const auction of toStart) {
      const endsAt = new Date(now.getTime() + auction.duration * 60 * 60 * 1000);
      await prisma.auction.update({
        where: { id: auction.id },
        data: {
          status: "LIVE",
          startedAt: now,
          endsAt,
        },
      });
      results.startedCount++;
      console.log(`[AuctionAgent] 🔴 Auction LIVE: "${auction.title}" — ends at ${endsAt.toISOString()}`);
    }

    return results;
  }
}
