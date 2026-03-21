"use client";

import React from "react";
import { FinanceDebtRow } from "../_lib/types";
import { AdminRole, PermissionContext } from "../_lib/permissions";
import { FinanceActionMenu } from "./finance-action-menu";

interface FinanceDebtsTableProps {
  debts: FinanceDebtRow[];
  isLoading: boolean;
  currentUserRole: AdminRole;
  onActionSelect: (actionType: string, recordId: string) => void;
}

function formatNumber(value: number) {
  return value.toLocaleString("ar-SY");
}

function getStatusClasses(status: FinanceDebtRow["status"]) {
  switch (status) {
    case "OVERDUE":
      return "bg-rose-100 text-rose-800 border border-rose-200";
    case "PARTIAL":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "PAID":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function getAgingClasses(bucket: FinanceDebtRow["agingBucket"]) {
  switch (bucket) {
    case "30+_DAYS":
      return "bg-rose-100 text-rose-700";
    case "8-30_DAYS":
      return "bg-amber-100 text-amber-700";
    case "0-7_DAYS":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

function getAgingLabel(bucket: FinanceDebtRow["agingBucket"]) {
  switch (bucket) {
    case "30+_DAYS":
      return "أكثر من 30 يوم";
    case "8-30_DAYS":
      return "من 8 إلى 30 يوم";
    case "0-7_DAYS":
      return "من 0 إلى 7 أيام";
    default:
      return "غير مستحق بعد";
  }
}

function getDebtTypeLabel(type: FinanceDebtRow["debtType"]) {
  switch (type) {
    case "COMMISSION":
      return "عمولة";
    case "SUBSCRIPTION":
      return "اشتراك";
    case "LOGISTICS":
      return "خدمات لوجستية";
    case "PENALTY":
      return "غرامة";
    default:
      return type;
  }
}

export function FinanceDebtsTable({
  debts,
  isLoading,
  currentUserRole,
  onActionSelect,
}: FinanceDebtsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        جار تحميل سجل الديون والعمولات...
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center shadow-sm">
        <p className="text-sm font-bold text-slate-600">لا توجد ديون مطابقة للعرض الحالي.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-right text-sm text-slate-700">
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-4">مرجع الدين</th>
            <th className="px-5 py-4">الحساب</th>
            <th className="px-5 py-4">نوع الدين</th>
            <th className="px-5 py-4">القيم</th>
            <th className="px-5 py-4">الاستحقاق والتقادم</th>
            <th className="px-5 py-4">الحالة</th>
            <th className="px-5 py-4">الإجراء الأخير</th>
            <th className="px-5 py-4 text-left">إجراءات</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {debts.map((debt) => {
            const permissionCtx: PermissionContext = { role: currentUserRole };

            return (
              <tr key={debt.id} className="transition-colors hover:bg-slate-50">
                <td className="px-5 py-4 align-top">
                  <div className="font-black text-slate-900">{debt.id}</div>
                </td>

                <td className="px-5 py-4 align-top">
                  <div className="font-black text-slate-900">{debt.accountName}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {debt.accountClass} • {debt.accountType}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">{debt.accountId}</div>
                </td>

                <td className="px-5 py-4 align-top">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {getDebtTypeLabel(debt.debtType)}
                  </span>
                </td>

                <td className="px-5 py-4 align-top">
                  <div className="font-black text-slate-900">
                    الإجمالي: {formatNumber(debt.amount)}{" "}
                    <span className="text-[10px] uppercase text-slate-400">{debt.currency}</span>
                  </div>
                  <div className="mt-1 text-sm font-black text-rose-700">
                    المتبقي: {formatNumber(debt.outstanding)}{" "}
                    <span className="text-[10px] uppercase text-rose-400">{debt.currency}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    إعفاء مطبق: {debt.waiverApplied ? "نعم" : "لا"}
                  </div>
                </td>

                <td className="px-5 py-4 align-top">
                  <div className="text-sm font-bold text-slate-700">
                    {new Date(debt.dueDate).toLocaleDateString("ar-SY")}
                  </div>
                  <div className="mt-2">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black ${getAgingClasses(debt.agingBucket)}`}>
                      {getAgingLabel(debt.agingBucket)}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-4 align-top">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black ${getStatusClasses(debt.status)}`}>
                    {debt.status === "PENDING"
                      ? "معلق"
                      : debt.status === "OVERDUE"
                        ? "متأخر"
                        : debt.status === "PARTIAL"
                          ? "مسدد جزئيا"
                          : "مسدد"}
                  </span>
                </td>

                <td className="px-5 py-4 align-top text-xs text-slate-500">
                  {debt.lastActionAt
                    ? new Date(debt.lastActionAt).toLocaleString("ar-SY")
                    : "لا يوجد إجراء مسجل"}
                </td>

                <td className="px-5 py-4 align-top text-left">
                  <FinanceActionMenu
                    context={permissionCtx}
                    recordId={debt.id}
                    recordType="DEBT"
                    onSelectAction={onActionSelect}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default FinanceDebtsTable;
