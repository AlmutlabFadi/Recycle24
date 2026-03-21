"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FinanceDashboardSummary,
  FinanceQueueFilters,
  FinancePageTab,
  FinanceRequestRow,
  FinanceRequestDetail,
  FinanceHoldRow,
  FinanceDebtRow,
  FinanceRestrictionRow,
  FinanceAuditRow,
} from "./_lib/types";
import { financeAdapter } from "./_lib/adapter";
import {
  AdminRole,
  canViewHolds,
  canViewDebts,
  canViewRestrictions,
  canViewAudit,
} from "./_lib/permissions";

import { FinanceSummaryCards } from "./_components/finance-summary-cards";
import { FinanceFiltersBar } from "./_components/finance-filters-bar";
import { FinanceDetailDrawer } from "./_components/finance-detail-drawer";
import { FinanceWalletAnalytics } from "./_components/finance-wallet-analytics";

import { RequestsView } from "./_views/requests-view";
import { HoldsView } from "./_views/holds-view";
import { DebtsView } from "./_views/debts-view";
import { RestrictedAccountsView } from "./_views/restricted-view";
import { AuditView } from "./_views/audit-view";

const CURRENT_ROLE: AdminRole = "FINANCE_MANAGER";

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<FinancePageTab>("REQUESTS");
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const [summary, setSummary] = useState<FinanceDashboardSummary | null>(null);

  const [filters, setFilters] = useState<FinanceQueueFilters>({
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
  });

  const [requests, setRequests] = useState<FinanceRequestRow[]>([]);
  const [holds, setHolds] = useState<FinanceHoldRow[]>([]);
  const [debts, setDebts] = useState<FinanceDebtRow[]>([]);
  const [restrictions, setRestrictions] = useState<FinanceRestrictionRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<FinanceAuditRow[]>([]);

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<FinanceRequestDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const data = await financeAdapter.getSummaryMetrics();
      setSummary(data);
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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

  const handleRowClick = async (row: FinanceRequestRow) => {
    setSelectedRecordId(row.id);
    setIsDrawerOpen(true);
    setIsLoadingDetail(true);

    try {
      const detail = await financeAdapter.getRequestDetail(row.id);
      setDetailData(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleActionSelect = async (actionType: string, recordId: string) => {
    const confirmed = window.confirm(`هل أنت متأكد من تنفيذ الإجراء المطلوب على السجل: ${recordId}؟`);
    if (!confirmed) return;

    await financeAdapter.executeCommand({
      actionType,
      targetRecordId: recordId,
      targetRecordType: activeTab === "REQUESTS" ? "REQUEST" : "ACCOUNT",
    });

    void fetchListData();
    void fetchSummary();

    if (isDrawerOpen && selectedRecordId === recordId) {
      const detail = await financeAdapter.getRequestDetail(recordId);
      setDetailData(detail);
    }
  };

  const handleSummaryCardClick = (key: string) => {
    setActiveTab("REQUESTS");

    if (key === "pendingFirstReview") {
      setFilters((prev) => ({
        ...prev,
        requestType: "ALL",
        status: "ALL",
        approvalStage: "AWAITING_FIRST_REVIEW",
      }));
      return;
    }

    if (key === "awaitingFinalApproval") {
      setFilters((prev) => ({
        ...prev,
        requestType: "ALL",
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
    setFilters({
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
    });
  };

  const menuButtons = [
    { id: "REQUESTS", label: "طلبات العمليات (إيداع/سحب/تحويل)", show: true },
    { id: "HOLDS", label: "الأرصدة المحجوزة والتأمينات", show: canViewHolds({ role: CURRENT_ROLE }) },
    { id: "DEBTS", label: "الديون والعمولات المستحقة", show: canViewDebts({ role: CURRENT_ROLE }) },
    { id: "RESTRICTED", label: "الحسابات المقيدة والمجمدة", show: canViewRestrictions({ role: CURRENT_ROLE }) },
    { id: "AUDIT", label: "سجل التدقيق والإجراءات", show: canViewAudit({ role: CURRENT_ROLE }) },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] p-6 text-slate-800" dir="rtl">
      <div className="mx-auto max-w-[1700px] space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              وحدة التحكم بالعمليات المالية
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
              النظام المركزي لمراقبة التدفقات النقدية، إدارة الموافقات الثلاثية (Maker-Checker-Finalizer)، تتبع الضمانات المزادية، ومعالجة القيود والحظر المالي.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">المستخدم الحالي</div>
               <div className="text-xs font-black text-blue-600 uppercase italic">Financial Management Console</div>
             </div>
             <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
               <span className="font-black text-sm">ADM</span>
             </div>
          </div>
        </header>

        <FinanceSummaryCards
          summary={summary}
          isLoading={isLoadingSummary}
          onCardClick={handleSummaryCardClick}
        />

        <FinanceWalletAnalytics 
           onSegmentClick={(accountClass) => {
             setActiveTab("REQUESTS");
             setFilters(prev => ({ ...prev, accountClass: accountClass as any }));
           }}
        />

        <div className="border-b border-slate-200 sticky top-0 bg-[#f8fafc] z-30 pt-2">
          <nav className="-mb-px flex gap-8 overflow-x-auto hide-scrollbar pb-1">
            {menuButtons.map(
              (tab) =>
                tab.show && (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as FinancePageTab)}
                    className={`whitespace-nowrap border-b-4 px-1 py-3 text-sm font-black transition-all ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-400 hover:border-slate-300 hover:text-slate-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ),
            )}
          </nav>
        </div>

        <div className="space-y-4">
          {activeTab === "REQUESTS" && (
            <FinanceFiltersBar
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
              onRefresh={fetchListData}
              lastRefreshedAt={lastRefreshedAt}
            />
          )}

          <section className="animate-in fade-in duration-500">
            {activeTab === "REQUESTS" && (
              <RequestsView
                requests={requests}
                isLoading={isLoadingList}
                currentUserRole={CURRENT_ROLE}
                onRowClick={handleRowClick}
                onActionSelect={handleActionSelect}
              />
            )}

            {activeTab === "HOLDS" && (
              <HoldsView
                holds={holds}
                isLoading={isLoadingList}
                currentUserRole={CURRENT_ROLE}
                onActionSelect={handleActionSelect}
              />
            )}

            {activeTab === "DEBTS" && (
              <DebtsView
                debts={debts}
                isLoading={isLoadingList}
                currentUserRole={CURRENT_ROLE}
                onActionSelect={handleActionSelect}
              />
            )}

            {activeTab === "RESTRICTED" && (
              <RestrictedAccountsView
                accounts={restrictions}
                isLoading={isLoadingList}
                currentUserRole={CURRENT_ROLE}
                onActionSelect={handleActionSelect}
              />
            )}

            {activeTab === "AUDIT" && (
              <AuditView logs={auditLogs} isLoading={isLoadingList} />
            )}
          </section>
        </div>
      </div>

      <FinanceDetailDrawer
        isOpen={isDrawerOpen}
        detail={detailData}
        isLoading={isLoadingDetail}
        onClose={() => setIsDrawerOpen(false)}
        currentUserRole={CURRENT_ROLE}
        onActionSelect={handleActionSelect}
      />
    </main>
  );
}
