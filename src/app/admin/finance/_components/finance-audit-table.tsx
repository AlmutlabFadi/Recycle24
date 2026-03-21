"use client";

import React from "react";
import { FinanceAuditRow } from "../_lib/types";

interface FinanceAuditTableProps {
  logs: FinanceAuditRow[];
  isLoading: boolean;
}

export function FinanceAuditTable({ logs, isLoading }: FinanceAuditTableProps) {
  if (isLoading) {
    return (
      <div className="p-10 text-center font-black italic uppercase tracking-widest text-slate-400 animate-pulse">
        جاري استرجاع سجل التدقيق المالي...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-16 text-center font-black text-slate-400">
        سجل التدقيق فارغ حاليًا.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-lg" dir="rtl">
      <table className="w-full text-right text-sm text-slate-700">
        <thead className="border-b border-slate-800 bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <tr>
            <th className="px-6 py-5">رقم العملية</th>
            <th className="px-6 py-5">المسؤول</th>
            <th className="px-6 py-5 text-blue-400">الإجراء المنفذ</th>
            <th className="px-6 py-5">الكيان المستهدف</th>
            <th className="px-6 py-5">السبب / الملاحظات</th>
            <th className="px-6 py-5">عنوان IP</th>
            <th className="px-6 py-5">الوقت والتاريخ</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {logs.map((log) => (
            <tr key={log.id} className="group transition-all hover:bg-blue-50/20">
              <td className="px-6 py-5 font-mono text-xs font-black uppercase tracking-tighter text-slate-400">
                {log.id}
              </td>

              <td className="px-6 py-5">
                <div className="font-black text-slate-900">{log.actor}</div>
                <div className="text-[9px] font-black uppercase tracking-tight text-blue-600">
                  Finance Audit Trail
                </div>
              </td>

              <td className="px-6 py-5">
                <span className="rounded border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-black uppercase text-blue-700 shadow-sm">
                  {log.action}
                </span>
              </td>

              <td className="px-6 py-5">
                <div className="text-xs font-black text-slate-700">{log.entityType}</div>
                <div className="mt-1 font-mono text-[10px] font-black uppercase tracking-tighter text-slate-400">
                  ID: {log.entityId}
                </div>
              </td>

              <td className="px-6 py-5">
                <p className="max-w-[320px] border-r-2 border-slate-200 pr-3 text-xs font-bold italic leading-relaxed text-slate-500">
                  "{log.reason}"
                </p>
              </td>

              <td className="px-6 py-5 font-mono text-xs text-slate-400">
                {log.ipAddress || "---.---.---.---"}
              </td>

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

export default FinanceAuditTable;