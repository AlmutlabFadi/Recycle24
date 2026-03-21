export type FinanceRequestType = "DEPOSIT" | "PAYOUT" | "TRANSFER";
export type FinanceRequestStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED"
  | "REVERSED";

export type FinanceApprovalStage =
  | "NONE"
  | "AWAITING_FIRST_REVIEW"
  | "AWAITING_FINAL_APPROVAL"
  | "FINAL_APPROVED"
  | "REJECTED";

export type FinanceRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FinancePageTab = "REQUESTS" | "HOLDS" | "DEBTS" | "RESTRICTED" | "AUDIT";

export type FinanceCurrencyCode = "SYP" | "USD";
export type FinanceAccountClass =
  | "CUSTOMER"
  | "MERCHANT"
  | "DRIVER"
  | "GOVERNMENT"
  | "INTERNAL";

export type FinanceDebtStatus = "CLEAR" | "OUTSTANDING" | "OVERDUE";
export type FinanceRestrictionStatus = "NONE" | "ACTIVE" | "RELEASED";

export type FinanceRestrictionType =
  | "NONE"
  | "FROZEN_DEBIT"
  | "FROZEN_CREDIT"
  | "FULL_SUSPENSION"
  | "BLACKLISTED"
  | "FROZEN_BALANCE";

export type FinanceHoldType =
  | "AUCTION_DEPOSIT"
  | "PAYOUT_RESERVE"
  | "DISPUTE"
  | "COMPLIANCE";

export type FinanceHoldStatus = "OPEN" | "RELEASED" | "CAPTURED";

export type FinanceDebtType =
  | "COMMISSION"
  | "SUBSCRIPTION"
  | "LOGISTICS"
  | "PENALTY";

export type FinanceAgingBucket =
  | "NOT_DUE"
  | "0-7_DAYS"
  | "8-30_DAYS"
  | "30+_DAYS";

export type FinanceTimelineEventType =
  | "CREATED"
  | "FIRST_REVIEW"
  | "FINAL_APPROVAL"
  | "PROCESSING"
  | "SETTLED"
  | "FAILED"
  | "REVERSED"
  | "HOLD_CREATED"
  | "HOLD_RELEASED"
  | "FREEZE_ACTION"
  | "INTERNAL_NOTE";

export type FinanceLinkedReferenceType =
  | "AUCTION"
  | "TRANSFER"
  | "DEPOSIT"
  | "PAYOUT"
  | "HOLD"
  | "PROVIDER_REFERENCE";

export interface FinanceCurrencyBalance {
  currency: FinanceCurrencyCode;
  available: number;
  held: number;
  frozen: number;
  pendingIn: number;
  pendingOut: number;
}

export interface FinanceWalletExposure {
  accountId: string;
  accountClass: FinanceAccountClass;
  balances: FinanceCurrencyBalance[];
  openDebtCount: number;
  overdueDebtCount: number;
  activeHoldCount: number;
  activeRestrictionCount: number;
}

export type FinanceTimelineEvent = {
  id: string;
  timestamp: string;
  type: FinanceTimelineEventType;
  actor: string;
  note?: string;
};

