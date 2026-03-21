"use client";

import React from "react";
import { FinanceRequestRow } from "../_lib/types";
import { AdminRole } from "../_lib/permissions";
import { FinanceRequestsTable } from "../_components/finance-requests-table";

interface RequestsViewProps {
  requests: FinanceRequestRow[];
  isLoading: boolean;
  currentUserRole: AdminRole;
  onRowClick: (row: FinanceRequestRow) => void;
  onActionSelect: (actionType: string, recordId: string) => void;
}

export function RequestsView({ requests, isLoading, currentUserRole, onRowClick, onActionSelect }: RequestsViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-r-4 border-blue-600 pr-4 py-1">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">طابور العمليات التشغيلي</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">إدارة طلبات الإيداع، السحب، والتحويلات البينية. انقر على السجل لفتح نافذة التحقيق.</p>
        </div>
      </div>
      <FinanceRequestsTable 
        requests={requests} 
        isLoading={isLoading} 
        currentUserRole={currentUserRole} 
        onRowClick={onRowClick} 
        onActionSelect={onActionSelect} 
      />
    </div>
  );
}
