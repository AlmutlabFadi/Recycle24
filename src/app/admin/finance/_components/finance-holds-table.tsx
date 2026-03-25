"use client";

import React, { useState } from "react";
import { FinanceHoldRow } from "../_lib/types";
import { AdminRole, PermissionContext } from "../_lib/permissions";
import { FinanceActionMenu } from "./finance-action-menu";

interface FinanceHoldsTableProps {
  holds: FinanceHoldRow[];
  isLoading: boolean;
  permissionContext: PermissionContext;
  onActionSelect: (actionType: string, recordId: string) => void;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

export function FinanceHoldsTable({ holds, isLoading, permissionContext, onActionSelect }: FinanceHoldsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (isLoading) return <div className="p-10 text-center animate-pulse text-slate-400 font-black tracking-widest uppercase shadow-inner bg-slate-50/50 rounded-xl">جاري استعراض المبالغ المحجوزة...</div>;
  if (holds.length === 0) return <div className="p-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 font-black text-slate-400">لا يوجد مبالغ محجوزة حالياً.</div>;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm" dir="rtl">
      <table className="w-full text-right text-sm text-slate-700">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-4">صاحب الرصيد</th>
            <th className="px-5 py-4">نوع الحجز</th>
            <th className="px-5 py-4">المبلغ المحجوز</th>
            <th className="px-5 py-4">المرجع المرتبط</th>
            <th className="px-5 py-4">تاريخ الحجز</th>
            <th className="px-5 py-4">انتهاء الصلاحية</th>
            <th className="px-5 py-4">الحالة</th>
            <th className="px-5 py-4 sticky left-0 bg-slate-50 text-center shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {holds.map(hold => {
            const rowContext: PermissionContext = { ...permissionContext, selectedRow: hold as any };
            const isMenuOpen = openMenuId === hold.id;

            return (
              <tr key={hold.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-5 py-4">
                  <div className="font-black text-slate-900 leading-tight">{hold.accountName}</div>
                  <div className="text-[10px] font-black text-slate-400 mt-1 font-mono tracking-tighter uppercase">ID: {hold.accountId}</div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 shadow-sm uppercase">{hold.holdType.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="font-black text-slate-800 text-base">{formatNumber(hold.amount)} <span className="text-[10px] uppercase">{hold.currency}</span></div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-xs font-black text-slate-600">{hold.referenceType}</div>
                  <div className="text-[10px] font-bold text-blue-600 mt-1 font-mono tracking-tighter uppercase">REF: {hold.referenceId}</div>
                </td>
                <td className="px-5 py-4 text-[11px] font-black text-slate-500" dir="ltr">
                  {new Date(hold.createdAt).toLocaleString("en-US")}
                </td>
                <td className="px-5 py-4 text-[11px] font-black text-amber-600" dir="ltr">
                  {hold.expiresAt ? new Date(hold.expiresAt).toLocaleDateString("en-US") : 'دائم'}
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black shadow-sm ${
                    hold.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {hold.status}
                  </span>
                </td>
                <td className={`px-5 py-4 text-center sticky left-0 bg-white group-hover:bg-blue-50/30 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-all ${isMenuOpen ? 'z-50' : 'z-20'}`}>
                  <FinanceActionMenu 
                    context={rowContext}
                    recordId={hold.id}
                    recordType="HOLD"
                    onSelectAction={onActionSelect}
                    isOpen={isMenuOpen}
                    onToggle={() => setOpenMenuId(isMenuOpen ? null : hold.id)}
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
