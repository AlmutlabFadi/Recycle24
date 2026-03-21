"use client";

import React from "react";
import { FinanceHoldRow } from "../_lib/types";
import { AdminRole } from "../_lib/permissions";
import { FinanceHoldsTable } from "../_components/finance-holds-table";

interface HoldsViewProps {
  holds: FinanceHoldRow[];
  isLoading: boolean;
  currentUserRole: AdminRole;
  onActionSelect: (actionType: string, recordId: string) => void;
}

export function HoldsView({ holds, isLoading, currentUserRole, onActionSelect }: HoldsViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-r-4 border-amber-500 pr-4 py-1">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">إدارة الأرصدة المحجوزة</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">تتبع التأمينات المزادية والضمانات البنكية المعلقة. يمكنك فك الحجز أو استهلاكه هنا.</p>
        </div>
      </div>
      <FinanceHoldsTable 
        holds={holds} 
        isLoading={isLoading} 
        currentUserRole={currentUserRole} 
        onActionSelect={onActionSelect} 
      />
    </div>
  );
}
