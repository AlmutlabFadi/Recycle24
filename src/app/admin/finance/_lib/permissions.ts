import { FinanceRequestRow, FinancePageTab } from "./types";

export type AdminRole =
  | "REVIEWER"
  | "FINAL_APPROVER"
  | "FINANCE_MANAGER"
  | "RISK_COMPLIANCE"
  | "SUPPORT"
  | "SUPER_ADMIN";

export interface PermissionContext {
  role: AdminRole;
  permissions: string[]; // Added permissions from RBAC
  activeTab?: FinancePageTab;
  selectedRow?: FinanceRequestRow;
}

function isAwaitingFirstReview(row?: FinanceRequestRow): boolean {
  if (!row) {
    return false;
  }

  // A payout/transfer is in first review if it is PENDING and has no stage yet
  return (
    (row.status === "PENDING" && (row.approvalStage === "NONE" || !row.approvalStage)) ||
    row.approvalStage === "AWAITING_FIRST_REVIEW"
  );
}

function isAwaitingFinalApproval(row?: FinanceRequestRow): boolean {
  if (!row) {
    return false;
  }

  return row.approvalStage === "AWAITING_FINAL_APPROVAL" || row.status === "UNDER_REVIEW";
}

export function canViewFinanceSummary(_ctx: PermissionContext): boolean {
  return true;
}

export function canViewRequests(ctx: PermissionContext): boolean {
  return ctx.permissions.includes("MANAGE_FINANCE") || ctx.role === "SUPER_ADMIN";
}

export function canViewHolds(ctx: PermissionContext): boolean {
  return ctx.permissions.includes("MANAGE_FINANCE") || ctx.role === "SUPER_ADMIN";
}

export function canViewDebts(ctx: PermissionContext): boolean {
  return ctx.permissions.includes("MANAGE_FINANCE") || ctx.role === "SUPER_ADMIN";
}

export function canViewRestrictions(ctx: PermissionContext): boolean {
  return ctx.permissions.includes("MANAGE_FINANCE") || ctx.role === "SUPER_ADMIN";
}

export function canViewAudit(ctx: PermissionContext): boolean {
  return ctx.permissions.includes("MANAGE_FINANCE") || ctx.role === "SUPER_ADMIN";
}

export function canApproveFirstStage(ctx: PermissionContext): boolean {
  // Only users with MANAGE_FINANCE can do first approval
  if (!ctx.permissions.includes("MANAGE_FINANCE") && ctx.role !== "SUPER_ADMIN") {
    return false;
  }

  if (!ctx.selectedRow) {
    return true;
  }

  // Cannot approve if already completed/rejected or if it's already past this stage
  if (["COMPLETED", "REJECTED", "REVERSED", "FAILED"].includes(ctx.selectedRow.status)) {
    return false;
  }

  // If it's already UNDER_REVIEW or AWAITING_FINAL_APPROVAL, first stage is done
  if (ctx.selectedRow.status === "UNDER_REVIEW" || ctx.selectedRow.approvalStage === "AWAITING_FINAL_APPROVAL") {
    return false;
  }

  return isAwaitingFirstReview(ctx.selectedRow);
}

export function canApproveFinalStage(ctx: PermissionContext): boolean {
  // Only users with FINANCE_FINAL_APPROVE or SUPER_ADMIN can do final approval
  if (!ctx.permissions.includes("FINANCE_FINAL_APPROVE") && ctx.role !== "SUPER_ADMIN") {
    return false;
  }

  if (!ctx.selectedRow) {
    return true;
  }

  if (["COMPLETED", "REJECTED", "REVERSED", "FAILED"].includes(ctx.selectedRow.status)) {
    return false;
  }

  return isAwaitingFinalApproval(ctx.selectedRow);
}

export function canRejectRequest(ctx: PermissionContext): boolean {
  if (!ctx.permissions.includes("MANAGE_FINANCE") && ctx.role !== "SUPER_ADMIN") {
    return false;
  }

  if (ctx.selectedRow) {
    if (["COMPLETED", "REJECTED", "REVERSED"].includes(ctx.selectedRow.status)) {
      return false;
    }

    // Logic: If I am ONLY a REVIEWER (not a final approver) and the request is already in FINAL_APPROVAL stage, I can no longer reject it.
    // This prevents the first level manager from interfering once they have passed it up.
    const isFinalStage = isAwaitingFinalApproval(ctx.selectedRow);
    const hasFinalApprovePower = ctx.permissions.includes("FINANCE_FINAL_APPROVE") || ctx.role === "SUPER_ADMIN";

    if (isFinalStage && !hasFinalApprovePower) {
      return false;
    }
  }

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
