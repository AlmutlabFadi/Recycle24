"use client";

import React, { useState } from "react";
import { FinanceRequestRow } from "../_lib/types";
import { FinanceActionMenu } from "./finance-action-menu";
import { AdminRole, PermissionContext } from "../_lib/permissions";

interface FinanceRequestsTableProps {
  requests: FinanceRequestRow[];
  isLoading: boolean;
  onRowClick: (row: FinanceRequestRow) => void;
  currentUserRole: AdminRole;
  onActionSelect: (actionType: string, recordId: string) => void;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "UNDER_REVIEW":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "PROCESSING":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "FAILED":
    case "REJECTED":
    case "REVERSED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function getStageBadgeColor(stage: string) {
  if (stage === "AWAITING_FIRST_REVIEW") return "bg-amber-50 text-amber-700 border-amber-200";
  if (stage === "AWAITING_FINAL_APPROVAL") return "bg-orange-50 text-orange-700 border-orange-200";
  if (stage === "FINAL_APPROVED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export function FinanceRequestsTable({
  requests,
  isLoading,
  onRowClick,
  currentUserRole,
  onActionSelect,
}: FinanceRequestsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-black text-slate-500 animate-pulse shadow-sm">
        جاري تحميل طابور العمليات...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center shadow-sm">
        <p className="text-sm font-black text-slate-600">لم يتم العثور على طلبات تطابق معايير البحث.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm" dir="rtl">
      <table className="w-full text-right text-sm text-slate-700">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-4">رقم الطلب / النوع</th>
            <th className="px-5 py-4">صاحب الحساب / الكيان</th>
            <th className="px-5 py-4">القيمة المالية</th>
            <th className="px-5 py-4 hidden lg:table-cell">التعرض اللحظي</th>
            <th className="px-5 py-4">الحالة والمرحلة</th>
            <th className="px-5 py-4 hidden xl:table-cell">المسؤول</th>
            <th className="px-5 py-4">الخطر / الأوسمة</th>
            <th className="px-5 py-4 hidden xl:table-cell">التاريخ / SLA</th>
            <th className="px-5 py-4 sticky left-0 bg-slate-50 text-center shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]">
              الإجراءات
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {requests.map((row) => {
            const permissionCtx: PermissionContext = { role: currentUserRole, selectedRow: row as any };
            const isMenuOpen = openMenuId === row.id;

            return (
              <tr
                key={row.id}
                onClick={() => onRowClick(row)}
                className="group cursor-pointer bg-white transition-colors hover:bg-blue-50/30"
              >
                <td className="px-5 py-4 align-top">
                  <div className="font-black text-slate-900 tracking-tight">{row.id}</div>
                  <div className="text-[10px] font-black text-slate-500 mt-1 uppercase bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200">{row.type}</div>
                </td>

                <td className="px-5 py-4 align-top">
                  <div className="font-black text-slate-900 text-[15px] leading-tight">{row.accountName}</div>
                  <div className="text-[11px] font-black text-blue-600 mt-1">
                    {row.accountOwner} • {row.accountClass}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-1 font-mono">ID: {row.accountId}</div>
                </td>

                <td className="px-5 py-4 align-top">
                  <div className="text-lg font-black text-slate-900 leading-none">
                    {formatNumber(row.amount)}
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{row.currency}</div>
                </td>

                <td className="px-5 py-4 align-top hidden lg:table-cell text-[11px] leading-relaxed">
                  {row.walletExposure.balances.map((balance) => (
                    <div key={balance.currency} className="mb-2 last:mb-0 border-b border-slate-50 pb-1 last:border-0">
                      <div className="font-black text-slate-700 bg-slate-50 px-1 py-0.5 rounded text-[9px] w-fit mb-1">{balance.currency}</div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 font-bold">متاح: <span className="text-slate-900 font-black">{formatNumber(balance.available)}</span></span>
                        {balance.frozen > 0 && <span className="text-rose-600 font-black">مجمد: {formatNumber(balance.frozen)}</span>}
                      </div>
                    </div>
                  ))}
                </td>

                <td className="px-5 py-4 align-top space-y-1.5">
                  <div className="flex">
                    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-black tracking-tight shadow-sm ${getStatusBadgeColor(row.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 ml-0.5 animate-pulse"></span>
                      {row.status}
                    </span>
                  </div>
                  {row.approvalStage !== "NONE" && (
                    <div className="flex">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border shadow-sm ${getStageBadgeColor(row.approvalStage)}`}>
                        {row.approvalStage}
                      </span>
                    </div>
                  )}
                </td>

                <td className="px-5 py-4 align-top hidden xl:table-cell text-xs font-black text-slate-800">
                  {row.currentOwner ?? "غير مكلف"}
                </td>

                <td className="px-5 py-4 align-top">
                  <div className="flex flex-wrap gap-1.5 max-w-[150px]">
                    {row.badges.map((badge) => (
                      <span key={badge} className="rounded-md bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
                        {badge}
                      </span>
                    ))}
                    {row.riskFlags.map((flag) => (
                      <span
                        key={flag.id}
                        className="rounded-md bg-white border border-rose-200 px-2 py-0.5 text-[9px] font-black text-rose-600 shadow-sm"
                        title={flag.description}
                      >
                        ! {flag.code}
                      </span>
                    ))}
                    {row.linkedReference && (
                      <span
                        className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[9px] font-black text-indigo-700 italic shadow-sm"
                        title={row.linkedReference.label}
                      >
                        رابط: {row.linkedReference.type}
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-5 py-4 align-top hidden xl:table-cell">
                  <div className="text-[11px] font-black text-slate-500" dir="ltr">{new Date(row.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  <div className="text-[10px] text-slate-400 font-bold">{new Date(row.createdAt).toLocaleDateString()}</div>
                  <div className={`mt-2 text-[9px] font-black uppercase tracking-tighter px-1 rounded inline-block ${row.slaWaitingTime.includes('Failed') ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>SLA: {row.slaWaitingTime}</div>
                </td>

                <td
                  className={`px-5 py-4 align-top sticky left-0 bg-white text-center shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)] group-hover:bg-blue-50/30 transition-all ${isMenuOpen ? 'z-50' : 'z-20'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <FinanceActionMenu
                    context={permissionCtx}
                    recordId={row.id}
                    recordType="REQUEST"
                    onSelectAction={onActionSelect}
                    isOpen={isMenuOpen}
                    onToggle={() => setOpenMenuId(isMenuOpen ? null : row.id)}
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
