"use client";

import React, { useState } from "react";
import { FinanceRestrictionRow } from "../_lib/types";
import { AdminRole, PermissionContext } from "../_lib/permissions";
import { FinanceActionMenu } from "./finance-action-menu";

interface FinanceRestrictedAccountsTableProps {
  accounts: FinanceRestrictionRow[];
  isLoading: boolean;
  currentUserRole: AdminRole;
  onActionSelect: (actionType: string, recordId: string) => void;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

export function FinanceRestrictedAccountsTable({ accounts, isLoading, currentUserRole, onActionSelect }: FinanceRestrictedAccountsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (isLoading) return <div className="p-10 text-center animate-pulse text-slate-400 font-black tracking-widest uppercase shadow-inner bg-slate-50/50 rounded-xl">جاري فحص قيود الحسابات...</div>;
  if (accounts.length === 0) return <div className="p-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 font-black text-slate-400">لا يوجد حسابات مقيدة حالياً.</div>;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm" dir="rtl">
      <table className="w-full text-right text-sm text-slate-700">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-4">الحساب المقيد</th>
            <th className="px-5 py-4">نوع القيد</th>
            <th className="px-5 py-4">الرصيد المجمد</th>
            <th className="px-5 py-4">سبب القيد</th>
            <th className="px-5 py-4">تاريخ البدء</th>
            <th className="px-5 py-4 sticky left-0 bg-slate-50 text-center shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {accounts.map(acc => {
            const permissionCtx: PermissionContext = { role: currentUserRole, selectedRow: acc as any };
            const isMenuOpen = openMenuId === acc.id;

            return (
              <tr key={acc.id} className="hover:bg-rose-50/30 transition-colors group">
                <td className="px-5 py-4">
                  <div className="font-black text-slate-900 leading-tight">{acc.accountName}</div>
                  <div className="text-[10px] font-black text-slate-400 mt-1 font-mono tracking-tighter uppercase">ID: {acc.accountId}</div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[10px] font-black bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 shadow-sm uppercase">{acc.restrictionType}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="font-black text-slate-900 text-base">{formatNumber(acc.frozenAmount)} <span className="text-[10px] uppercase text-slate-400">{acc.currency}</span></div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-xs font-bold text-slate-500 max-w-[200px] leading-relaxed truncate group-hover:whitespace-normal" title={acc.reason}>
                    {acc.reason}
                  </p>
                </td>
                <td className="px-5 py-4 text-[11px] font-black text-slate-500" dir="ltr">
                  {new Date(acc.createdAt).toLocaleString("en-US")}
                </td>
                <td className={`px-5 py-4 text-center sticky left-0 bg-white group-hover:bg-rose-50/30 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-all ${isMenuOpen ? 'z-50' : 'z-20'}`}>
                  <FinanceActionMenu 
                    context={permissionCtx}
                    recordId={acc.id}
                    recordType="RESTRICTION"
                    onSelectAction={onActionSelect}
                    isOpen={isMenuOpen}
                    onToggle={() => setOpenMenuId(isMenuOpen ? null : acc.id)}
                    onClose={() => setOpenMenuId(null)}
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
