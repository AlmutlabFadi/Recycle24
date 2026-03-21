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

  if (filters.status && filters.status !== "ALL") {
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
      url: `${basePath}/approve`,
    };
  }

  if (actionType === "REJECT") {
    return {
      method: "POST",
      url: `${basePath}/reject`,
    };
  }

  throw new Error(`Unsupported finance action: ${actionType}`);
}

export class FinanceAdminAdapter {
  async getSummaryMetrics(): Promise<FinanceDashboardSummary> {
    const response = await fetch("/api/admin/finance", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await parseJsonResponse<{
      success: boolean;
      totalEscrowSYP?: number;
      riskAccountsCount?: number;
      overdueAccounts?: Array<unknown>;
      pendingDepositRequests?: Array<unknown>;
      pendingPayoutRequests?: Array<unknown>;
    }>(response);

    return {
      pendingFirstReview: Array.isArray(payload.pendingDepositRequests)
        ? payload.pendingDepositRequests.length
        : 0,
      awaitingFinalApproval: 0,
      processingRequests: 0,
      failedRequestsToday: 0,
      frozenAccounts: Array.isArray(payload.overdueAccounts) ? payload.overdueAccounts.length : 0,
      totalHeldFunds: payload.totalEscrowSYP ?? 0,
      auctionDepositsHeld: 0,
      outstandingDebts: 0,
      overdueDebts: Array.isArray(payload.overdueAccounts) ? payload.overdueAccounts.length : 0,
      highRiskAccounts: payload.riskAccountsCount ?? 0,
    };
  }

  async getRequestsQueue(filters: Partial<FinanceQueueFilters>): Promise<FinanceRequestRow[]> {
    const query = buildRequestQuery(filters);

    const [depositResponse, payoutResponse, transferResponse] = await Promise.all([
      fetch(`/api/admin/finance/deposit-requests${query ? `?${query}` : ""}`, {
        method: "GET",
        cache: "no-store",
      }),
      fetch(`/api/admin/finance/payout-requests${query ? `?${query}` : ""}`, {
        method: "GET",
        cache: "no-store",
      }),
      fetch(`/api/admin/finance/transfer-requests${query ? `?${query}` : ""}`, {
        method: "GET",
        cache: "no-store",
      }),
    ]);

    const depositPayload = await parseJsonResponse<{ items: Array<any> }>(depositResponse);
    const payoutPayload = await parseJsonResponse<{ items: Array<any> }>(payoutResponse);
    const transferPayload = await parseJsonResponse<{ items: Array<any> }>(transferResponse);

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
      approvalStage: item.approvalStage ?? "NONE",
      currentOwner:
        item.approvalStage === "AWAITING_FINAL_APPROVAL"
          ? "FINAL_APPROVER"
          : item.status === "PENDING"
            ? "REVIEWER"
            : null,
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
      approvalStage: item.approvalStage ?? "NONE",
      currentOwner:
        item.approvalStage === "AWAITING_FINAL_APPROVAL"
          ? "FINAL_APPROVER"
          : item.status === "PENDING"
            ? "REVIEWER"
            : null,
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
            pendingOut: item.status === "PENDING" ? item.amount : 0,
          },
        ],
        openDebtCount: 0,
        overdueDebtCount: 0,
        activeHoldCount: 0,
        activeRestrictionCount: 0,
      },
      status: item.status,
      approvalStage: "NONE",
      currentOwner: item.status === "PENDING" ? "REVIEWER" : null,
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
    const response = await fetch("/api/admin/finance/holds?status=OPEN&take=100", {
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
    return [];
  }

  async getRestrictedAccounts(): Promise<FinanceRestrictionRow[]> {
    const response = await fetch("/api/admin/finance/restricted?status=ACTIVE&take=100", {
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
    return [];
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