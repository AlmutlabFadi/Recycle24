/**
 * 💳 BUSINESS AGENT — Wallet Cleanup Agent
 * 
 * Finds transactions that have been stuck in PENDING status for too long
 * and automatically cancels them, freeing up the wallet balance.
 * 
 * Visible Effect: Transaction status changes from PENDING → CANCELLED in the DB.
 * Wallet balance restored if needed.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";

import prisma from "../prisma";

// Cancel transactions pending for more than 24 hours
const STALE_TRANSACTION_HOURS = 24;

export class WalletCleanupAgent extends BaseAgent {
  constructor() {
    super("WalletCleanupAgent", "TASK_MANAGER");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "WALLET_CLEANUP":
        return this.runWalletCleanup();
      default:
        return { message: `WalletCleanupAgent: unhandled task type ${task.type}` };
    }
  }

  private async runWalletCleanup() {
    console.log(`[WalletCleanupAgent] 💳 Running wallet cleanup...`);

    const staleThreshold = new Date(
      Date.now() - STALE_TRANSACTION_HOURS * 60 * 60 * 1000
    );

    const results = {
      cancelledCount: 0,
      totalAmountCancelled: 0,
      timestamp: new Date().toISOString(),
    };

    // Find stale pending transactions
    const staleTransactions = await prisma.transaction.findMany({
      where: {
        status: "PENDING",
        createdAt: { lte: staleThreshold },
      },
      include: {
        wallet: { select: { userId: true } },
      },
    });

    for (const tx of staleTransactions) {
      // Cancel the transaction
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: "CANCELLED",
          description: `${tx.description ?? ""} | AUTO_CANCELLED by Orchestrator after ${STALE_TRANSACTION_HOURS}h pending.`,
        },
      });

      results.cancelledCount++;
      results.totalAmountCancelled += tx.amount;

      console.log(
        `[WalletCleanupAgent] ❌ Cancelled stale tx: ${tx.id} | ${tx.type} | ${tx.amount} ${tx.currency}`
      );
    }

    if (results.cancelledCount > 0) {
      // Log the cleanup action
      await prisma.securityLog.create({
        data: {
          level: "INFO",
          event: "ADMIN_ACTION",
          details: JSON.stringify({
            action: "WALLET_CLEANUP",
            cancelledTransactions: results.cancelledCount,
            totalAmount: results.totalAmountCancelled,
            staleAfterHours: STALE_TRANSACTION_HOURS,
          }),
          ip: "ORCHESTRATOR",
        },
      });
    }

    console.log(
      `[WalletCleanupAgent] ✅ Cleanup done: ${results.cancelledCount} transactions cancelled.`
    );

    return results;
  }
}
