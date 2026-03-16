import { Currency } from "@/lib/ledger/types";

export type WalletRequestType = "deposit" | "payout";

type CurrencyPolicy = {
  depositMin: number;
  depositMax: number;
  payoutMin: number;
  payoutMax: number;
};

const POLICY_BY_CURRENCY: Record<Currency, CurrencyPolicy | null> = {
  [Currency.SYP]: {
    depositMin: 50_000,
    depositMax: 500_000_000,
    payoutMin: 50_000,
    payoutMax: 200_000_000,
  },
  [Currency.USD]: {
    depositMin: 10,
    depositMax: 100_000,
    payoutMin: 10,
    payoutMax: 50_000,
  },
};

export function normalizeCurrency(value: unknown): Currency | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (normalized === Currency.SYP) {
    return Currency.SYP;
  }

  if (normalized === Currency.USD) {
    return Currency.USD;
  }

  return null;
}

export function ensureSupportedWalletCurrency(currency: Currency) {
  const policy = POLICY_BY_CURRENCY[currency];

  if (!policy) {
    throw new Error(`Currency ${currency} is not currently supported for wallet operations`);
  }

  return policy;
}

export function validateWalletAmount(
  currency: Currency,
  requestType: WalletRequestType,
  amount: number
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }

  const policy = ensureSupportedWalletCurrency(currency);

  if (requestType === "deposit") {
    if (amount < policy.depositMin) {
      throw new Error(
        `Minimum deposit amount is ${policy.depositMin.toLocaleString()} ${currency}`
      );
    }

    if (amount > policy.depositMax) {
      throw new Error(
        `Maximum deposit amount is ${policy.depositMax.toLocaleString()} ${currency}`
      );
    }

    return;
  }

  if (amount < policy.payoutMin) {
    throw new Error(
      `Minimum payout amount is ${policy.payoutMin.toLocaleString()} ${currency}`
    );
  }

  if (amount > policy.payoutMax) {
    throw new Error(
      `Maximum payout amount is ${policy.payoutMax.toLocaleString()} ${currency}`
    );
  }
}
