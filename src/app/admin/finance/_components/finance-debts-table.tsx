"use client";

import React, { useState } from "react";
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
  return value.toLocaleString("en-US");
}

export function FinanceDebtsTable({ debts, isLoading, currentUserRole, onActionSelect }: FinanceDebtsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (isLoading) return <div className="p-10 text-center animate-pulse text-slate-400 font-black tracking-widest uppercase shadow-inner bg-slate-50/50 rounded-xl">جاري استرجاع تفاصيل المديونيات...</div>;
  if (debts.length === 0) return <div className="p-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 font-black text-slate-400">لا توجد ديون مستحقة حالياً.</div>;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm" dir="rtl">
      <table className="w-full text-right text-sm text-slate-700">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-4">المدين (صاحب الحساب)</th>
            <th className="px-5 py-4">نوع الدين</th>
            <th className="px-5 py-4">المبلغ المستحق</th>
            <th className="px-5 py-4">تاريخ الاستحقاق</th>
            <th className="px-5 py-4">مدة التأخير</th>
            <th className="px-5 py-4">الحالة</th>
            <th className="px-5 py-4 sticky left-0 bg-slate-50 text-center shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {debts.map(debt => {
            const permissionCtx: PermissionContext = { role: currentUserRole, selectedRow: debt as any };
            const isMenuOpen = openMenuId === debt.id;

            return (
              <tr key={debt.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-5 py-4">
                  <div className="font-black text-slate-900 leading-tight">{debt.accountName}</div>
                  <div className="text-[10px] font-black text-slate-400 mt-1 font-mono tracking-tighter uppercase">ID: {debt.accountId}</div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 uppercase">{debt.debtType}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="font-black text-rose-700 text-base">{formatNumber(debt.amount)} <span className="text-[10px] uppercase text-slate-400">{debt.currency}</span></div>
                </td>
                <td className="px-5 py-4 text-[11px] font-black text-slate-500" dir="ltr">
                  {new Date(debt.dueDate).toLocaleDateString("en-US")}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                    debt.overdueDays > 30 ? 'bg-rose-100 text-rose-700' : 
                    debt.overdueDays > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {debt.overdueDays > 0 ? `${debt.overdueDays} يوم تأخير` : 'منتظم'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black shadow-sm ${
                    debt.status === 'ACTIVE' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {debt.status}
                  </span>
                </td>
                <td className={`px-5 py-4 text-center sticky left-0 bg-white group-hover:bg-blue-50/30 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-all ${isMenuOpen ? 'z-50' : 'z-20'}`}>
                  <FinanceActionMenu 
                    context={permissionCtx}
                    recordId={debt.id}
                    recordType="DEBT"
                    onSelectAction={onActionSelect}
                    isOpen={isMenuOpen}
                    onToggle={() => setOpenMenuId(isMenuOpen ? null : debt.id)}
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
