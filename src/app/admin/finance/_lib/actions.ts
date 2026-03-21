export type FinanceActionType = 
  | "ASSIGN_REVIEWER"
  | "ASSIGN_FINAL_APPROVER"
  | "APPROVE_FIRST_STAGE"
  | "APPROVE_FINAL_STAGE"
  | "REJECT"
  | "MARK_PROCESSING"
  | "MARK_SETTLED"
  | "MARK_FAILED"
  | "FREEZE_DEBIT"
  | "FREEZE_CREDIT"
  | "FULL_FREEZE"
  | "UNFREEZE"
  | "RELEASE_HOLD"
  | "CAPTURE_HOLD"
  | "ESCALATE_COMPLIANCE"
  | "ADD_INTERNAL_NOTE";

export interface FinanceActionCapability {
  actionType: FinanceActionType;
  label: string;
  isEnabled: boolean;
  requiresReason: boolean;
  requiresConfirmation: boolean;
  disabledReason?: string;
  tone: "primary" | "danger" | "neutral" | "warning";
}

export interface FinanceActionCommand {
  actionType: FinanceActionType;
  targetRecordType: "REQUEST" | "ACCOUNT" | "HOLD" | "DEBT" | "RESTRICTION";
  targetRecordId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export function getActionCapabilities(options: {
  canExecute: boolean;
  actionType: FinanceActionType;
  label: string;
  requiresReason: boolean;
  requiresConfirmation: boolean;
  disabledReason?: string;
  tone: "primary" | "danger" | "neutral" | "warning";
}): FinanceActionCapability {
  return {
    actionType: options.actionType,
    label: options.label,
    isEnabled: options.canExecute,
    requiresReason: options.requiresReason,
    requiresConfirmation: options.requiresConfirmation,
    disabledReason: options.canExecute ? undefined : options.disabledReason ?? "You do not have permission or the record state is invalid.",
    tone: options.tone,
  };
}
