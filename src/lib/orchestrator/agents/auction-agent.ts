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

    const expiredAuctions = await prisma.auction.findMany({
      where: {
        status: "LIVE",
        endsAt: { lte: now },
      },
      include: {
        bids: {
          orderBy: { amount: "desc" },
          take: 1,
        },
      },
    });

    const results = {
      closedCount: 0,
      dealsCreated: 0,
      noWinner: 0,
      timestamp: now.toISOString(),
    };

    for (const auction of expiredAuctions) {
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

      // Create a Deal between buyer and seller
      const platformFee = winningBid.amount * 0.025; // 2.5% platform fee
      await prisma.deal.create({
        data: {
          auctionId: auction.id,
          sellerId: auction.sellerId,
          buyerId: winningBid.bidderId,
          materialType: auction.category,
          weight: auction.weight,
          totalAmount: winningBid.amount,
          platformFee,
          status: "PENDING",
        },
      });

      // Log to SecurityLog for audit trail
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
          }),
          ip: "ORCHESTRATOR",
        },
      });

      results.closedCount++;
      results.dealsCreated++;
      console.log(
        `[AuctionAgent] 🏆 Auction closed: "${auction.title}" — Winner: ${winningBid.bidderId} | Price: ${winningBid.amount}`
      );
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
