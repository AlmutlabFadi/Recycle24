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

export function RestrictedAccountsView({
  accounts,
  isLoading,
  currentUserRole,
  onActionSelect,
}: RestrictedAccountsViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-r-4 border-rose-900 py-1 pr-4">
        <div>
          <h2 className="tracking-tight text-xl font-black text-slate-900">
            الحسابات المقيدة والمجمدة
          </h2>
          <p className="mt-1 text-xs font-bold text-slate-500">
            الحسابات الواقعة تحت التقييد المالي أو التجميد أو القفل التشغيلي المرتبط
            بالحساب أو المديونية.
          </p>
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