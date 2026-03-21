"use client";

import React from "react";
import { FinanceAuditRow } from "../_lib/types";
import { FinanceAuditTable } from "../_components/finance-audit-table";

interface AuditViewProps {
  logs: FinanceAuditRow[];
  isLoading: boolean;
}

export function AuditView({ logs, isLoading }: AuditViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-r-4 border-slate-900 py-1 pr-4">
        <div>
          <h2 className="tracking-tight text-xl font-black text-slate-900">
            سجل التدقيق الجنائي
          </h2>
          <p className="mt-1 text-xs font-bold text-slate-500">
            تتبع غير قابل للحذف لجميع الإجراءات المالية الإدارية مع ربط الكيان
            المستهدف والطابع الزمني وعنوان الشبكة عند توفره.
          </p>
        </div>
      </div>

      <FinanceAuditTable logs={logs} isLoading={isLoading} />
    </div>
  );
}