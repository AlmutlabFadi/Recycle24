import { db } from "@/lib/db";
import { LedgerAccount } from "@prisma/client";

export class LedgerEnforcementService {
  /**
   * Checks if a user has any account with debt exceeding the 7-day grace period.
   * If found, locks the user account.
   */
  static async verifyDebtStatus(userId: string): Promise<{ isLocked: boolean; reason?: string }> {
    const prisma = await db;
    
    // 1. Fetch all ledger accounts for this user
    const accounts = await prisma.ledgerAccount.findMany({
      where: { ownerId: userId },
    });

    const now = new Date();
    const GRACE_PERIOD_DAYS = 7;

    for (const account of accounts) {
      if (account.balance < 0 && account.debtStartedAt) {
        const debtDurationInMs = now.getTime() - account.debtStartedAt.getTime();
        const debtDurationInDays = debtDurationInMs / (1000 * 60 * 60 * 24);

        if (debtDurationInDays > GRACE_PERIOD_DAYS) {
          // Grace period expired - Lock the user
          await prisma.user.update({
            where: { id: userId },
            data: {
              isLocked: true,
              lockReason: `Unpaid debt on account ${account.slug} for more than 7 days.`,
            },
          });
          return { isLocked: true, reason: "Grace period expired" };
        }
      }
    }

    return { isLocked: false };
  }

  /**
   * Returns debt details for UI display (countdown, amount).
   */
  static async getDebtDetails(userId: string) {
    const prisma = await db;
    const accounts = await prisma.ledgerAccount.findMany({
      where: { ownerId: userId, balance: { lt: 0 } },
    });

    if (accounts.length === 0) return null;

    const now = new Date();
    const GRACE_PERIOD_DAYS = 7;

    return accounts.map(acc => {
      const debtStartedAt = acc.debtStartedAt || now;
      const expiryDate = new Date(debtStartedAt.getTime() + (GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000));
      const remainingMs = expiryDate.getTime() - now.getTime();
      const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

      return {
        slug: acc.slug,
        balance: acc.balance,
        remainingDays,
        expiryDate,
      };
    });
  }
}
