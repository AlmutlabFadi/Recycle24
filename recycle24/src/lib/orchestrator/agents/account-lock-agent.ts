/**
 * 💰 BUSINESS AGENT — Account Lock Agent
 * 
 * Automatically locks user accounts that have too many failed login attempts
 * in the past hour. Protects the platform from brute-force attacks.
 * 
 * Visible Effect: User's `isLocked` field becomes true in the DB.
 * The user will be denied access on next login attempt.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";

import prisma from "../prisma";

// Lock threshold: more than this many failed logins in the last hour
const FAILED_LOGIN_THRESHOLD = 10;
const LOOKBACK_MS = 60 * 60 * 1000; // 1 hour

export class AccountLockAgent extends BaseAgent {
  constructor() {
    super("AccountLockAgent", "SECURITY");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "ACCOUNT_SECURITY_AUDIT":
        return this.runAccountSecurityAudit();
      default:
        return { message: `AccountLockAgent: unhandled task type ${task.type}` };
    }
  }

  private async runAccountSecurityAudit() {
    console.log(`[AccountLockAgent] 🔒 Running account security audit...`);

    const since = new Date(Date.now() - LOOKBACK_MS);
    const results = {
      accountsLocked: 0,
      accountsInspected: 0,
      timestamp: new Date().toISOString(),
    };

    // Find all failed login events in the last hour grouped by userId
    const failedLogins = await prisma.securityLog.findMany({
      where: {
        event: "FAILED_LOGIN",
        createdAt: { gte: since },
        userId: { not: null },
      },
      select: { userId: true },
    });

    // Count failures per user
    const failCountByUser = new Map<string, number>();
    for (const log of failedLogins) {
      if (!log.userId) continue;
      failCountByUser.set(log.userId, (failCountByUser.get(log.userId) ?? 0) + 1);
    }

    results.accountsInspected = failCountByUser.size;

    // Lock accounts that exceed the threshold
    for (const [userId, failCount] of failCountByUser.entries()) {
      if (failCount < FAILED_LOGIN_THRESHOLD) continue;

      // Check if already locked
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isLocked: true, email: true, phone: true },
      });

      if (!user || user.isLocked) continue;

      // Lock the account
      await prisma.user.update({
        where: { id: userId },
        data: {
          isLocked: true,
          lockReason: `AUTO_LOCK: ${failCount} failed login attempts in the past hour. Locked by Orchestrator Security Agent at ${new Date().toISOString()}.`,
        },
      });

      // Create a CRITICAL security log
      await prisma.securityLog.create({
        data: {
          level: "CRITICAL",
          event: "ADMIN_ACTION",
          details: JSON.stringify({
            action: "ACCOUNT_AUTO_LOCKED",
            userId,
            failedAttempts: failCount,
            contact: user.email || user.phone,
            reason: "Exceeded brute-force threshold",
          }),
          userId,
          ip: "ORCHESTRATOR",
        },
      });

      results.accountsLocked++;
      console.log(
        `[AccountLockAgent] 🚨 Account LOCKED: ${user.email || user.phone} (${failCount} failed attempts)`
      );
    }

    console.log(
      `[AccountLockAgent] ✅ Audit complete: ${results.accountsInspected} users checked, ${results.accountsLocked} locked.`
    );

    return results;
  }
}
