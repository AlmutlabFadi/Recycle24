"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  FinanceAuditRow,
  FinanceDashboardSummary,
  FinanceDebtRow,
  FinanceHoldRow,
  FinancePageTab,
  FinanceQueueFilters,
  FinanceRequestDetail,
  FinanceRequestRow,
  FinanceRestrictionRow,
  FinanceRequestType,
} from "./_lib/types";
import { financeAdapter } from "./_lib/adapter";
import {
  AdminRole,
  canViewAudit,
  canViewDebts,
  canViewHolds,
  canViewRestrictions,
} from "./_lib/permissions";

import { FinanceOpsHeader } from "./_components/finance-ops-header";
import { FinanceSummaryCards } from "./_components/finance-summary-cards";
import { FinanceAnalyticsPanels } from "./_components/finance-analytics-panels";
import { FinanceFiltersBar } from "./_components/finance-filters-bar";
import { FinanceDetailDrawer } from "./_components/finance-detail-drawer";
import {
  FinanceActionModal,
  FinanceActionModalPayload,
} from "./_components/finance-action-modal";

import { RequestsView } from "./_views/requests-view";
import { HoldsView } from "./_views/holds-view";
import { DebtsView } from "./_views/debts-view";
import { RestrictedAccountsView } from "./_views/restricted-view";
import { AuditView } from "./_views/audit-view";

const CURRENT_ROLE: AdminRole = "FINANCE_MANAGER";
const CURRENT_USER_LABEL = "مدير العمليات المالية";

