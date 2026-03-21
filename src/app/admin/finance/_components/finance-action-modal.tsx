"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FinanceRequestRow, FinanceRequestType } from "../_lib/types";

export interface FinanceActionModalPayload {
  actionType: string;
  recordId: string;
  recordType?: "REQUEST" | "ACCOUNT" | "HOLD" | "DEBT" | "RESTRICTION";
  requestType?: FinanceRequestType | null;
  row?: FinanceRequestRow | null;
}

interface FinanceActionModalProps {
  isOpen: boolean;
  payload: FinanceActionModalPayload | null;
  onClose: () => void;
  onConfirm: (input: {
    actionType: string;
    recordId: string;
    recordType?: "REQUEST" | "ACCOUNT" | "HOLD" | "DEBT" | "RESTRICTION";
    requestType?: FinanceRequestType | null;
    reason: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  APPROVE_FIRST_STAGE: "اعتماد المرحلة الأولى",
  APPROVE_FINAL_STAGE: "الاعتماد النهائي",
  REJECT: "رفض الطلب",
  MARK_FAILED: "وسم العملية كفاشلة",
  FREEZE_DEBIT: "تجميد الخصم",
  FREEZE_CREDIT: "تجميد الإيداع",
  FULL_FREEZE: "تجميد كامل",
  UNFREEZE: "فك التجميد",
  RELEASE_HOLD: "تحرير الرصيد المحجوز",
  CAPTURE_HOLD: "مصادرة الرصيد المحجوز",
  ESCALATE_COMPLIANCE: "تصعيد للامتثال",
  ADD_INTERNAL_NOTE: "إضافة ملاحظة إدارية",
};

const ACTION_TONES: Record<string, string> = {
  APPROVE_FIRST_STAGE: "border-blue-200 bg-blue-50 text-blue-700",
  APPROVE_FINAL_STAGE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECT: "border-rose-200 bg-rose-50 text-rose-700",
  MARK_FAILED: "border-rose-200 bg-rose-50 text-rose-700",
  FREEZE_DEBIT: "border-amber-200 bg-amber-50 text-amber-700",
  FREEZE_CREDIT: "border-amber-200 bg-amber-50 text-amber-700",
  FULL_FREEZE: "border-amber-200 bg-amber-50 text-amber-700",
  UNFREEZE: "border-slate-200 bg-slate-50 text-slate-700",
  RELEASE_HOLD: "border-slate-200 bg-slate-50 text-slate-700",
  CAPTURE_HOLD: "border-rose-200 bg-rose-50 text-rose-700",
  ESCALATE_COMPLIANCE: "border-violet-200 bg-violet-50 text-violet-700",
  ADD_INTERNAL_NOTE: "border-slate-200 bg-slate-50 text-slate-700",
};

export function FinanceActionModal({
  isOpen,
  payload,
  onClose,
  onConfirm,
  isSubmitting = false,
}: FinanceActionModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
    }
  }, [isOpen, payload]);

  const actionLabel = useMemo(() => {
    if (!payload) return "";
    return ACTION_LABELS[payload.actionType] ?? payload.actionType;
  }, [payload]);

  const toneClass = useMemo(() => {
    if (!payload) return "border-slate-200 bg-slate-50 text-slate-700";
    return ACTION_TONES[payload.actionType] ?? "border-slate-200 bg-slate-50 text-slate-700";
  }, [payload]);

  if (!isOpen || !payload) return null;

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      window.alert("يجب إدخال سبب أو ملاحظة تنفيذية قبل المتابعة.");
      return;
    }

    await onConfirm({
      actionType: payload.actionType,
      recordId: payload.recordId,
      recordType: payload.recordType,
      requestType: payload.requestType ?? payload.row?.type ?? null,
      reason: trimmedReason,
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${toneClass}`}>
                نافذة تنفيذ إجرائية
              </div>
              <h2 className="mt-3 text-2xl font-black text-slate-900">{actionLabel}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                راجع تفاصيل السجل قبل اتخاذ القرار. أي إجراء هنا يجب أن يكون موثقا بسبب واضح وقابل للمراجعة.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="grid gap-5 px-6 py-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-black text-slate-900">سبب التنفيذ</h3>
              <p className="mt-1 text-sm leading-7 text-slate-500">
                اكتب مبرر القرار أو الملاحظة التي ستدخل إلى سجل التدقيق.
              </p>

              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="اكتب السبب الإجرائي بالتفصيل..."
                className="mt-4 min-h-[180px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </section>

            <section className="space-y-4">
              <div className="rounded-[22px] border border-slate-200 bg-white p-5">
                <h3 className="text-base font-black text-slate-900">ملخص السجل المستهدف</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <SummaryRow label="رقم السجل" value={payload.recordId} />
                  <SummaryRow label="نوع الإجراء" value={actionLabel} />
                  <SummaryRow label="نوع السجل" value={payload.recordType ?? "-"} />
                  <SummaryRow label="نوع الطلب" value={payload.requestType ?? payload.row?.type ?? "-"} />
                  <SummaryRow label="صاحب الحساب" value={payload.row?.accountName ?? "-"} />
                  <SummaryRow label="تصنيف الكيان" value={payload.row?.accountType ?? "-"} />
                  <SummaryRow
                    label="القيمة"
                    value={
                      payload.row
                        ? `${payload.row.amount.toLocaleString("ar-SY")} ${payload.row.currency}`
                        : "-"
                    }
                  />
                  <SummaryRow label="الحالة الحالية" value={payload.row?.status ?? "-"} />
                  <SummaryRow label="مرحلة الاعتماد" value={payload.row?.approvalStage ?? "-"} />
                </div>
              </div>

              <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                <div className="font-black">تحذير تشغيلي</div>
                <p className="mt-2 leading-7">
                  هذه النافذة تمثل قرارا إداريا قابلا للتدقيق. لا تنفذ الإجراء دون سبب واضح ومحدد.
                </p>
              </div>
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "جار التنفيذ..." : "تأكيد التنفيذ"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="text-right font-black text-slate-900">{value}</span>
    </div>
  );
}

export default FinanceActionModal;