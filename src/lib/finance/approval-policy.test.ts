import { describe, expect, it } from "vitest";

import {
  getDepositApprovalDecision,
  getPayoutApprovalDecision,
  isAwaitingFinalApproval,
} from "@/lib/finance/approval-policy";
import { Currency } from "@/lib/ledger/types";

describe("finance approval policy", () => {
  it("allows single-step approval for smaller SYP deposits", () => {
    expect(getDepositApprovalDecision(Currency.SYP, 10_000_000)).toBe(
      "SINGLE_STEP_ALLOWED"
    );
  });

  it("requires second approver for large SYP deposits", () => {
    expect(getDepositApprovalDecision(Currency.SYP, 50_000_000)).toBe(
      "REQUIRES_SECOND_APPROVER"
    );
  });

  it("allows single-step approval for smaller SYP payouts", () => {
    expect(getPayoutApprovalDecision(Currency.SYP, 10_000_000)).toBe(
      "SINGLE_STEP_ALLOWED"
    );
  });

  it("requires second approver for large SYP payouts", () => {
    expect(getPayoutApprovalDecision(Currency.SYP, 25_000_000)).toBe(
      "REQUIRES_SECOND_APPROVER"
    );
  });

  it("detects awaiting final approval stage", () => {
    expect(isAwaitingFinalApproval("AWAITING_FINAL_APPROVAL")).toBe(true);
    expect(isAwaitingFinalApproval("NONE")).toBe(false);
  });
});