function getInitialFilters(): FinanceQueueFilters {
  return {
    requestType: "ALL",
    accountType: "ALL",
    accountClass: "ALL",
    currency: "ALL",
    status: "ALL",
    approvalStage: "ALL",
    riskLevel: "ALL",
    hasHold: false,
    hasDebt: false,
    frozenOnly: false,
    highValueOnly: false,
    dateRange: { from: null, to: null },
    search: "",
  };
}

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<FinancePageTab>("REQUESTS");
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const [summary, setSummary] = useState<FinanceDashboardSummary | null>(null);
  const [filters, setFilters] = useState<FinanceQueueFilters>(getInitialFilters());

  const [requests, setRequests] = useState<FinanceRequestRow[]>([]);
  const [holds, setHolds] = useState<FinanceHoldRow[]>([]);
  const [debts, setDebts] = useState<FinanceDebtRow[]>([]);
  const [restrictions, setRestrictions] = useState<FinanceRestrictionRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<FinanceAuditRow[]>([]);

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<FinanceRequestDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [actionModalPayload, setActionModalPayload] =
    useState<FinanceActionModalPayload | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const data = await financeAdapter.getSummaryMetrics();
      setSummary(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  const fetchListData = useCallback(async () => {
    setIsLoadingList(true);

    try {
      if (activeTab === "REQUESTS") {
        const data = await financeAdapter.getRequestsQueue(filters);
        setRequests(data);
      } else if (activeTab === "HOLDS") {
        const data = await financeAdapter.getActiveHolds();
        setHolds(data);
      } else if (activeTab === "DEBTS") {
        const data = await financeAdapter.getOutstandingDebts();
        setDebts(data);
      } else if (activeTab === "RESTRICTED") {
        const data = await financeAdapter.getRestrictedAccounts();
        setRestrictions(data);
      } else if (activeTab === "AUDIT") {
        const data = await financeAdapter.getAuditTrail();
        setAuditLogs(data);
      }

      setLastRefreshedAt(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingList(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    void fetchListData();
  }, [fetchListData]);

  const handleRefreshAll = async () => {
    await fetchSummary();
    await fetchListData();
  };

  const handleRowClick = async (row: FinanceRequestRow) => {
    setSelectedRecordId(row.id);
    setIsDrawerOpen(true);
    setIsLoadingDetail(true);

    try {
      const detail = await financeAdapter.getRequestDetail(row.id, row.type);
      setDetailData(detail);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleOpenActionModal = (
    actionType: string,
    recordId: string,
    row?: FinanceRequestRow,
    options?: {
      recordType?: "REQUEST" | "ACCOUNT" | "HOLD" | "DEBT" | "RESTRICTION";
      requestType?: FinanceRequestType | null;
    },
  ) => {
    setActionModalPayload({
      actionType,
      recordId,
      recordType: options?.recordType ?? (activeTab === "REQUESTS" ? "REQUEST" : "ACCOUNT"),
      requestType: options?.requestType ?? row?.type ?? null,
      row: row ?? null,
    });
  };

  const handleConfirmAction = async ({
    actionType,
    recordId,
    recordType,
    requestType,
    reason,
  }: {
    actionType: string;
    recordId: string;
    recordType?: "REQUEST" | "ACCOUNT" | "HOLD" | "DEBT" | "RESTRICTION";
    requestType?: FinanceRequestType | null;
    reason: string;
  }) => {
    setIsSubmittingAction(true);

    try {
      await financeAdapter.executeCommand({
        actionType,
        targetRecordId: recordId,
        targetRecordType: recordType ?? (activeTab === "REQUESTS" ? "REQUEST" : "ACCOUNT"),
        requestType: requestType ?? null,
        reason,
      });

      setActionModalPayload(null);
      await handleRefreshAll();

      if (isDrawerOpen && selectedRecordId === recordId && requestType) {
        const detail = await financeAdapter.getRequestDetail(recordId, requestType);
        setDetailData(detail);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSummaryCardClick = (key: string) => {
    setActiveTab("REQUESTS");

    if (key === "pendingFirstReview") {
      setFilters((prev) => ({
        ...prev,
        status: "ALL",
        approvalStage: "AWAITING_FIRST_REVIEW",
      }));
      return;
    }

    if (key === "awaitingFinalApproval") {
      setFilters((prev) => ({
        ...prev,
        status: "ALL",
        approvalStage: "AWAITING_FINAL_APPROVAL",
      }));
      return;
    }

    if (key === "processingRequests") {
      setFilters((prev) => ({
        ...prev,
        approvalStage: "ALL",
        status: "PROCESSING",
      }));
      return;
    }

    if (key === "failedRequestsToday") {
      setFilters((prev) => ({
        ...prev,
        approvalStage: "ALL",
        status: "FAILED",
      }));
      return;
    }

    if (key === "frozenAccounts") {
      setActiveTab("RESTRICTED");
      setFilters((prev) => ({
        ...prev,
        frozenOnly: true,
      }));
      return;
    }

    if (key === "totalHeldFunds" || key === "auctionDepositsHeld") {
      setActiveTab("HOLDS");
      setFilters((prev) => ({
        ...prev,
        hasHold: true,
      }));
      return;
    }

    if (key === "outstandingDebts" || key === "overdueDebts") {
      setActiveTab("DEBTS");
      setFilters((prev) => ({
        ...prev,
        hasDebt: true,
      }));
      return;
    }

    if (key === "highRiskAccounts") {
      setFilters((prev) => ({
        ...prev,
        riskLevel: "HIGH",
      }));
    }
  };

  const handleResetFilters = () => {
    setFilters(getInitialFilters());
  };

  const menuButtons = [
    { id: "REQUESTS", label: "طلبات العمليات", show: true },
    {
      id: "HOLDS",
      label: "الأرصدة المحجوزة والتأمينات",
      show: canViewHolds({ role: CURRENT_ROLE }),
    },
    {
      id: "DEBTS",
      label: "الديون والعمولات المستحقة",
      show: canViewDebts({ role: CURRENT_ROLE }),
    },
    {
      id: "RESTRICTED",
      label: "الحسابات المقيدة والمجمدة",
      show: canViewRestrictions({ role: CURRENT_ROLE }),
    },
    {
      id: "AUDIT",
      label: "سجل التدقيق والإجراءات",
      show: canViewAudit({ role: CURRENT_ROLE }),
    },
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-[#f4f7fb] px-4 py-6 text-slate-800 lg:px-6">
      <div className="mx-auto max-w-[1750px] space-y-5">
        <FinanceOpsHeader
          lastRefreshedAt={lastRefreshedAt}
          criticalAlerts={summary ? summary.failedRequestsToday + summary.overdueDebts : 0}
          highRiskAccounts={summary?.highRiskAccounts ?? 0}
          currentUserLabel={CURRENT_USER_LABEL}
          onRefresh={handleRefreshAll}
        />

        <FinanceSummaryCards
          summary={summary}
          isLoading={isLoadingSummary}
          onCardClick={handleSummaryCardClick}
        />

        <FinanceAnalyticsPanels summary={summary} isLoading={isLoadingSummary} />

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">مركز التحكم التشغيلي</h2>
              <p className="mt-1 text-sm leading-7 text-slate-500">
                إدارة طوابير العمل المالي التجميد الحجز الديون والتحقيقات التنفيذية ضمن
                واجهة تشغيل عربية موحدة.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleRefreshAll}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                تحديث شامل للبيانات
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                تصفير جميع الفلاتر
              </button>
            </div>
          </div>

          <div className="mt-5 border-b border-slate-200">
            <nav className="-mb-px flex gap-8 overflow-x-auto pb-1">
              {menuButtons.map((tab) =>
                tab.show ? (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as FinancePageTab)}
                    className={`whitespace-nowrap border-b-4 px-1 py-3 text-sm font-black transition-all ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-400 hover:border-slate-300 hover:text-slate-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ) : null,
              )}
            </nav>
          </div>

          <div className="mt-5">
            {activeTab === "REQUESTS" && (
              <div className="space-y-5">
                <FinanceFiltersBar
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleResetFilters}
                  onRefresh={fetchListData}
                  lastRefreshedAt={lastRefreshedAt}
                />

                <RequestsView
                  requests={requests}
                  isLoading={isLoadingList}
                  currentUserRole={CURRENT_ROLE}
                  onRowClick={handleRowClick}
                  onActionSelect={handleOpenActionModal}
                />
              </div>
            )}

            {activeTab === "HOLDS" && (
              <HoldsView
                holds={holds}
                isLoading={isLoadingList}
                currentUserRole={CURRENT_ROLE}
                onActionSelect={(actionType, recordId) =>
                  handleOpenActionModal(actionType, recordId, undefined, {
                    recordType: "HOLD",
                  })
                }
              />
            )}

            {activeTab === "DEBTS" && (
              <DebtsView
                debts={debts}
                isLoading={isLoadingList}
                currentUserRole={CURRENT_ROLE}
                onActionSelect={(actionType, recordId) =>
                  handleOpenActionModal(actionType, recordId, undefined, {
                    recordType: "DEBT",
                  })
                }
              />
            )}

            {activeTab === "RESTRICTED" && (
              <RestrictedAccountsView
                accounts={restrictions}
                isLoading={isLoadingList}
                currentUserRole={CURRENT_ROLE}
                onActionSelect={(actionType, recordId) =>
                  handleOpenActionModal(actionType, recordId, undefined, {
                    recordType: "ACCOUNT",
                  })
                }
              />
            )}

            {activeTab === "AUDIT" && (
              <AuditView logs={auditLogs} isLoading={isLoadingList} />
            )}
          </div>
        </section>
      </div>

      <FinanceDetailDrawer
  isOpen={isDrawerOpen}
  detail={detailData}
  isLoading={isLoadingDetail}
  onClose={() => setIsDrawerOpen(false)}
  currentUserRole={CURRENT_ROLE}
  onActionSelect={(actionType, recordId, options) =>
    handleOpenActionModal(actionType, recordId, detailData ?? undefined, options)
  }
/>

      <FinanceActionModal
        isOpen={Boolean(actionModalPayload)}
        payload={actionModalPayload}
        onClose={() => setActionModalPayload(null)}
        onConfirm={handleConfirmAction}
        isSubmitting={isSubmittingAction}
      />
    </main>
  );
}