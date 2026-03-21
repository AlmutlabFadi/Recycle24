"use client";

import React, { useMemo, useState } from "react";
import { FinanceDashboardSummary } from "../_lib/types";

interface FinanceAnalyticsPanelsProps {
  summary: FinanceDashboardSummary | null;
  isLoading: boolean;
}

function calcPercent(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

export function FinanceAnalyticsPanels({
  summary,
  isLoading,
}: FinanceAnalyticsPanelsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const model = useMemo(() => {
    if (!summary) return null;

    const queueTotal =
      summary.pendingFirstReview +
      summary.awaitingFinalApproval +
      summary.processingRequests +
      summary.failedRequestsToday;

    const moneyBase =
      summary.totalHeldFunds +
      summary.auctionDepositsHeld +
      summary.outstandingDebts +
      summary.overdueDebts;

    return {
      queueTotal,
      firstReviewPercent: calcPercent(summary.pendingFirstReview, queueTotal),
      finalApprovalPercent: calcPercent(summary.awaitingFinalApproval, queueTotal),
      processingPercent: calcPercent(summary.processingRequests, queueTotal),
      failedPercent: calcPercent(summary.failedRequestsToday, queueTotal),
      heldPercent: calcPercent(summary.totalHeldFunds, moneyBase),
      depositPercent: calcPercent(summary.auctionDepositsHeld, moneyBase),
      debtPercent: calcPercent(summary.outstandingDebts, moneyBase),
      overduePercent: calcPercent(summary.overdueDebts, moneyBase),
    };
  }, [summary]);

  if (isLoading || !summary || !model) {
    return (
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
      </section>
    );
  }

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">التحليلات التشغيلية السريعة</h2>
          <p className="mt-1 text-sm leading-7 text-slate-500">
            قسم مساعد للقراءة السريعة. ليس هو قلب اللوحة وقابل للطي حتى لا يزاحم العمل التنفيذي.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          {isExpanded ? "إخفاء التحليلات" : "إظهار التحليلات"}
        </button>
      </div>

      {isExpanded && (
        <div className="grid gap-4 border-t border-slate-200 p-5 xl:grid-cols-3">
          <PanelCard
            title="اختناق الطابور"
            subtitle="أماكن التكدس الحالية داخل دورة المعالجة"
          >
            <div className="text-3xl font-black text-slate-900">
              {model.queueTotal.toLocaleString("ar-SY")}
            </div>

            <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
              <div className="flex h-full w-full">
                <div className="bg-amber-400" style={{ width: `${model.firstReviewPercent}%` }} />
                <div className="bg-blue-500" style={{ width: `${model.finalApprovalPercent}%` }} />
                <div className="bg-emerald-500" style={{ width: `${model.processingPercent}%` }} />
                <div className="bg-rose-500" style={{ width: `${model.failedPercent}%` }} />
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <MiniMetric label="مراجعة أولى" value={summary.pendingFirstReview} tone="amber" />
              <MiniMetric label="اعتماد نهائي" value={summary.awaitingFinalApproval} tone="blue" />
              <MiniMetric label="قيد التنفيذ" value={summary.processingRequests} tone="emerald" />
              <MiniMetric label="فشل اليوم" value={summary.failedRequestsToday} tone="rose" />
            </div>
          </PanelCard>

          <PanelCard
            title="السيولة والالتزامات"
            subtitle="قراءة مبسطة للتوازن بين الأموال المحجوزة والديون"
          >
            <div className="mt-1 h-4 overflow-hidden rounded-full bg-slate-100">
              <div className="flex h-full w-full">
                <div className="bg-slate-500" style={{ width: `${model.heldPercent}%` }} />
                <div className="bg-indigo-500" style={{ width: `${model.depositPercent}%` }} />
                <div className="bg-orange-500" style={{ width: `${model.debtPercent}%` }} />
                <div className="bg-rose-500" style={{ width: `${model.overduePercent}%` }} />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <RowMetric label="إجمالي الأرصدة المحجوزة" value={summary.totalHeldFunds} />
              <RowMetric label="تأمينات المزادات" value={summary.auctionDepositsHeld} />
              <RowMetric label="الديون المستحقة" value={summary.outstandingDebts} />
              <RowMetric label="الديون المتأخرة" value={summary.overdueDebts} danger />
            </div>
          </PanelCard>

          <PanelCard
            title="المخاطر والقيود"
            subtitle="مؤشرات تستحق انتباه الإدارة أو المراجعة الخاصة"
          >
            <div className="grid gap-3">
              <FlagCard label="حسابات مجمدة" value={summary.frozenAccounts} tone="rose" />
              <FlagCard label="حسابات عالية المخاطر" value={summary.highRiskAccounts} tone="amber" />
              <FlagCard label="طلبات تنتظر اعتمادا نهائيا" value={summary.awaitingFinalApproval} tone="blue" />
            </div>
          </PanelCard>
        </div>
      )}
    </section>
  );
}

function PanelCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-base font-black text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "blue" | "emerald" | "rose";
}) {
  const tones: Record<string, string> = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone]}`}>
      <div className="text-xs font-black">{label}</div>
      <div className="mt-1 text-xl font-black">{value.toLocaleString("ar-SY")}</div>
    </div>
  );
}

function RowMetric({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <span className={`text-lg font-black ${danger ? "text-rose-700" : "text-slate-900"}`}>
        {value.toLocaleString("ar-SY")}
      </span>
    </div>
  );
}

function FlagCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "rose" | "amber" | "blue";
}) {
  const tones: Record<string, string> = {
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className={`rounded-2xl border px-4 py-4 ${tones[tone]}`}>
      <div className="text-sm font-black">{label}</div>
      <div className="mt-2 text-3xl font-black">{value.toLocaleString("ar-SY")}</div>
    </div>
  );
}

export default FinanceAnalyticsPanels;
