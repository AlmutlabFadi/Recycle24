import { Prisma, PrismaClient } from "@prisma/client";
import { db } from "../db";
import {
  EntryInput,
  TransactionType,
  Currency,
  HoldStatus,
} from "./types";

type LedgerClient = PrismaClient | Prisma.TransactionClient;

type AccountBalanceTransition = {
  ownerId: string | null;
  previousBalance: number;
  nextBalance: number;
};

type LedgerNotification = {
  userId: string;
  title: string;
  message: string;
  type: "URGENT" | "SUCCESS";
  link: string;
  metadata?: Prisma.InputJsonValue;
};

type JournalEntryWithLines = Prisma.JournalEntryGetPayload<{
  include: { lines: true };
}>;

type PostEntryResult = {
  entry: JournalEntryWithLines;
  notifications: LedgerNotification[];
};

export class LedgerPostingService {
  private static readonly SERIALIZABLE_RETRY_LIMIT = 3;

  private static isSerializableConflict(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    );
  }

  private static async runSerializableTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await db.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        attempt += 1;

        if (
          !this.isSerializableConflict(error) ||
          attempt >= this.SERIALIZABLE_RETRY_LIMIT
        ) {
          throw error;
        }
      }
    }
  }

  private static async findAccountWith(client: LedgerClient, slug: string) {
    return await client.ledgerAccount.findUnique({
      where: { slug },
    });
  }

  private static async createAccountWith(
    client: LedgerClient,
    slug: string,
    ownerId?: string,
    currency: string = Currency.SYP
  ) {
    return await client.ledgerAccount.create({
      data: {
        slug,
        ownerId,
        currency,
        status: "ACTIVE",
      },
    });
  }

  private static async getOrCreateAccountWith(
    client: LedgerClient,
    slug: string,
    ownerId?: string,
    currency: string = Currency.SYP
  ) {
    const existing = await this.findAccountWith(client, slug);

    if (existing) {
      return existing;
    }

    try {
      return await this.createAccountWith(client, slug, ownerId, currency);
    } catch (error) {
      const existingAfterRace = await this.findAccountWith(client, slug);

      if (existingAfterRace) {
        return existingAfterRace;
      }

      throw error;
    }
  }

  private static async buildBalancedEntry(
    client: LedgerClient,
    input: EntryInput
  ): Promise<PostEntryResult> {
    const totalSum = input.lines.reduce((acc, line) => acc + line.amount, 0);

    if (Math.abs(totalSum) > 0.000001) {
      throw new Error(`Balanced entry required. Sum is ${totalSum}`);
    }

    const notifications: LedgerNotification[] = [];

    const resolvedLines = await Promise.all(
      input.lines.map(async (line) => {
        const account = await this.getOrCreateAccountWith(client, line.accountSlug);

        return {
          accountId: account.id,
          accountSlug: account.slug,
          amount: line.amount,
          description: line.description,
        };
      })
    );

    const entryRecord = await client.journalEntry.create({
      data: {
        type: input.type,
        description: input.description,
        metadata: input.metadata || {},
        idempotencyKey: input.idempotencyKey,
        lines: {
          create: resolvedLines.map((line) => ({
            accountId: line.accountId,
            amount: line.amount,
            description: line.description,
          })),
        },
      },
      include: { lines: true },
    });

    const deltaBySlug = new Map<string, number>();

    for (const line of resolvedLines) {
      const current = deltaBySlug.get(line.accountSlug) ?? 0;
      deltaBySlug.set(line.accountSlug, current + line.amount);
    }

    const transitions = new Map<string, AccountBalanceTransition>();

    for (const [slug, delta] of deltaBySlug.entries()) {
      const currentAccount = await client.ledgerAccount.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          ownerId: true,
          balance: true,
          debtStartedAt: true,
        },
      });

      if (!currentAccount) {
        throw new Error(`Ledger account not found after resolution: ${slug}`);
      }

      const previousBalance = currentAccount.balance;
      const nextBalance = previousBalance + delta;

      const shouldStartDebt =
        nextBalance < 0 && currentAccount.debtStartedAt === null;
      const shouldClearDebt =
        nextBalance >= 0 && currentAccount.debtStartedAt !== null;

      await client.ledgerAccount.update({
        where: { id: currentAccount.id },
        data: {
          balance: {
            increment: delta,
          },
          ...(shouldStartDebt
            ? { debtStartedAt: new Date() }
            : shouldClearDebt
            ? { debtStartedAt: null }
            : {}),
        },
      });

      transitions.set(slug, {
        ownerId: currentAccount.ownerId ?? null,
        previousBalance,
        nextBalance,
      });
    }

    for (const [slug, transition] of transitions.entries()) {
      if (!transition.ownerId) {
        continue;
      }

      if (transition.previousBalance >= 0 && transition.nextBalance < 0) {
        notifications.push({
          userId: transition.ownerId,
          title: "Negative wallet balance",
          message: `Your balance on account ${slug} became negative (${transition.nextBalance.toLocaleString()} SYP). Please fund your wallet to avoid account restrictions.`,
          type: "URGENT",
          link: "/wallet",
          metadata: {
            balance: transition.nextBalance,
            accountSlug: slug,
          },
        });
      } else if (
        transition.previousBalance < 0 &&
        transition.nextBalance >= 0
      ) {
        notifications.push({
          userId: transition.ownerId,
          title: "Wallet balance settled",
          message:
            "Your wallet balance is no longer negative. Debt-related restrictions can now be cleared.",
          type: "SUCCESS",
          link: "/wallet",
          metadata: {
            balance: transition.nextBalance,
            accountSlug: slug,
          },
        });
      }
    }

    return {
      entry: entryRecord,
      notifications,
    };
  }

  static async dispatchNotifications(notifications: LedgerNotification[]) {
    if (notifications.length === 0) {
      return;
    }

    const { NotificationService } = await import("../notifications/service");

    for (const notification of notifications) {
      await NotificationService.create(notification);
    }
  }

  static async findAccountBySlug(slug: string) {
    return await this.findAccountWith(db, slug);
  }

  static async getOrCreateAccount(
    slug: string,
    ownerId?: string,
    currency: string = Currency.SYP
  ) {
    return await this.getOrCreateAccountWith(db, slug, ownerId, currency);
  }

  static async postEntry(input: EntryInput) {
    const result = await this.runSerializableTransaction(async (tx) => {
      return await this.buildBalancedEntry(tx, input);
    });

    await this.dispatchNotifications(result.notifications);

    return result.entry;
  }

  static async postEntryInTransaction(
    client: LedgerClient,
    input: EntryInput
  ) {
    return await this.buildBalancedEntry(client, input);
  }

  static async createHold(
    accountSlug: string,
    amount: number,
    referenceType: string,
    referenceId: string,
    expiresAt?: Date
  ) {
    return await this.runSerializableTransaction(async (tx) => {
      const account = await this.getOrCreateAccountWith(tx, accountSlug);

      const activeHolds = await tx.ledgerHold.aggregate({
        where: { accountId: account.id, status: HoldStatus.OPEN },
        _sum: { amount: true },
      });

      const totalHeld = activeHolds._sum.amount || 0;
      const availableBalance = account.balance - totalHeld;

      if (availableBalance < amount) {
        throw new Error(
          `Insufficient funds for hold. Available: ${availableBalance}, Required: ${amount}`
        );
      }

      return await tx.ledgerHold.create({
        data: {
          accountId: account.id,
          amount,
          referenceType,
          referenceId,
          expiresAt,
          status: HoldStatus.OPEN,
        },
      });
    });
  }
