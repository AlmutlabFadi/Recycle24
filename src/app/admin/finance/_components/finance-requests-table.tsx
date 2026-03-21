"use client";

import React, { useState } from "react";
import { FinanceRequestRow } from "../_lib/types";
import { AdminRole, PermissionContext } from "../_lib/permissions";
import { FinanceActionMenu } from "./finance-action-menu";

interface FinanceRequestsTableProps {
  requests: FinanceRequestRow[];
  isLoading: boolean;
  onRowClick: (row: FinanceRequestRow) => void;
  currentUserRole: AdminRole;
  onActionSelect: (actionType: string, recordId: string, row?: FinanceRequestRow) => void;
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
      <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500 shadow-sm">
        جار تحميل طابور العمليات...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center shadow-sm">
        <p className="text-sm font-black text-slate-600">لا توجد سجلات مطابقة للفلاتر الحالية.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900">طابور العمليات التشغيلي</h3>
            <p className="mt-1 text-sm leading-7 text-slate-500">
              إدارة طلبات الإيداع والسحب والتحويلات البنكية. الأعمدة هنا مصممة لدعم القرار السريع لا العرض فقط.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <QuickLegend label="اختراق SLA" tone="rose" />
            <QuickLegend label="عالية المخاطر" tone="amber" />
            <QuickLegend label="قابل للتنفيذ" tone="emerald" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1600px] w-full text-right text-sm text-slate-700">
          <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4">رقم الطلب / النوع</th>
              <th className="px-5 py-4">صاحب الحساب / الكيان</th>
              <th className="px-5 py-4">القيمة المالية</th>
              <th className="px-5 py-4">التعرض اللحظي</th>
              <th className="px-5 py-4">الحالة والمرحلة</th>
              <th className="px-5 py-4">المسؤول</th>
              <th className="px-5 py-4">الخطر / الأوسمة</th>
              <th className="px-5 py-4">التاريخ / SLA</th>
              <th className="px-5 py-4">إجراءات سريعة</th>
              <th className="sticky left-0 bg-slate-50 px-5 py-4 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]">
                الإجراءات
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {requests.map((row) => {
              const permissionCtx: PermissionContext = {
                role: currentUserRole,
                selectedRow: row,
              };

              const isMenuOpen = openMenuId === row.id;
              const isSlaBreached =
                row.slaWaitingTime.toLowerCase().includes("failed") ||
                row.slaWaitingTime.toLowerCase().includes("overrun");

              return (
                <tr
                  key={row.id}
                  className="group cursor-pointer bg-white transition-colors hover:bg-slate-50/80"
                  onClick={() => onRowClick(row)}
                >
                  <td className="px-5 py-4 align-top">
                    <div className="font-black text-slate-900">{row.id}</div>
                    <div className="mt-2 inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">
                      {row.type}
                    </div>
                  </td>

                  <td className="px-5 py-4 align-top">
                    <div className="text-[15px] font-black text-slate-900">{row.accountName}</div>
                    <div className="mt-1 text-xs font-bold text-blue-600">
                      {row.accountOwner} · {row.accountType}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">ID: {row.accountId}</div>
                  </td>

                  <td className="px-5 py-4 align-top">
                    <div className="text-[15px] font-black text-slate-900">
                      {row.amount.toLocaleString("ar-SY")}
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-400">{row.currency}</div>
                  </td>

                  <td className="px-5 py-4 align-top text-[11px] leading-6">
                    <div>
                      <span className="font-black text-slate-500">متاح:</span>{" "}
                      <span className="font-black text-slate-900">
                        {row.availableBalance.toLocaleString("ar-SY")}
                      </span>
                    </div>
                    <div>
                      <span className="font-black text-slate-500">محجوز:</span>{" "}
                      <span className="font-black text-slate-900">
                        {row.heldBalance.toLocaleString("ar-SY")}
                      </span>
                    </div>
                    {row.frozenBalance > 0 && (
                      <div className="font-black text-rose-600">
                        مجمد: {row.frozenBalance.toLocaleString("ar-SY")}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4 align-top">
                    <div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${getStatusBadgeColor(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </div>

                    {row.approvalStage !== "NONE" && (
                      <div className="mt-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${getStageBadgeColor(row.approvalStage)}`}
                        >
                          {row.approvalStage}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4 align-top">
                    <div className="font-black text-slate-900">{row.currentOwner ?? "Unassigned"}</div>
                    <div className="mt-2 text-[11px] text-slate-400">تشغيل / مراجعة</div>
                  </td>

                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {row.badges.map((badge) => (
                        <span
                          key={badge}
                          className="rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-black text-white"
                        >
                          {badge}
                        </span>
                      ))}

                      {row.riskFlags.map((flag) => (
                        <span
                          key={flag.id}
                          title={flag.description}
                          className="rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800"
                        >
                          {flag.code}
                        </span>
                      ))}

                      {row.linkedReference && (
                        <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">
                          رابط {row.linkedReference.type}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4 align-top">
                    <div className="text-xs font-black text-slate-700">
                      {new Date(row.createdAt).toLocaleTimeString("ar-SY")}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(row.createdAt).toLocaleDateString("ar-SY")}
                    </div>
                    <div
                      className={`mt-3 inline-flex rounded-lg px-2 py-1 text-[10px] font-black ${
                        isSlaBreached ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      SLA: {row.slaWaitingTime}
                    </div>
                  </td>

                  <td
                    className="px-5 py-4 align-top"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <FinanceActionMenu
                      inline
                      context={permissionCtx}
                      recordId={row.id}
                      recordType="REQUEST"
                      requestType={row.type}
                      onSelectAction={(actionType, recordId) =>
                        onActionSelect(actionType, recordId, row)
                      }
                    />
                  </td>

                  <td
                    className="sticky left-0 bg-white px-5 py-4 align-top shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)] group-hover:bg-slate-50/80"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <FinanceActionMenu
                      context={permissionCtx}
                      recordId={row.id}
                      recordType="REQUEST"
                      requestType={row.type}
                      isOpen={isMenuOpen}
                      onToggle={() => setOpenMenuId(isMenuOpen ? null : row.id)}
                      onClose={() => setOpenMenuId(null)}
                      onSelectAction={(actionType, recordId) =>
                        onActionSelect(actionType, recordId, row)
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuickLegend({
  label,
  tone,
}: {
  label: string;
  tone: "rose" | "amber" | "emerald";
}) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-100 text-rose-700"
      : tone === "amber"
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";

  return <span className={`rounded-full px-3 py-1 text-[11px] font-black ${toneClass}`}>{label}</span>;
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case "PENDING":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "UNDER_REVIEW":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "PROCESSING":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FAILED":
    case "REJECTED":
    case "REVERSED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getStageBadgeColor(stage: string) {
  if (stage === "AWAITING_FIRST_REVIEW") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (stage === "AWAITING_FINAL_APPROVAL") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (stage === "FINAL_APPROVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

export default FinanceRequestsTable;