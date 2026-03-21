import { FinanceRequestRow, FinancePageTab, FinanceApprovalStage, FinanceRequestStatus } from "./types";

export type AdminRole = "REVIEWER" | "FINAL_APPROVER" | "FINANCE_MANAGER" | "RISK_COMPLIANCE" | "SUPPORT" | "SUPER_ADMIN";

export interface PermissionContext {
  role: AdminRole;
  activeTab?: FinancePageTab;
  selectedRow?: FinanceRequestRow;
}

export function canViewFinanceSummary(ctx: PermissionContext): boolean {
  return true; // All roles accessing this page can view the summary
}

export function canViewRequests(ctx: PermissionContext): boolean {
  return ["REVIEWER", "FINAL_APPROVER", "FINANCE_MANAGER", "SUPER_ADMIN", "SUPPORT", "RISK_COMPLIANCE"].includes(ctx.role);
}

export function canViewHolds(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN", "RISK_COMPLIANCE"].includes(ctx.role);
}

export function canViewDebts(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN", "RISK_COMPLIANCE"].includes(ctx.role);
}

export function canViewRestrictions(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN", "RISK_COMPLIANCE"].includes(ctx.role);
}

export function canViewAudit(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN", "RISK_COMPLIANCE"].includes(ctx.role);
}

export function canApproveFirstStage(ctx: PermissionContext): boolean {
  if (!["REVIEWER", "FINANCE_MANAGER", "SUPER_ADMIN"].includes(ctx.role)) return false;
  if (ctx.selectedRow && ctx.selectedRow.approvalStage !== "AWAITING_FIRST_REVIEW") return false;
  return true;
}

export function canApproveFinalStage(ctx: PermissionContext): boolean {
  if (!["FINAL_APPROVER", "FINANCE_MANAGER", "SUPER_ADMIN"].includes(ctx.role)) return false;
  if (ctx.selectedRow && ctx.selectedRow.approvalStage !== "AWAITING_FINAL_APPROVAL") return false;
  return true;
}

export function canRejectRequest(ctx: PermissionContext): boolean {
  if (!["REVIEWER", "FINAL_APPROVER", "FINANCE_MANAGER", "SUPER_ADMIN"].includes(ctx.role)) return false;
  if (ctx.selectedRow && ["COMPLETED", "REJECTED", "REVERSED"].includes(ctx.selectedRow.status)) return false;
  return true;
}

export function canAssignReviewer(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN"].includes(ctx.role);
}

export function canAssignFinalApprover(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN"].includes(ctx.role);
}

export function canFreezeDebit(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN", "RISK_COMPLIANCE"].includes(ctx.role);
}

export function canFreezeCredit(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN", "RISK_COMPLIANCE"].includes(ctx.role);
}

export function canFullFreeze(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN", "RISK_COMPLIANCE"].includes(ctx.role);
}

export function canUnfreeze(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN", "RISK_COMPLIANCE"].includes(ctx.role);
}

export function canReleaseHold(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN"].includes(ctx.role);
}

export function canCaptureHold(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN"].includes(ctx.role);
}

export function canEscalateCompliance(ctx: PermissionContext): boolean {
  return ["REVIEWER", "FINAL_APPROVER", "FINANCE_MANAGER", "SUPER_ADMIN"].includes(ctx.role);
}

export function canMarkProcessing(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN"].includes(ctx.role);
}

export function canMarkSettled(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN"].includes(ctx.role);
}

export function canMarkFailed(ctx: PermissionContext): boolean {
  return ["FINANCE_MANAGER", "SUPER_ADMIN"].includes(ctx.role);
}

export function canAddInternalNote(ctx: PermissionContext): boolean {
  return ctx.role !== "SUPPORT"; 
}
