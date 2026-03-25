import {
  FinanceDashboardSummary,
  FinanceQueueFilters,
  FinanceRequestDetail,
  FinanceRequestRow,
  FinanceHoldRow,
  FinanceDebtRow,
  FinanceRestrictionRow,
  FinanceAuditRow,
  FinanceRequestType,
} from "./types";
import { evaluateApproval } from "./policy-engine";

const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || "";

type ExecuteCommandInput = {
  actionType: string;
  targetRecordId: string;
  targetRecordType: "REQUEST" | "ACCOUNT" | "HOLD" | "DEBT" | "RESTRICTION";
  requestType?: FinanceRequestType | null;
  reason: string;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      (payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : null) ?? `Request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  return payload as T;
}

function buildRequestQuery(filters: Partial<FinanceQueueFilters>) {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.search && filters.search.trim().length > 0) {
    params.set("query", filters.search.trim());
  }

  return params.toString();
}

function resolveRequestActionEndpoint(
  actionType: string,
  requestType?: FinanceRequestType | null,
  requestId?: string,
): { method: "POST"; url: string } {
  if (!requestId) {
    throw new Error("Missing request id for finance action.");
  }

  if (!requestType) {
    throw new Error("Missing request type for finance action.");
  }

  const basePath =
    requestType === "DEPOSIT"
      ? `/api/admin/finance/deposit-requests/${requestId}`
      : requestType === "PAYOUT"
        ? `/api/admin/finance/payout-requests/${requestId}`
        : `/api/admin/finance/transfer-requests/${requestId}`;

  if (actionType === "APPROVE_FIRST_STAGE" || actionType === "APPROVE_FINAL_STAGE") {
    return {
      method: "POST",
      url: `${apiEndpoint}${basePath}/approve`,
    };
  }

  if (actionType === "REJECT") {
    return {
      method: "POST",
      url: `${apiEndpoint}${basePath}/reject`,
    };
  }

  throw new Error(`Unsupported finance action: ${actionType}`);
}

function normalizeApprovalStage(
  approvalStage: string | null | undefined,
): "NONE" | "AWAITING_FIRST_REVIEW" | "AWAITING_FINAL_APPROVAL" | "FINAL_APPROVED" | "REJECTED" {
  if (
    approvalStage === "AWAITING_FIRST_REVIEW" ||
    approvalStage === "AWAITING_FINAL_APPROVAL" ||
    approvalStage === "FINAL_APPROVED" ||
    approvalStage === "REJECTED"
  ) {
    return approvalStage;
  }

  return "NONE";
}

function resolveWorkflowStage(params: {
  type: "DEPOSIT" | "PAYOUT" | "TRANSFER";
  amount: number;
  currency: "SYP" | "USD";
  status: string;
  approvalStage: string | null | undefined;
}): "NONE" | "AWAITING_FIRST_REVIEW" | "AWAITING_FINAL_APPROVAL" | "FINAL_APPROVED" | "REJECTED" {
  if (params.status === "REJECTED" || params.status === "FAILED" || params.status === "REVERSED") {
    return "REJECTED";
  }

  if (params.type === "DEPOSIT") {
    return "NONE";
  }

  const normalizedStage = normalizeApprovalStage(params.approvalStage);

  const policy = evaluateApproval({
    type: params.type === "PAYOUT" ? "WITHDRAWAL" : "TRANSFER",
    amount: params.amount,
    currency: params.currency,
    userId: "system-adapter",
    velocityTriggered: false,
  });

  if (params.status === "COMPLETED") {
    return policy.requiresFinalApproval ? "FINAL_APPROVED" : "NONE";
  }

  if (policy.requiresFinalApproval) {
    if (params.status === "UNDER_REVIEW" || normalizedStage === "AWAITING_FINAL_APPROVAL") {
      return "AWAITING_FINAL_APPROVAL";
    }

    return "AWAITING_FIRST_REVIEW";
  }

  if (policy.requiresFirstApproval && params.status === "PENDING") {
    return "AWAITING_FIRST_REVIEW";
  }

  return normalizedStage;
}

function resolveCurrentOwner(params: {
  type: "DEPOSIT" | "PAYOUT" | "TRANSFER";
  amount: number;
  currency: "SYP" | "USD";
  status: string;
  approvalStage: string | null | undefined;
}): string | null {
  if (params.type === "DEPOSIT") {
    return null;
  }

  const workflowStage = resolveWorkflowStage(params);

  if (workflowStage === "AWAITING_FINAL_APPROVAL") {
    return "FINAL_APPROVER";
  }

  if (workflowStage === "AWAITING_FIRST_REVIEW") {
    return "REVIEWER";
  }

  return null;
}

export class FinanceAdminAdapter {
  async getSummaryMetrics(): Promise<FinanceDashboardSummary> {
    const response = await fetch(`${apiEndpoint}/api/admin/finance`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await parseJsonResponse<{
      success: boolean;
      summary?: FinanceDashboardSummary;
    }>(response);

    if (!payload.summary) {
      throw new Error("Finance summary payload is missing.");
    }

    return payload.summary;
  }

  async getRequestsQueue(filters: Partial<FinanceQueueFilters>): Promise<FinanceRequestRow[]> {
    const query = buildRequestQuery(filters);

    const depositUrl = `${apiEndpoint}/api/admin/finance/deposit-requests${query ? `?${query}` : ""}`;
    const payoutUrl = `${apiEndpoint}/api/admin/finance/payout-requests${query ? `?${query}` : ""}`;
    const transferUrl = `${apiEndpoint}/api/admin/finance/transfer-requests${query ? `?${query}` : ""}`;

    const fetchResults = await Promise.allSettled([
      fetch(depositUrl, { method: "GET", cache: "no-store" }).then((res) =>
        parseJsonResponse<{ items: Array<any> }>(res),
      ),
      fetch(payoutUrl, { method: "GET", cache: "no-store" }).then((res) =>
        parseJsonResponse<{ items: Array<any> }>(res),
      ),
      fetch(transferUrl, { method: "GET", cache: "no-store" }).then((res) =>
        parseJsonResponse<{ items: Array<any> }>(res),
      ),
    ]);

    const depositPayload = fetchResults[0].status === "fulfilled" ? fetchResults[0].value : { items: [] };
    const payoutPayload = fetchResults[1].status === "fulfilled" ? fetchResults[1].value : { items: [] };
    const transferPayload = fetchResults[2].status === "fulfilled" ? fetchResults[2].value : { items: [] };

    const mappedDeposits: FinanceRequestRow[] = (depositPayload.items ?? []).map((item) => ({
      id: item.id,
      type: "DEPOSIT",
      accountClass: "CUSTOMER",
      accountType: item.account?.slug ?? "LEDGER_ACCOUNT",
      accountId: item.accountId,
      accountName: item.user?.name ?? item.user?.email ?? item.user?.phone ?? item.accountId,
      accountOwner: item.user?.name ?? "Unknown",
      amount: item.amount,
      currency: item.currency,
      availableBalance: item.account?.balance ?? 0,
      heldBalance: 0,
      frozenBalance: 0,
      walletExposure: {
        accountId: item.accountId,
        accountClass: "CUSTOMER",
        balances: [
          {
            currency: item.currency,
            available: item.account?.balance ?? 0,
            held: 0,
            frozen: 0,
            pendingIn: item.status === "PENDING" || item.status === "UNDER_REVIEW" ? item.amount : 0,
            pendingOut: 0,
          },
        ],
        openDebtCount: item.account?.debtStatus && item.account.debtStatus !== "CLEAR" ? 1 : 0,
        overdueDebtCount: item.account?.debtStatus === "OVERDUE" ? 1 : 0,
        activeHoldCount: 0,
        activeRestrictionCount: item.account?.lockedByDebt ? 1 : 0,
      },
      status: item.status,
      approvalStage: "NONE",
      currentOwner: null,
      riskFlags: [],
      linkedReference: null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      slaWaitingTime: "LIVE",
      badges: [],
    }));

    const mappedPayouts: FinanceRequestRow[] = (payoutPayload.items ?? []).map((item) => ({
      id: item.id,
      type: "PAYOUT",
      accountClass: "CUSTOMER",
      accountType: item.account?.slug ?? "LEDGER_ACCOUNT",
      accountId: item.accountId,
      accountName: item.user?.name ?? item.user?.email ?? item.user?.phone ?? item.accountId,
      accountOwner: item.user?.name ?? "Unknown",
      amount: item.amount,
      currency: item.currency,
      availableBalance: item.account?.balance ?? 0,
      heldBalance: 0,
      frozenBalance: item.account?.lockedByDebt ? item.amount : 0,
      walletExposure: {
        accountId: item.accountId,
        accountClass: "CUSTOMER",
        balances: [
          {
            currency: item.currency,
            available: item.account?.balance ?? 0,
            held: 0,
            frozen: item.account?.lockedByDebt ? item.amount : 0,
            pendingIn: 0,
            pendingOut: item.status === "PENDING" || item.status === "UNDER_REVIEW" ? item.amount : 0,
          },
        ],
        openDebtCount: item.account?.debtStatus && item.account.debtStatus !== "CLEAR" ? 1 : 0,
        overdueDebtCount: item.account?.debtStatus === "OVERDUE" ? 1 : 0,
        activeHoldCount: 0,
        activeRestrictionCount: item.account?.lockedByDebt ? 1 : 0,
      },
      status: item.status,
      approvalStage: resolveWorkflowStage({
        type: "PAYOUT",
        amount: item.amount,
        currency: item.currency,
        status: item.status,
        approvalStage: item.approvalStage,
      }),
      currentOwner: resolveCurrentOwner({
        type: "PAYOUT",
        amount: item.amount,
        currency: item.currency,
        status: item.status,
        approvalStage: item.approvalStage,
      }),
      riskFlags: item.account?.lockedByDebt
        ? [
            {
              id: `${item.id}-debt-lock`,
              code: "DEBT_LOCK",
              description: "Account is locked by debt rules",
              severity: "HIGH",
              appliedAt: item.updatedAt,
            },
          ]
        : [],
      linkedReference: null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      slaWaitingTime: "LIVE",
      badges: item.account?.lockedByDebt ? ["Debt Locked"] : [],
    }));

    const mappedTransfers: FinanceRequestRow[] = (transferPayload.items ?? []).map((item) => ({
      id: item.id,
      type: "TRANSFER",
      accountClass: "CUSTOMER",
      accountType: "P2P_TRANSFER",
      accountId: item.sender?.id ?? item.id,
      accountName: item.sender?.name ?? item.sender?.email ?? item.sender?.phone ?? item.id,
      accountOwner: item.sender?.name ?? "Unknown",
      amount: item.amount,
      currency: item.currency,
      availableBalance: 0,
      heldBalance: 0,
      frozenBalance: 0,
      walletExposure: {
        accountId: item.sender?.id ?? item.id,
        accountClass: "CUSTOMER",
        balances: [
          {
            currency: item.currency,
            available: 0,
            held: 0,
            frozen: 0,
            pendingIn: 0,
            pendingOut: item.status === "PENDING" || item.status === "UNDER_REVIEW" ? item.amount : 0,
          },
        ],
        openDebtCount: 0,
        overdueDebtCount: 0,
        activeHoldCount: 0,
        activeRestrictionCount: 0,
      },
      status: item.status,
      approvalStage: resolveWorkflowStage({
        type: "TRANSFER",
        amount: item.amount,
        currency: item.currency,
        status: item.status,
        approvalStage: item.approvalStage ?? "NONE",
      }),
      currentOwner: resolveCurrentOwner({
        type: "TRANSFER",
        amount: item.amount,
        currency: item.currency,
        status: item.status,
        approvalStage: item.approvalStage ?? "NONE",
      }),
      riskFlags: [],
      linkedReference: item.receiver
        ? {
            id: item.receiver.id,
            type: "TRANSFER",
            label: item.receiver.name ?? item.receiver.phone ?? item.receiver.email ?? item.receiver.id,
          }
        : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      slaWaitingTime: "LIVE",
      badges: [],
    }));

    let results = [...mappedDeposits, ...mappedPayouts, ...mappedTransfers];

    if (filters.requestType && filters.requestType !== "ALL") {
      results = results.filter((row) => row.type === filters.requestType);
    }

    if (filters.approvalStage && filters.approvalStage !== "ALL") {
      results = results.filter((row) => row.approvalStage === filters.approvalStage);
    }

    if (filters.status && filters.status !== "ALL") {
      results = results.filter((row) => row.status === filters.status);
    }

    if (filters.highValueOnly) {
      results = results.filter((row) => row.amount >= 1_000_000);
    }

    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getRequestDetail(id: string, requestType: FinanceRequestType): Promise<FinanceRequestDetail | null> {
    const rows = await this.getRequestsQueue({
      requestType,
      status: "ALL",
      approvalStage: "ALL",
    });

    const row = rows.find((item) => item.id === id);
    if (!row) {
      return null;
    }

    return {
      ...row,
      snapshot: {
        accountId: row.accountId,
        accountClass: row.accountClass,
        accountType: row.accountType,
        ownerName: row.accountOwner,
        balances: row.walletExposure.balances,
        debtStatus:
          row.walletExposure.overdueDebtCount > 0
            ? "OVERDUE"
            : row.walletExposure.openDebtCount > 0
              ? "OUTSTANDING"
              : "CLEAR",
        restrictionStatus: row.frozenBalance > 0 ? "ACTIVE" : "NONE",
        restrictionTypes: row.frozenBalance > 0 ? ["FROZEN_DEBIT"] : [],
        riskScore: row.riskFlags.length > 0 ? 80 : 10,
        riskFlags: row.riskFlags,
        frozenBalanceTotal: row.frozenBalance,
        heldBalanceTotal: row.heldBalance,
        availableBalanceTotal: row.availableBalance,
        pendingInTotal: row.walletExposure.balances.reduce((sum, bal) => sum + bal.pendingIn, 0),
        pendingOutTotal: row.walletExposure.balances.reduce((sum, bal) => sum + bal.pendingOut, 0),
        lastActivityAt: row.updatedAt,
      },
      approvalChain: [
        {
          role: "REVIEWER",
          actorId: null,
          actorName: null,
          timestamp: null,
          note: null,
          status:
            row.approvalStage === "AWAITING_FIRST_REVIEW"
              ? "PENDING"
              : row.status === "REJECTED"
                ? "REJECTED"
                : "APPROVED",
        },
        {
          role: "FINAL_APPROVER",
          actorId: null,
          actorName: null,
          timestamp: null,
          note: null,
          status:
            row.approvalStage === "AWAITING_FINAL_APPROVAL"
              ? "PENDING"
              : row.approvalStage === "FINAL_APPROVED"
                ? "APPROVED"
                : row.status === "REJECTED"
                  ? "REJECTED"
                  : "PENDING",
        },
      ],
      timeline: [
        {
          id: `${row.id}-created`,
          timestamp: row.createdAt,
          type: "CREATED",
          actor: "SYSTEM",
        },
        {
          id: `${row.id}-updated`,
          timestamp: row.updatedAt,
          type:
            row.status === "REJECTED"
              ? "FAILED"
              : row.status === "COMPLETED"
                ? "SETTLED"
                : "PROCESSING",
          actor: "FINANCE",
          note: `Latest status: ${row.status}`,
        },
      ],
      holds: [],
      debts: [],
      restrictions: [],
      auditTrail: [],
    };
  }

  async getActiveHolds(): Promise<FinanceHoldRow[]> {
    const response = await fetch(`${apiEndpoint}/api/admin/finance/holds?status=OPEN&take=100`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await parseJsonResponse<{
      success?: boolean;
      items?: FinanceHoldRow[];
      error?: string;
    }>(response);

    if (!payload.success || !Array.isArray(payload.items)) {
      throw new Error(payload.error ?? "Finance holds response was invalid");
    }

    return payload.items;
  }

  async getOutstandingDebts(): Promise<FinanceDebtRow[]> {
    const response = await fetch(`${apiEndpoint}/api/admin/finance/debts?take=100`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await parseJsonResponse<{
      success?: boolean;
      items?: FinanceDebtRow[];
      error?: string;
    }>(response);

    if (!payload.success || !Array.isArray(payload.items)) {
      throw new Error(payload.error ?? "Finance debts response was invalid");
    }

    return payload.items;
  }

  async getRestrictedAccounts(): Promise<FinanceRestrictionRow[]> {
    const response = await fetch(`${apiEndpoint}/api/admin/finance/restricted?status=ACTIVE&take=100`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await parseJsonResponse<{
      success?: boolean;
      items?: FinanceRestrictionRow[];
      error?: string;
    }>(response);

    if (!payload.success || !Array.isArray(payload.items)) {
      throw new Error(payload.error ?? "Finance restricted response was invalid");
    }

    return payload.items;
  }

  async getAuditTrail(): Promise<FinanceAuditRow[]> {
    const response = await fetch(`${apiEndpoint}/api/admin/finance/audit?take=100`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await parseJsonResponse<{
      success?: boolean;
      items?: FinanceAuditRow[];
      error?: string;
    }>(response);

    if (!payload.success || !Array.isArray(payload.items)) {
      throw new Error(payload.error ?? "Finance audit response was invalid");
    }

    return payload.items;
  }

  async executeCommand(
    command: ExecuteCommandInput,
  ): Promise<{ success: boolean; message?: string }> {
    if (command.targetRecordType !== "REQUEST") {
      throw new Error("This action is not connected to a real backend endpoint yet.");
    }

    const endpoint = resolveRequestActionEndpoint(
      command.actionType,
      command.requestType,
      command.targetRecordId,
    );

    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reviewNote: command.reason,
      }),
    });

    const payload = await parseJsonResponse<{ success?: boolean; message?: string }>(response);

    return {
      success: payload?.success ?? true,
      message: payload?.message,
    };
  }
}

export const financeAdapter = new FinanceAdminAdapter();

