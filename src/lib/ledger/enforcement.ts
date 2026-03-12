import { db } from "@/lib/db";

type DebtDetail = {
  slug: string;
  balance: number;
  remainingDays: number;
  expiryDate: Date;
};

type DebtSnapshot = {
  isLocked: boolean;
  reason?: string;
  details: DebtDetail[];
  expiredDebtAccountSlug?: string;
};

export class LedgerEnforcementService {
  private static readonly GRACE_PERIOD_DAYS = 7;

  /**
   * Pure read snapshot.
   * No writes here.
   */
  static async getDebtSnapshot(userId: string): Promise<DebtSnapshot> {
    const accounts = await db.ledgerAccount.findMany({
      where: { ownerId: userId },
      select: {
        slug: true,
        balance: true,
        debtStartedAt: true,
      },
    });

    const now = new Date();
    const details: DebtDetail[] = [];
    let expiredDebtAccountSlug: string | null = null;

    for (const account of accounts) {
      if (account.balance >= 0) continue;

      const debtStartedAt = account.debtStartedAt ?? now;
      const expiryDate = new Date(
        debtStartedAt.getTime() +
          LedgerEnforcementService.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
      );

      const remainingMs = expiryDate.getTime() - now.getTime();
      const remainingDays = Math.max(
        0,
        Math.ceil(remainingMs / (1000 * 60 * 60 * 24))
      );

      details.push({
        slug: account.slug,
        balance: account.balance,
        remainingDays,
        expiryDate,
      });

      const debtDurationInMs = now.getTime() - debtStartedAt.getTime();
      const debtDurationInDays = debtDurationInMs / (1000 * 60 * 60 * 24);

      if (
        expiredDebtAccountSlug === null &&
        account.debtStartedAt &&
        debtDurationInDays > LedgerEnforcementService.GRACE_PERIOD_DAYS
      ) {
        expiredDebtAccountSlug = account.slug;
      }
    }

    if (expiredDebtAccountSlug) {
      return {
        isLocked: true,
        reason: "Grace period expired",
        details,
        expiredDebtAccountSlug,
      };
    }

    return {
      isLocked: false,
      details,
    };
  }

  /**
   * Optional side-effect sync.
   * Call only when you explicitly want user lock state synced to DB.
   */
  static async syncUserLockState(userId: string): Promise<DebtSnapshot> {
    const snapshot = await this.getDebtSnapshot(userId);

    if (snapshot.isLocked) {
      const lockReason = `Unpaid debt on account ${snapshot.expiredDebtAccountSlug} for more than ${LedgerEnforcementService.GRACE_PERIOD_DAYS} days.`;

      await db.user.update({
        where: { id: userId },
        data: {
          isLocked: true,
          lockReason,
        },
      });

      return snapshot;
    }

    await db.user.update({
      where: { id: userId },
      data: {
        isLocked: false,
        lockReason: null,
      },
    });

    return snapshot;
  }

  static async verifyDebtStatus(
    userId: string
  ): Promise<{ isLocked: boolean; reason?: string }> {
    const snapshot = await this.getDebtSnapshot(userId);

    return {
      isLocked: snapshot.isLocked,
      reason: snapshot.reason,
    };
  }

  static async getDebtDetails(userId: string) {
    const snapshot = await this.getDebtSnapshot(userId);
    return snapshot.details.length > 0 ? snapshot.details : null;
  }
}