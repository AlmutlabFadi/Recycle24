import { describe, expect, it } from "vitest";

import {
  ensureSupportedWalletCurrency,
  normalizeCurrency,
  validateWalletAmount,
} from "@/lib/finance/policy";
import { Currency } from "@/lib/ledger/types";

describe("finance policy", () => {
  it("normalizes supported currencies", () => {
    expect(normalizeCurrency("syp")).toBe(Currency.SYP);
    expect(normalizeCurrency("USD")).toBe(Currency.USD);
    expect(normalizeCurrency("eur")).toBeNull();
  });

  it("accepts valid SYP deposit amount", () => {
    expect(() =>
      validateWalletAmount(Currency.SYP, "deposit", 100_000)
    ).not.toThrow();
  });

  it("rejects deposit below minimum", () => {
    expect(() =>
      validateWalletAmount(Currency.SYP, "deposit", 10_000)
    ).toThrow(/Minimum deposit amount/i);
  });

  it("rejects payout above maximum", () => {
    expect(() =>
      validateWalletAmount(Currency.SYP, "payout", 300_000_000)
    ).toThrow(/Maximum payout amount/i);
  });

  it("rejects unsupported wallet currency", () => {
    expect(() => ensureSupportedWalletCurrency(Currency.USD)).toThrow(
      /Only SYP wallet operations are supported currently/i
    );
  });
});
