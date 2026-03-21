"use client";

import React from "react";
import { FinanceDashboardSummary } from "../_lib/types";

interface FinanceAnalyticsPanelsProps {
  summary: FinanceDashboardSummary | null;
  isLoading: boolean;
}

function formatNumber(value: number) {
  return value.toLocaleString("ar-SY");
}

function calcPercent(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

export function FinanceAnalyticsPanels({
  summary,
  isLoading,
}: FinanceAnalyticsPanelsProps) {
  if (isLoading || !summary) {
    return (
      <section className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="h-64 animate-pulse rounded-[24px] border border-slate-200 bg-white shadow-sm"
          />
        ))}
      </section>
    );
  }

  const backlogTotal =
    summary.pendingFirstReview +
    summary.awaitingFinalApproval +
    summary.processingRequests +
    summary.failedRequestsToday;

  const firstReviewPercent = calcPercent(summary.pendingFirstReview, backlogTotal);
  const finalApprovalPercent = calcPercent(summary.awaitingFinalApproval, backlogTotal);
  const processingPercent = calcPercent(summary.processingRequests, backlogTotal);
  const failedPercent = calcPercent(summary.failedRequestsToday, backlogTotal);

  const liquidityBase =
    summary.totalHeldFunds +
    summary.auctionDepositsHeld +
    summary.outstandingDebts +
    summary.overdueDebts;

  const heldPercent = calcPercent(summary.totalHeldFunds, liquidityBase);
  const depositPercent = calcPercent(summary.auctionDepositsHeld, liquidityBase);
  const debtPercent = calcPercent(summary.outstandingDebts, liquidityBase);
  const overduePercent = calcPercent(summary.overdueDebts, liquidityBase);

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">اختناق الطابور التشغيلي</h2>
            <p className="mt-1 text-sm text-slate-500">
              يوضح أين يتكدس العمل الآن داخل دورة المراجعة والتنفيذ.
            </p>
          </div>
          <div className="text-3xl font-black text-slate-900">{formatNumber(backlogTotal)}</div>
        </div>

        <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
          <div className="flex h-full w-full">
            <div className="bg-amber-400" style={{ width: `${firstReviewPercent}%` }} />
            <div className="bg-blue-500" style={{ width: `${finalApprovalPercent}%` }} />
            <div className="bg-emerald-500" style={{ width: `${processingPercent}%` }} />
            <div className="bg-rose-500" style={{ width: `${failedPercent}%` }} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <MetricCard label="بانتظار المراجعة الأولى" value={summary.pendingFirstReview} tone="amber" />
          <MetricCard label="بانتظار الاعتماد النهائي" value={summary.awaitingFinalApproval} tone="blue" />
          <MetricCard label="طلبات قيد التنفيذ" value={summary.processingRequests} tone="emerald" />
          <MetricCard label="طلبات فاشلة اليوم" value={summary.failedRequestsToday} tone="rose" />
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900">تحليل السيولة والالتزامات</h2>
          <p className="mt-1 text-sm text-slate-500">
            توزيع مبسط بين المحجوزات والتأمينات والديون الحالية.
          </p>
        </div>

        <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
          <div className="flex h-full w-full">
            <div className="bg-slate-500" style={{ width: `${heldPercent}%` }} />
            <div className="bg-indigo-500" style={{ width: `${depositPercent}%` }} />
            <div className="bg-orange-500" style={{ width: `${debtPercent}%` }} />
            <div className="bg-rose-500" style={{ width: `${overduePercent}%` }} />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <ListMetric label="إجمالي الأرصدة المحجوزة" value={summary.totalHeldFunds} accent="text-slate-700" />
          <ListMetric label="تأمينات المزادات" value={summary.auctionDepositsHeld} accent="text-indigo-700" />
          <ListMetric label="الديون المستحقة" value={summary.outstandingDebts} accent="text-orange-700" />
          <ListMetric label="الديون المتأخرة" value={summary.overdueDebts} accent="text-rose-700" />
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900">وضع المخاطر والقيود</h2>
          <p className="mt-1 text-sm text-slate-500">
            مقياس سريع للحسابات التي تحتاج تدخلا رقابيا أو تجميدا أو تحقيقا.
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <RiskBox
            label="حسابات مجمدة"
            value={summary.frozenAccounts}
            note="كيانات عليها قيود مالية نشطة"
            tone="rose"
          />
          <RiskBox
            label="حسابات عالية المخاطر"
            value={summary.highRiskAccounts}
            note="نتائج مراقبة سلوك أو تعارضات تشغيلية"
            tone="amber"
          />
          <RiskBox
            label="طلبات تحتاج اعتمادا نهائيا"
            value={summary.awaitingFinalApproval}
            note="تتطلب قرارا إداريا نهائيا قبل الصرف"
            tone="blue"
          />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "blue" | "emerald" | "rose";
}) {
  const toneMap: Record<string, string> = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone]}`}>
      <div className="text-xs font-black">{label}</div>
      <div className="mt-2 text-2xl font-black">{value.toLocaleString("ar-SY")}</div>
    </div>
  );
}

function ListMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-sm font-bold text-slate-600">{label}</div>
      <div className={`text-lg font-black ${accent}`}>{value.toLocaleString("ar-SY")}</div>
    </div>
  );
}

function RiskBox({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: number;
  note: string;
  tone: "rose" | "amber" | "blue";
}) {
  const toneMap: Record<string, string> = {
    rose: "from-rose-50 to-white border-rose-200 text-rose-700",
    amber: "from-amber-50 to-white border-amber-200 text-amber-700",
    blue: "from-blue-50 to-white border-blue-200 text-blue-700",
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-l p-4 ${toneMap[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black">{label}</div>
          <div className="mt-1 text-xs leading-6 text-slate-500">{note}</div>
        </div>
        <div className="text-3xl font-black">{value.toLocaleString("ar-SY")}</div>
      </div>
    </div>
  );
}

export default FinanceAnalyticsPanels;
