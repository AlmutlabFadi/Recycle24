"use client";

import React from "react";
import { FinanceRestrictionRow } from "../_lib/types";
import { AdminRole } from "../_lib/permissions";
import { FinanceRestrictedAccountsTable } from "../_components/finance-restricted-accounts-table";

interface RestrictedAccountsViewProps {
  accounts: FinanceRestrictionRow[];
  isLoading: boolean;
  currentUserRole: AdminRole;
  onActionSelect: (actionType: string, recordId: string) => void;
}

export function RestrictedAccountsView({ accounts, isLoading, currentUserRole, onActionSelect }: RestrictedAccountsViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-r-4 border-rose-900 pr-4 py-1">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">الحسابات المقيدة والمجمدة</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">الحسابات تحت الحظر (Debit/Credit/Full Freeze). إدارة أسباب الحظر وفك القيود.</p>
        </div>
      </div>
      <FinanceRestrictedAccountsTable 
        accounts={accounts} 
        isLoading={isLoading} 
        currentUserRole={currentUserRole} 
        onActionSelect={onActionSelect} 
      />
    </div>
  );
}