static async releaseHold(holdId: string) {
  return await this.runSerializableTransaction(async (tx) => {
    const hold = await tx.ledgerHold.findUnique({
      where: { id: holdId },
    });

    if (!hold) {
      throw new Error("Hold not found.");
    }

    if (hold.status !== HoldStatus.OPEN) {
      throw new Error("Only OPEN holds can be released.");
    }

    return await tx.ledgerHold.update({
      where: { id: holdId },
      data: { status: HoldStatus.RELEASED },
    });
  });
}

  static async captureHold(
    holdId: string,
    destinationSlug: string,
    type: TransactionType,
    description: string
  ) {
    const result = await this.runSerializableTransaction(async (tx) => {
      const hold = await tx.ledgerHold.findUnique({
        where: { id: holdId },
        include: { account: true },
      });

      if (!hold || hold.status !== HoldStatus.OPEN) {
        throw new Error("Valid open hold required for capture.");
      }

      const ledgerResult = await this.postEntryInTransaction(tx, {
        type,
        description,
        lines: [
          {
            accountSlug: hold.account.slug,
            amount: -hold.amount,
            description: `Capture hold ${holdId}`,
          },
          {
            accountSlug: destinationSlug,
            amount: hold.amount,
            description: `Capture hold ${holdId}`,
          },
        ],
        metadata: { holdId },
      });

      await tx.ledgerHold.update({
        where: { id: holdId },
        data: { status: HoldStatus.CAPTURED },
      });

      return ledgerResult;
    });

    await this.dispatchNotifications(result.notifications);

    return result.entry;
  }

  static async getVerifiedBalance(accountSlug: string) {
    const account = await db.ledgerAccount.findUnique({
      where: { slug: accountSlug },
      select: { id: true },
    });

    if (!account) return 0;

    const aggregation = await db.journalLine.aggregate({
      where: { accountId: account.id },
      _sum: { amount: true },
    });

    return aggregation._sum.amount || 0;
  }
}


