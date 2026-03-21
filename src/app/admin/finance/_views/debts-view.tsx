"use client";

import React from "react";
import { FinanceDebtRow } from "../_lib/types";
import { AdminRole } from "../_lib/permissions";
import { FinanceDebtsTable } from "../_components/finance-debts-table";

interface DebtsViewProps {
  debts: FinanceDebtRow[];
  isLoading: boolean;
  currentUserRole: AdminRole;
  onActionSelect: (actionType: string, recordId: string) => void;
}

export function DebtsView({ debts, isLoading, currentUserRole, onActionSelect }: DebtsViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-r-4 border-rose-600 pr-4 py-1">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">سجل الديون والالتزامات</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">تحصيل العمولات، رسوم التوصيل، والديون المتجاوزة للمدة. مراقبة أعمار الديون (Aging).</p>
        </div>
      </div>
      <FinanceDebtsTable 
        debts={debts} 
        isLoading={isLoading} 
        currentUserRole={currentUserRole} 
        onActionSelect={onActionSelect} 
      />
    </div>
  );
}
