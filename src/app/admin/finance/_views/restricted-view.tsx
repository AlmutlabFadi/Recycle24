"use client";

import React from "react";
import { FinanceRestrictionRow } from "../_lib/types";
import { PermissionContext } from "../_lib/permissions";
import { FinanceRestrictedAccountsTable } from "../_components/finance-restricted-accounts-table";

interface RestrictedAccountsViewProps {
  accounts: FinanceRestrictionRow[];
  isLoading: boolean;
  permissionContext: PermissionContext;
  onActionSelect: (actionType: string, recordId: string) => void;
}

export function RestrictedAccountsView({
  accounts,
  isLoading,
  permissionContext,
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
        permissionContext={permissionContext}
        onActionSelect={onActionSelect}
      />
    </div>
  );
}