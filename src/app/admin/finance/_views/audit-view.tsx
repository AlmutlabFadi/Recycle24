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
      <div className="flex items-center justify-between border-r-4 border-slate-900 pr-4 py-1">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">سجل التدقيق الجنائي</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">تتبع غير قابل للحذف لجميع الإجراءات المالية الإدارية. يتضمن IP المسؤول وطابع زمن دقيق.</p>
        </div>
      </div>
      <FinanceAuditTable logs={logs} isLoading={isLoading} />
    </div>
  );
}
