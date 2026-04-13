import { db } from "@/lib/db";
import { HoldStatus } from "@/lib/ledger/types";

export type WalletCurrency = "SYP" | "USD";

export interface LedgerCurrencySummary {
  currency: WalletCurrency;
  exists: boolean;
  accountId: string | null;
  accountSlug: string | null;
  balance: number;
  heldAmount: number;
  availableBalance: number;
  isDebtLocked: boolean;
  debtStatus: string | null;
}

export interface UserWalletSummary {
  userId: string;
  syp: LedgerCurrencySummary;
  usd: LedgerCurrencySummary;
  isLocked: boolean;
}

const SUPPORTED_CURRENCIES: WalletCurrency[] = ["SYP", "USD"];

function emptyCurrencySummary(currency: WalletCurrency): LedgerCurrencySummary {
  return {
    currency,
    exists: false,
    accountId: null,
    accountSlug: null,
    balance: 0,
    heldAmount: 0,
    availableBalance: 0,
    isDebtLocked: false,
    debtStatus: null,
  };
}

export function normalizeWalletCurrency(
  value: unknown,
  fallback: WalletCurrency = "SYP"
): WalletCurrency {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toUpperCase();

  return normalized === "USD" ? "USD" : normalized === "SYP" ? "SYP" : fallback;
}

export function buildUserLedgerSlug(
  userId: string,
  currency: WalletCurrency
): string {
  return `USER_${userId}_${currency}`;
}

export async function getUserWalletSummaries(
  userIds: string[]
): Promise<Map<string, UserWalletSummary>> {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

  const result = new Map<string, UserWalletSummary>();

  for (const userId of uniqueUserIds) {
    result.set(userId, {
      userId,
      syp: emptyCurrencySummary("SYP"),
      usd: emptyCurrencySummary("USD"),
      isLocked: false,
    });
  }

  if (uniqueUserIds.length === 0) {
    return result;
  }

  const accounts = await db.ledgerAccount.findMany({
    where: {
      ownerId: {
        in: uniqueUserIds,
      },
      currency: {
        in: SUPPORTED_CURRENCIES,
      },
      slug: {
        startsWith: "USER_",
      },
    },
    select: {
      id: true,
      ownerId: true,
      slug: true,
      currency: true,
      balance: true,
      lockedByDebt: true,
      debtStatus: true,
    },
  });

  const accountIds = accounts.map((account) => account.id);

  const holdsByAccountId = new Map<string, number>();

  if (accountIds.length > 0) {
    const holdGroups = await db.ledgerHold.groupBy({
      by: ["accountId"],
      where: {
        accountId: {
          in: accountIds,
        },
        status: HoldStatus.OPEN,
      },
      _sum: {
        amount: true,
      },
    });

    for (const holdGroup of holdGroups) {
      holdsByAccountId.set(holdGroup.accountId, holdGroup._sum.amount ?? 0);
    }
  }

  for (const account of accounts) {
    if (!account.ownerId) {
      continue;
    }

    const existing = result.get(account.ownerId) ?? {
      userId: account.ownerId,
      syp: emptyCurrencySummary("SYP"),
      usd: emptyCurrencySummary("USD"),
      isLocked: false,
    };

    const currency = normalizeWalletCurrency(account.currency);
    const heldAmount = holdsByAccountId.get(account.id) ?? 0;

    const summary: LedgerCurrencySummary = {
      currency,
      exists: true,
      accountId: account.id,
      accountSlug: account.slug,
      balance: account.balance,
      heldAmount,
      availableBalance: account.balance - heldAmount,
      isDebtLocked: account.lockedByDebt,
      debtStatus: account.debtStatus,
    };

    if (currency === "SYP") {
      existing.syp = summary;
    } else {
      existing.usd = summary;
    }

    existing.isLocked = existing.syp.isDebtLocked || existing.usd.isDebtLocked;
    result.set(account.ownerId, existing);
  }

  return result;
}

export async function getUserWalletSummary(
  userId: string
): Promise<UserWalletSummary> {
  const summaries = await getUserWalletSummaries([userId]);

  return (
    summaries.get(userId) ?? {
      userId,
      syp: emptyCurrencySummary("SYP"),
      usd: emptyCurrencySummary("USD"),
      isLocked: false,
    }
  );
}

export async function getUserWalletCurrencySummary(
  userId: string,
  currency: WalletCurrency
): Promise<LedgerCurrencySummary> {
  const summary = await getUserWalletSummary(userId);
  return currency === "USD" ? summary.usd : summary.syp;
}