"use client";

import React from "react";
import { FinanceRequestDetail } from "../_lib/types";
import { FinanceActionMenu } from "./finance-action-menu";
import { PermissionContext } from "../_lib/permissions";

interface FinanceDetailDrawerProps {
  isOpen: boolean;
  detail: FinanceRequestDetail | null;
  isLoading: boolean;
  onClose: () => void;
  permissionContext: PermissionContext;
  onActionSelect: (
    actionType: string,
    recordId: string,
    options?: {
      recordType?: "REQUEST" | "ACCOUNT" | "HOLD" | "DEBT" | "RESTRICTION";
      requestType?: "DEPOSIT" | "PAYOUT" | "TRANSFER" | null;
    },
  ) => void;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

export function FinanceDetailDrawer({
  isOpen,
  detail,
  isLoading,
  onClose,
  permissionContext,
  onActionSelect,
}: FinanceDetailDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 z-50 w-full max-w-3xl overflow-y-auto border-r border-slate-200 bg-slate-50 shadow-2xl" dir="rtl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">سجل التحقيق المالي</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {isLoading || !detail ? (
            <div className="space-y-6">
              <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 p-6 shadow-xl group">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-blue-500/10 transition-transform duration-700 group-hover:scale-150"></div>
                <div className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
                  نافذة التحكم السريع
                </div>
                <FinanceActionMenu
                  inline
                  context={{ ...permissionContext, selectedRow: detail }}
                  recordId={detail.id}
                  recordType="REQUEST"
                  requestType={detail.type}
                  onSelectAction={onActionSelect}
                />
              </div>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 border-b pb-2 text-sm font-black uppercase tracking-wider text-slate-500">
                  ملخص الطلب
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs font-black text-slate-400">رقم الطلب</span>
                    <span className="font-mono font-black tracking-tight text-slate-900">{detail.id}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-400">النوع</span>
                    <span className="font-black text-slate-900">{detail.type}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-400">الحالة / المرحلة</span>
                    <span className="font-black text-blue-600">
                      {detail.status} / {detail.approvalStage}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-400">القيمة</span>
                    <span className="text-lg font-black text-slate-900">
                      {formatNumber(detail.amount)} {detail.currency}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 border-b pb-2 text-sm font-black uppercase tracking-wider text-slate-500">
                  لقطة الحساب ({detail.snapshot.accountId})
                </h3>

                <div className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                  <div>
                    <span className="block text-xs font-black text-slate-400">تصنيف الحساب</span>
                    <span className="font-black text-slate-900">{detail.snapshot.accountClass}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-400">نوع الكيان</span>
                    <span className="font-black text-slate-900">{detail.snapshot.accountType}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-400">صاحب الحساب</span>
                    <span className="font-black text-slate-900">{detail.snapshot.ownerName}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-400">حالة المديونية</span>
                    <span className="font-black text-slate-900">
                      {detail.snapshot.debtStatus}
                      {detail.debts.length > 0 ? ` (${detail.debts.length} مفتوح)` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-400">حالة القيود المانعة</span>
                    <span className="font-black text-rose-600">{detail.snapshot.restrictionStatus}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-400">الحجوزات النشطة</span>
                    <span className="font-black text-amber-600">{detail.holds.length} حجز</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {detail.snapshot.balances.map((bal) => (
                    <div key={bal.currency} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 border-b border-slate-200 pb-1 text-xs font-black uppercase tracking-wider text-slate-500">
                        تعرض العملة: {bal.currency}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
                        <div className="text-center">
                          <span className="block text-[10px] font-black text-slate-400">متاح</span>
                          <span className="font-black text-emerald-600">{formatNumber(bal.available)}</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[10px] font-black text-slate-400">محجوز</span>
                          <span className="font-black text-amber-600">{formatNumber(bal.held)}</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[10px] font-black text-slate-400">مجمد</span>
                          <span className="font-black text-rose-600">{formatNumber(bal.frozen)}</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[10px] font-black text-slate-400">قيد الإيداع</span>
                          <span className="font-black text-blue-600">{formatNumber(bal.pendingIn)}</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[10px] font-black text-slate-400">قيد السحب</span>
                          <span className="font-black text-orange-600">{formatNumber(bal.pendingOut)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {detail.snapshot.riskFlags.length > 0 && (
                  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
                    <span className="mb-3 block text-xs font-black uppercase text-rose-800">
                      أعلام المخاطر النشطة
                    </span>
                    <ul className="space-y-2">
                      {detail.snapshot.riskFlags.map((flag) => (
                        <li key={flag.id} className="flex items-start gap-2 text-xs font-bold text-rose-900">
                          <span className="shrink-0 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] text-white">{flag.code}</span>
                          <div>
                            <span className="font-black">{flag.description}</span>
                            <span className="mr-2 border-r border-rose-200 pr-2 uppercase text-rose-700/70">
                              [{flag.severity}]
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 border-b pb-2 text-sm font-black uppercase tracking-wider text-slate-500">
                  سلسلة الاعتماد (Work-Chain)
                </h3>
                <div className="space-y-6">
                  {detail.approvalChain.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="mt-1 flex-shrink-0">
                        {step.status === "APPROVED" ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : step.status === "REJECTED" ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 bg-slate-100 text-slate-500 shadow-inner">
                            <span className="text-xs font-black">{idx + 1}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 rounded-xl border border-slate-100/50 bg-slate-50/50 p-4">
                        <div className="mb-2 border-b border-slate-100 pb-1 text-sm font-black text-slate-900">
                          {step.role}
                          <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] uppercase ${
                            step.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : step.status === "REJECTED"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-200 text-slate-600"
                          }`}>
                            {step.status}
                          </span>
                        </div>
                        <div className="text-[11px] font-black text-blue-600">
                          {step.actorName || "بانتظار التكليف..."} •{" "}
                          <span dir="ltr" className="text-slate-400">
                            {step.timestamp ? new Date(step.timestamp).toLocaleString("en-US") : "---"}
                          </span>
                        </div>
                        {step.note && (
                          <div className="mt-2 border-r-4 border-r-blue-500 rounded border border-slate-200 bg-white p-3 text-xs font-medium italic text-slate-700">
                            "{step.note}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 border-b pb-2 text-sm font-black uppercase tracking-wider text-slate-500">
                  الخط الزمني للعملية
                </h3>
                <div className="relative mr-5 space-y-8 border-r-2 border-slate-100 pr-6">
                  {detail.timeline.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -right-[33px] top-1 h-3.5 w-3.5 rounded-full border-4 border-white bg-blue-600 shadow-md" />
                      <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400" dir="ltr">
                        {new Date(event.timestamp).toLocaleString("en-US")}
                      </div>
                      <div className="text-sm font-black text-slate-900">{event.type}</div>
                      <div className="mt-0.5 text-[11px] font-black text-blue-600">المسؤول: {event.actor}</div>
                      {event.note && (
                        <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs font-medium italic text-slate-600">
                          {event.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  );
}