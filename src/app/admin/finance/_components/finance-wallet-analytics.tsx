"use client";

import React from "react";
import { FinanceAccountClass } from "../_lib/types";

interface FinanceWalletAnalyticsProps {
  onSegmentClick?: (accountClass: FinanceAccountClass) => void;
}

type WalletSegment = {
  label: string;
  accountClass: FinanceAccountClass;
  value: number;
  width: string;
  tone: string;
};

export function FinanceWalletAnalytics({ onSegmentClick }: FinanceWalletAnalyticsProps) {
  const walletBreakdown: WalletSegment[] = [
    { label: "محافظ العملاء", accountClass: "CUSTOMER", value: 1240, width: "42%", tone: "bg-blue-500" },
    { label: "محافظ التجار", accountClass: "MERCHANT", value: 860, width: "29%", tone: "bg-emerald-500" },
    { label: "محافظ السائقين", accountClass: "DRIVER", value: 540, width: "18%", tone: "bg-amber-500" },
    { label: "الحسابات الحكومية", accountClass: "GOVERNMENT", value: 180, width: "6%", tone: "bg-violet-500" },
    { label: "حسابات النظام", accountClass: "INTERNAL", value: 120, width: "5%", tone: "bg-slate-500" }
  ];

  const totalWallets = walletBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">تحليل توزيع المحافظ</h3>
          <p className="text-sm font-bold text-slate-500">
            إجمالي المحافظ المسجلة في النظام نشط حالياً
          </p>
        </div>
        <span className="text-2xl font-black text-blue-600">{totalWallets.toLocaleString("en-US")}</span>
      </div>

      <div className="mt-5 h-4 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
        <div className="flex h-full w-full">
          {walletBreakdown.map((item) => (
            <button
              key={item.accountClass}
              type="button"
              className={`${item.tone} h-full transition-opacity hover:opacity-85`}
              style={{ width: item.width }}
              title={`${item.label}: ${item.value.toLocaleString("en-US")}`}
              onClick={() => onSegmentClick?.(item.accountClass)}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {walletBreakdown.map((item) => (
          <button
            key={item.accountClass}
            type="button"
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-right transition hover:border-slate-300 hover:bg-slate-100"
            onClick={() => onSegmentClick?.(item.accountClass)}
          >
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">{item.label}</div>
            <div className="mt-2 text-xl font-black text-slate-900">{item.value.toLocaleString("en-US")}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
