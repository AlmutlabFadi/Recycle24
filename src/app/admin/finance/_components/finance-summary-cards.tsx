"use client";

import React from "react";
import { FinanceDashboardSummary } from "../_lib/types";

interface FinanceSummaryCardsProps {
  summary: FinanceDashboardSummary | null;
  isLoading: boolean;
  onCardClick: (key: string) => void;
}

type CardTone = "neutral" | "warning" | "critical";

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function getToneClasses(tone: CardTone) {
  switch (tone) {
    case "warning":
      return "border-amber-200 bg-amber-50/50 text-amber-900 hover:bg-amber-100 hover:border-amber-300 shadow-amber-50/50";
    case "critical":
      return "border-rose-200 bg-rose-50/50 text-rose-900 hover:bg-rose-100 hover:border-rose-300 shadow-rose-50/50";
    default:
      return "border-slate-200 bg-white text-slate-900 hover:bg-blue-50/30 hover:border-blue-200 shadow-slate-50";
  }
}

export function FinanceSummaryCards({
  summary,
  isLoading,
  onCardClick,
}: FinanceSummaryCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm"
          />
        ))}
      </div>
    );
  }

  const cards: Array<{
    key: string;
    label: string;
    value: string;
    subtext: string;
    tone: CardTone;
  }> = [
    {
      key: "pendingFirstReview",
      label: "بانتظار المراجعة الأولى",
      value: formatNumber(summary.pendingFirstReview),
      subtext: "طلبات جديدة معلقة",
      tone: "warning",
    },
    {
      key: "awaitingFinalApproval",
      label: "بانتظار الاعتماد النهائي",
      value: formatNumber(summary.awaitingFinalApproval),
      subtext: "بانتظار صرف المبالغ",
      tone: "warning",
    },
    {
      key: "processingRequests",
      label: "طلبات قيد التنفيذ",
      value: formatNumber(summary.processingRequests),
      subtext: "جاري المعالجة البنكية",
      tone: "neutral",
    },
    {
      key: "failedRequestsToday",
      label: "فشل العمليات (اليوم)",
      value: formatNumber(summary.failedRequestsToday),
      subtext: "تتطلب تدخل فوري",
      tone: "critical",
    },
    {
      key: "frozenAccounts",
      label: "حسابات مجمدة",
      value: formatNumber(summary.frozenAccounts),
      subtext: "قيود أمنية نشطة",
      tone: "critical",
    },
    {
      key: "totalHeldFunds",
      label: "إجمالي المحجوزات",
      value: formatNumber(summary.totalHeldFunds),
      subtext: "سيولة غير متاحة",
      tone: "neutral",
    },
    {
      key: "auctionDepositsHeld",
      label: "تأمينات المزادات",
      value: formatNumber(summary.auctionDepositsHeld),
      subtext: "ضمانات دخول المزاد",
      tone: "neutral",
    },
    {
      key: "outstandingDebts",
      label: "ديون مستحقة",
      value: formatNumber(summary.outstandingDebts),
      subtext: "عمولات لم تُحصل",
      tone: "warning",
    },
    {
      key: "overdueDebts",
      label: "ديون متجاوزة للمدة",
      value: formatNumber(summary.overdueDebts),
      subtext: "تتطلب إجراء قانوني",
      tone: "critical",
    },
    {
      key: "highRiskAccounts",
      label: "حسابات عالية المخاطر",
      value: formatNumber(summary.highRiskAccounts),
      subtext: "تنبيهات نظام الحماية",
      tone: "critical",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => onCardClick(card.key)}
          className={`flex flex-col justify-between rounded-2xl border p-5 text-right shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group ${getToneClasses(
            card.tone,
          )}`}
        >
          {/* Subtle background icon/pattern */}
          <div className="absolute -left-2 -bottom-2 opacity-[0.03] group-hover:scale-110 transition-transform">
             <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-80 group-hover:text-current transition-colors">
            {card.label}
          </div>
          <div className="mt-4 flex items-baseline justify-between transition-transform group-hover:scale-[1.02]">
            <div className="text-3xl font-black tracking-tighter">{card.value}</div>
            <div className="text-[10px] font-bold opacity-60">SYP</div>
          </div>
          <div className="mt-2 text-[10px] font-black opacity-40 group-hover:opacity-100 transition-opacity">
            {card.subtext}
          </div>
        </button>
      ))}
    </div>
  );
}