export type FinanceApprovalStep = {
  role: string;
  actorId: string | null;
  actorName: string | null;
  timestamp: string | null;
  note: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export type FinanceRiskFlag = {
  id: string;
  code: string;
  description: string;
  severity: FinanceRiskLevel;
  appliedAt: string;
};

export type FinanceLinkedReference = {
  id: string;
  type: FinanceLinkedReferenceType;
  label: string;
  url?: string;
};

export interface FinanceRequestRow {
  id: string;
  type: FinanceRequestType;
  accountClass: FinanceAccountClass;
  accountType: string;
  accountId: string;
  accountName: string;
  accountOwner: string;
  amount: number;
  currency: FinanceCurrencyCode;
  availableBalance: number;
  heldBalance: number;
  frozenBalance: number;
  walletExposure: FinanceWalletExposure;
  status: FinanceRequestStatus;
  approvalStage: FinanceApprovalStage;
  currentOwner: string | null;
  riskFlags: FinanceRiskFlag[];
  linkedReference: FinanceLinkedReference | null;
  createdAt: string;
  updatedAt: string;
  slaWaitingTime: string;
  badges: string[];
}

export interface FinanceAccountSnapshot {
  accountId: string;
  accountClass: FinanceAccountClass;
  accountType: string;
  ownerName: string;
  balances: FinanceCurrencyBalance[];
  debtStatus: FinanceDebtStatus;
  restrictionStatus: FinanceRestrictionStatus;
  restrictionTypes: FinanceRestrictionType[];
  riskScore: number;
  riskFlags: FinanceRiskFlag[];
  frozenBalanceTotal: number;
  heldBalanceTotal: number;
  availableBalanceTotal: number;
  pendingInTotal: number;
  pendingOutTotal: number;
  lastActivityAt: string;
}

export interface FinanceHoldRow {
  id: string;
  holdType: FinanceHoldType;
  accountId: string;
  accountName: string;
  accountClass: FinanceAccountClass;
  accountType: string;
  amount: number;
  currency: FinanceCurrencyCode;
  status: FinanceHoldStatus;
  referenceType: string;
  referenceId: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface FinanceDebtRow {
  id: string;
  accountId: string;
  accountName: string;
  accountClass: FinanceAccountClass;
  accountType: string;
  debtType: FinanceDebtType;
  amount: number;
  currency: FinanceCurrencyCode;
  outstanding: number;
  dueDate: string;
  agingBucket: FinanceAgingBucket;
  status: "PENDING" | "OVERDUE" | "PARTIAL" | "PAID";
  waiverApplied: boolean;
  lastActionAt: string | null;
}

export interface FinanceRestrictionRow {
  accountId: string;
  accountName: string;
  accountClass: FinanceAccountClass;
  accountType: string;
  restrictionType: Exclude<FinanceRestrictionType, "NONE">;
  status: "ACTIVE" | "RELEASED";
  reason: string;
  appliedBy: string;
  appliedAt: string;
  frozenBalance: number;
  currency: FinanceCurrencyCode;
  relatedFlags: FinanceRiskFlag[];
}

export interface FinanceAuditRow {
  id: string;
  actor: string;
  action: string;
  reason: string;
  ipAddress: string | null;
  timestamp: string;
  entityType: string;
  entityId: string;
}

export interface FinanceRequestDetail extends FinanceRequestRow {
  snapshot: FinanceAccountSnapshot;
  approvalChain: FinanceApprovalStep[];
  timeline: FinanceTimelineEvent[];
  holds: FinanceHoldRow[];
  debts: FinanceDebtRow[];
  restrictions: FinanceRestrictionRow[];
  auditTrail: FinanceAuditRow[];
}

export interface FinanceSummaryMetric {
  id: string;
  label: string;
  value: number;
  subtext?: string;
  warning?: boolean;
  critical?: boolean;
}

export interface FinanceDashboardSummary {
  pendingFirstReview: number;
  awaitingFinalApproval: number;
  processingRequests: number;
  failedRequestsToday: number;
  frozenAccounts: number;
  totalHeldFunds: number;
  auctionDepositsHeld: number;
  outstandingDebts: number;
  overdueDebts: number;
  highRiskAccounts: number;
}

export interface FinanceQueueFilters {
  requestType: FinanceRequestType | "ALL";
  accountType: string | "ALL";
  accountClass: FinanceAccountClass | "ALL";
  currency: FinanceCurrencyCode | "ALL";
  status: FinanceRequestStatus | "ALL";
  approvalStage: FinanceApprovalStage | "ALL";
  riskLevel: FinanceRiskLevel | "ALL";
  hasHold: boolean;
  hasDebt: boolean;
  frozenOnly: boolean;
  highValueOnly: boolean;
  dateRange: { from: string | null; to: string | null };
  search: string;
}