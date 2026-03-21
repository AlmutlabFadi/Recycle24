"use client";

import React from "react";

interface FinanceOpsHeaderProps {
  lastRefreshedAt: Date | null;
  criticalAlerts: number;
  highRiskAccounts: number;
  currentUserLabel: string;
  onRefresh?: () => void;
}

function formatDateTime(value: Date | null) {
  if (!value) return "لم يتم التحديث بعد";
  return value.toLocaleString("ar-SY");
}

export function FinanceOpsHeader({
  lastRefreshedAt,
  criticalAlerts,
  highRiskAccounts,
  currentUserLabel,
  onRefresh,
}: FinanceOpsHeaderProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-black text-white">
              مركز التحكم المالي التشغيلي
            </span>

            <span
              className={`rounded-full px-3 py-1 text-[11px] font-black ${
                criticalAlerts > 0
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {criticalAlerts > 0 ? "يوجد ضغط تشغيلي" : "الوضع مستقر"}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
            لوحة قيادة العمليات المالية
          </h1>

          <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-500">
            واجهة تشغيل موحدة لإدارة الطلبات المالية الديون الأرصدة المحجوزة
            الحسابات المقيدة وسجل التدقيق مع تركيز كامل على سرعة القرار
            والتنفيذ لفريق الإدارة.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[620px] xl:grid-cols-4">
          <InfoCard
            label="آخر تحديث"
            value={formatDateTime(lastRefreshedAt)}
            valueClassName="text-sm"
          />
          <InfoCard
            label="تنبيهات حرجة"
            value={criticalAlerts.toLocaleString("ar-SY")}
            valueClassName={criticalAlerts > 0 ? "text-rose-600" : "text-emerald-600"}
          />
          <InfoCard
            label="عالية المخاطر"
            value={highRiskAccounts.toLocaleString("ar-SY")}
            valueClassName="text-amber-600"
          />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-black text-slate-400">المستخدم الحالي</div>
            <div className="mt-1 text-sm font-black text-slate-900">{currentUserLabel}</div>
            <button
              type="button"
              onClick={onRefresh}
              className="mt-3 w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800"
            >
              تحديث فوري
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-black text-slate-400">{label}</div>
      <div className={`mt-1 truncate text-base font-black text-slate-900 ${valueClassName ?? ""}`}>
        {value}
      </div>
    </div>
  );
}

export default FinanceOpsHeader;
