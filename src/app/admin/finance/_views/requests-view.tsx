"use client";

import React from "react";
import { FinanceRequestRow } from "../_lib/types";
import { PermissionContext } from "../_lib/permissions";
import { FinanceRequestsTable } from "../_components/finance-requests-table";

interface RequestsViewProps {
  requests: FinanceRequestRow[];
  isLoading: boolean;
  permissionContext: PermissionContext;
  onRowClick: (row: FinanceRequestRow) => void;
  onActionSelect: (actionType: string, recordId: string, row?: FinanceRequestRow) => void;
}

export function RequestsView({
  requests,
  isLoading,
  permissionContext,
  onRowClick,
  onActionSelect,
}: RequestsViewProps) {
  return (
    <div className="space-y-4">
      <FinanceRequestsTable
        requests={requests}
        isLoading={isLoading}
        permissionContext={permissionContext}
        onRowClick={onRowClick}
        onActionSelect={onActionSelect}
      />
    </div>
  );
}

export default RequestsView;