"use client";

import React from "react";
import { FinanceAuditRow } from "../_lib/types";

interface FinanceAuditTableProps {
  logs: FinanceAuditRow[];
  isLoading: boolean;
}

export function FinanceAuditTable({ logs, isLoading }: FinanceAuditTableProps) {
  if (isLoading) return <div className="p-10 text-center animate-pulse text-slate-400 font-black italic tracking-widest uppercase">جاري استرجاع سجل التدقيق الجنائي...</div>;
  if (logs.length === 0) return <div className="p-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 font-black text-slate-400">سجل التدقيق فارغ حالياً.</div>;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-lg" dir="rtl">
      <table className="w-full text-right text-sm text-slate-700">
        <thead className="bg-slate-900 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-widest">
          <tr>
            <th className="px-6 py-5">رقم العملية</th>
            <th className="px-6 py-5">المسؤول (Actor)</th>
            <th className="px-6 py-5 text-blue-400">الإجراء المنفذ</th>
            <th className="px-6 py-5">الكيان المستهدف</th>
            <th className="px-6 py-5">السبب / الملاحظات</th>
            <th className="px-6 py-5">عنوان IP</th>
            <th className="px-6 py-5">الوقت والتاريخ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-blue-50/20 transition-all group">
              <td className="px-6 py-5 font-black text-slate-400 font-mono text-xs tracking-tighter uppercase">{log.id}</td>
              <td className="px-6 py-5">
                <div className="font-black text-slate-900">{log.actor}</div>
                <div className="text-[9px] font-black text-blue-600 uppercase tracking-tight">System Admin Panel</div>
              </td>
              <td className="px-6 py-5">
                <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 shadow-sm uppercase">{log.action}</span>
              </td>
              <td className="px-6 py-5">
                <div className="text-xs font-black text-slate-700">{log.entityType}</div>
                <div className="text-[10px] font-black text-slate-400 font-mono mt-1 tracking-tighter uppercase">ID: {log.entityId}</div>
              </td>
              <td className="px-6 py-5">
                <p className="text-xs font-bold text-slate-500 max-w-[250px] leading-relaxed italic border-r-2 border-slate-200 pr-3">"{log.reason}"</p>
              </td>
              <td className="px-6 py-5 font-mono text-xs text-slate-400">{log.ipAddress || '---.---.---.---'}</td>
              <td className="px-6 py-5 text-[11px] font-black text-slate-500" dir="ltr">
                {new Date(log.timestamp).toLocaleString("en-US")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
