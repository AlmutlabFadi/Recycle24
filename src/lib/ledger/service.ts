import { db } from "../db";
import { 
  EntryInput, 
  LedgerAccountSlug, 
  TransactionType, 
  Currency, 
  HoldStatus 
} from "./types";

/**
 * LedgerPostingService
 * 
 * Handles all financial movements within the platform using a double-entry ledger system.
 * Ensures atomicity, immutability (via DB triggers), and balance integrity.
 */
export class LedgerPostingService {
  
  /**
   * Get or create a ledger account by slug.
   * Accounts are currency-specific.
   */
  static async getOrCreateAccount(slug: string, ownerId?: string, currency: string = Currency.SYP) {
    let account = await db.ledgerAccount.findUnique({
      where: { slug },
    });

    if (!account) {
      account = await db.ledgerAccount.create({
        data: {
          slug,
          ownerId,
          currency,
          status: 'ACTIVE',
        },
      });
    }

    return account;
  }

  /**
   * Post a new ledger entry with multiple lines (Double-Entry).
   * Verified by DB triggers to ensure sum(amount) == 0.
   */
  static async postEntry(input: EntryInput) {
    // 1. Validate that the lines are balanced in-service first
    const totalSum = input.lines.reduce((acc, line) => acc + line.amount, 0);
    if (Math.abs(totalSum) > 0.000001) { // Floating point safety
      throw new Error(`Balanced entry required. Sum is ${totalSum}`);
    }

    // 2. Perform atomic transaction
    return await db.$transaction(async (tx) => {
      // Create the entry header
      const entry = await tx.journalEntry.create({
        data: {
          type: input.type,
          description: input.description,
          metadata: input.metadata || {},
          idempotencyKey: input.idempotencyKey,
          lines: {
            create: await Promise.all(input.lines.map(async (line) => {
              const account = await this.getOrCreateAccount(line.accountSlug);
              return {
                accountId: account.id,
                amount: line.amount,
                description: line.description,
              };
            })),
          },
        },
        include: { lines: true },
      });

      // Update cached balances for each affected account
      for (const line of input.lines) {
        const updatedAccount = await tx.ledgerAccount.update({
          where: { slug: line.accountSlug },
          data: {
            balance: {
              increment: line.amount,
            },
          },
        });

        // Debt Tracking Logic:
        // If balance is now negative and debtStartedAt is null, set it.
        // If balance is >= 0 and debtStartedAt is not null, clear it.
        if (updatedAccount.balance < 0 && !updatedAccount.debtStartedAt) {
          await tx.ledgerAccount.update({
            where: { id: updatedAccount.id },
            data: { debtStartedAt: new Date() }
          });

          // 🔔 Notification: Debt Warning
          if (updatedAccount.ownerId) {
            const { NotificationService } = await import("../notifications/service");
            await NotificationService.create({
              userId: updatedAccount.ownerId,
              title: "تحذير: رصيدك سالب",
              message: `لقد أصبح رصيدك سالباً (${updatedAccount.balance.toLocaleString()} ل.س). يرجى تغذية حسابك لتجنب تجميد الحساب.`,
              type: "URGENT",
              link: "/wallet",
              metadata: { balance: updatedAccount.balance }
            });
          }
        } else if (updatedAccount.balance >= 0 && updatedAccount.debtStartedAt) {
          await tx.ledgerAccount.update({
            where: { id: updatedAccount.id },
            data: { debtStartedAt: null }
          });

          // 🔔 Notification: Account Restored
          if (updatedAccount.ownerId) {
            const { NotificationService } = await import("../notifications/service");
            await NotificationService.create({
              userId: updatedAccount.ownerId,
              title: "تم تسوية الرصيد",
              message: `شكراً لك، لقد أصبح رصيدك إيجابياً الآن. تم رفع قيود المديونية عن حسابك.`,
              type: "SUCCESS",
              link: "/wallet"
            });
          }
        }
      }

      return entry;
    });
  }

  /**
   * Create a hold (escrow) on funds.
   * This doesn't create a ledger entry yet, just marks funds as unavailable.
   */
  static async createHold(
    accountSlug: string, 
    amount: number, 
    referenceType: string, 
    referenceId: string,
    expiresAt?: Date
  ) {
    const account = await this.getOrCreateAccount(accountSlug);

    // Check if available balance is enough (Cached Balance - Sum of Open Holds)
    const activeHolds = await db.ledgerHold.aggregate({
      where: { accountId: account.id, status: HoldStatus.OPEN },
      _sum: { amount: true },
    });

    const totalHeld = activeHolds._sum.amount || 0;
    const availableBalance = account.balance - totalHeld;

    if (availableBalance < amount) {
      throw new Error(`Insufficient funds for hold. Available: ${availableBalance}, Required: ${amount}`);
    }

    return await db.ledgerHold.create({
      data: {
        accountId: account.id,
        amount,
        referenceType,
        referenceId,
        expiresAt,
        status: HoldStatus.OPEN,
      },
    });
  }

  /**
   * Release a hold (unreserve funds).
   */
  static async releaseHold(holdId: string) {
    return await db.ledgerHold.update({
      where: { id: holdId },
      data: { status: HoldStatus.RELEASED },
    });
  }

  /**
   * Capture a hold (convert reserved funds into a permanent ledger entry).
   * E.g. when an auction winner's deposit is applied to the final payment.
   */
  static async captureHold(holdId: string, destinationSlug: string, type: TransactionType, description: string) {
    const hold = await db.ledgerHold.findUnique({
      where: { id: holdId },
      include: { account: true },
    });

    if (!hold || hold.status !== HoldStatus.OPEN) {
      throw new Error('Valid open hold required for capture.');
    }

    // 1. Post the entry
    const entry = await this.postEntry({
      type,
      description,
      lines: [
        {
          accountSlug: hold.account.slug,
          amount: -hold.amount, // Debit the source
          description: `Capture hold ${holdId}`,
        },
        {
          accountSlug: destinationSlug,
          amount: hold.amount, // Credit the destination
          description: `Capture hold ${holdId}`,
        },
      ],
      metadata: { holdId },
    });

    // 2. Mark hold as captured
    await db.ledgerHold.update({
      where: { id: holdId },
      data: { status: HoldStatus.CAPTURED },
    });

    return entry;
  }

  /**
   * Get total balance from source of truth (sum of lines).
   * Used for reconciliation and verification.
   */
  static async getVerifiedBalance(accountSlug: string) {
    const account = await db.ledgerAccount.findUnique({
      where: { slug: accountSlug },
    });

    if (!account) return 0;

    const aggregation = await db.journalLine.aggregate({
      where: { accountId: account.id },
      _sum: { amount: true },
    });

    return aggregation._sum.amount || 0;
  }
}
