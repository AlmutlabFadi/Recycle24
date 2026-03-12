import { Currency } from "@/lib/ledger/types";

export type ApprovalDecision =
  | "SINGLE_STEP_ALLOWED"
  | "REQUIRES_SECOND_APPROVER";

const MAKER_CHECKER_THRESHOLDS = {
  [Currency.SYP]: {
    depositDualApprovalFrom: 50_000_000,
    payoutDualApprovalFrom: 25_000_000,
  },
  [Currency.USD]: {
    depositDualApprovalFrom: Number.POSITIVE_INFINITY,
    payoutDualApprovalFrom: Number.POSITIVE_INFINITY,
  },
};

export function getDepositApprovalDecision(
  currency: Currency,
  amount: number
): ApprovalDecision {
  const threshold = MAKER_CHECKER_THRESHOLDS[currency];

  if (!threshold) {
    return "REQUIRES_SECOND_APPROVER";
  }

  return amount >= threshold.depositDualApprovalFrom
    ? "REQUIRES_SECOND_APPROVER"
    : "SINGLE_STEP_ALLOWED";
}

export function getPayoutApprovalDecision(
  currency: Currency,
  amount: number
): ApprovalDecision {
  const threshold = MAKER_CHECKER_THRESHOLDS[currency];

  if (!threshold) {
    return "REQUIRES_SECOND_APPROVER";
  }

  return amount >= threshold.payoutDualApprovalFrom
    ? "REQUIRES_SECOND_APPROVER"
    : "SINGLE_STEP_ALLOWED";
}

export function isAwaitingFinalApproval(stage: string | null | undefined) {
  return (stage ?? "NONE") === "AWAITING_FINAL_APPROVAL";
}
