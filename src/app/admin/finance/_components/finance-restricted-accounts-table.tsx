"use client";

import React from "react";
import { FinanceRestrictionRow } from "../_lib/types";
import { AdminRole, PermissionContext } from "../_lib/permissions";
import { FinanceActionMenu } from "./finance-action-menu";

interface FinanceRestrictedAccountsTableProps {
  accounts: FinanceRestrictionRow[];
  isLoading: boolean;
  permissionContext: PermissionContext;
  onActionSelect: (actionType: string, recordId: string) => void;
}

function formatNumber(value: number) {
  return value.toLocaleString("ar-SY");
}

function getRestrictionLabel(type: FinanceRestrictionRow["restrictionType"]) {
  switch (type) {
    case "FROZEN_DEBIT":
      return "تجميد الخصم";
    case "FROZEN_CREDIT":
      return "تجميد الإضافة";
    case "FULL_SUSPENSION":
      return "إيقاف كامل";
    case "BLACKLISTED":
      return "حظر كامل";
    case "FROZEN_BALANCE":
      return "تجميد رصيد";
    default:
      return type;
  }
}

function getRestrictionClasses(type: FinanceRestrictionRow["restrictionType"]) {
  if (type === "BLACKLISTED") {
    return "bg-black text-white";
  }

  if (type === "FULL_SUSPENSION") {
    return "bg-rose-100 text-rose-800";
  }

  if (type === "FROZEN_BALANCE") {
    return "bg-orange-100 text-orange-800";
  }

  return "bg-amber-100 text-amber-800";
}

export function FinanceRestrictedAccountsTable({
  accounts,
  isLoading,
  permissionContext,
  onActionSelect,
}: FinanceRestrictedAccountsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        جار تحميل الحسابات المقيدة والمجمدة...
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center shadow-sm">
        <p className="text-sm font-bold text-slate-600">لا توجد حسابات مقيدة في العرض الحالي.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-right text-sm text-slate-700">
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-4">الحساب</th>
            <th className="px-5 py-4">التصنيف</th>
            <th className="px-5 py-4">نوع القيد</th>
            <th className="px-5 py-4">الرصيد المجمد</th>
            <th className="px-5 py-4">المطبق بواسطة</th>
            <th className="px-5 py-4">وقت التطبيق</th>
            <th className="px-5 py-4">السبب</th>
            <th className="px-5 py-4">مؤشرات الخطر</th>
            <th className="px-5 py-4 text-left">إجراءات</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {accounts.map((acc) => {
            const rowContext: PermissionContext = { ...permissionContext, selectedRow: acc as any };
            const recordId = `${acc.accountId}:${acc.restrictionType}`;

            return (
              <tr key={recordId} className="transition-colors hover:bg-rose-50/30">
                <td className="px-5 py-4 align-top">
                  <div className="font-black text-slate-900">{acc.accountName}</div>
                  <div className="mt-1 text-xs text-slate-500">{acc.accountId}</div>
                </td>

                <td className="px-5 py-4 align-top">
                  <div className="font-black text-slate-900">{acc.accountClass}</div>
                  <div className="mt-1 text-xs text-slate-500">{acc.accountType}</div>
                </td>

                <td className="px-5 py-4 align-top">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black ${getRestrictionClasses(acc.restrictionType)}`}>
                    {getRestrictionLabel(acc.restrictionType)}
                  </span>
                  <div className="mt-2 text-[11px] text-slate-500">
                    الحالة: {acc.status === "ACTIVE" ? "نشط" : "مرفوع"}
                  </div>
                </td>

                <td className="px-5 py-4 align-top">
                  <div className="text-base font-black text-rose-700">
                    {formatNumber(acc.frozenBalance)}{" "}
                    <span className="text-[10px] uppercase text-rose-400">{acc.currency}</span>
                  </div>
                </td>

                <td className="px-5 py-4 align-top">
                  <div className="font-bold text-slate-800">{acc.appliedBy}</div>
                </td>

                <td className="px-5 py-4 align-top text-xs text-slate-500">
                  {new Date(acc.appliedAt).toLocaleString("ar-SY")}
                </td>

                <td className="px-5 py-4 align-top text-xs leading-6 text-slate-600">
                  {acc.reason}
                </td>

                <td className="px-5 py-4 align-top">
                  <div className="flex flex-wrap gap-1">
                    {acc.relatedFlags.length > 0 ? (
                      acc.relatedFlags.map((flag) => (
                        <span
                          key={flag.id}
                          title={flag.description}
                          className="rounded bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800"
                        >
                          {flag.code}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">لا توجد مؤشرات إضافية</span>
                    )}
                  </div>
                </td>

                <td className="px-5 py-4 align-top text-left">
                  <FinanceActionMenu
                    context={rowContext}
                    recordId={recordId}
                    recordType="ACCOUNT"
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

export default FinanceRestrictedAccountsTable;
