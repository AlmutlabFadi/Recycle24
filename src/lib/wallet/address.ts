import crypto from "crypto";

export type WalletCurrency = "SYP" | "USD";

function toTwelveDigits(seed: string): string {
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  const decimalString = BigInt(`0x${hash}`).toString(10).padStart(18, "0");

  return decimalString.slice(-12);
}

function formatWalletDigits(digits: string): string {
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
}

export function buildWalletAddress(params: {
  userId: string;
  currency: WalletCurrency;
}): string {
  const digits = toTwelveDigits(`${params.currency}:${params.userId}`);

  return `R24-${params.currency}-${formatWalletDigits(digits)}`;
}

export function buildWalletAddressPair(userId: string): {
  walletAddressSYP: string;
  walletAddressUSD: string;
} {
  return {
    walletAddressSYP: buildWalletAddress({ userId, currency: "SYP" }),
    walletAddressUSD: buildWalletAddress({ userId, currency: "USD" }),
  };
}