import type { FinanceRequestType } from "./types";

export type FinanceSupportedActionType =
  | "APPROVE_FIRST_STAGE"
  | "APPROVE_FINAL_STAGE"
  | "REJECT"
  | "MARK_FAILED"
  | "ADD_INTERNAL_NOTE"
  | "FREEZE_DEBIT";

export type FinanceActionTone = "primary" | "danger" | "warning" | "neutral";

export interface FinanceActionCapabilityInput {
  actionType: FinanceSupportedActionType;
  label: string;
  requiresReason: boolean;
  requiresConfirmation: boolean;
  tone: FinanceActionTone;
  canExecute: boolean;
  disabledReason?: string | null;
}

export interface FinanceActionCapability {
  actionType: FinanceSupportedActionType;
  label: string;
  requiresReason: boolean;
  requiresConfirmation: boolean;
  tone: FinanceActionTone;
  isEnabled: boolean;
  disabledReason: string | null;
  backendSupported: boolean;
}

const BACKEND_SUPPORTED_ACTIONS: ReadonlySet<FinanceSupportedActionType> = new Set([
  "APPROVE_FIRST_STAGE",
  "APPROVE_FINAL_STAGE",
  "REJECT",
]);

export function isBackendSupportedAction(
  actionType: FinanceSupportedActionType,
  requestType?: FinanceRequestType | null,
): boolean {
  if (!BACKEND_SUPPORTED_ACTIONS.has(actionType)) {
    return false;
  }

  if (
    actionType === "APPROVE_FIRST_STAGE" ||
    actionType === "APPROVE_FINAL_STAGE" ||
    actionType === "REJECT"
  ) {
    return requestType === "DEPOSIT" || requestType === "PAYOUT" || requestType === "TRANSFER";
  }

  return false;
}

export function getActionCapabilities(
  input: FinanceActionCapabilityInput,
  options?: {
    requestType?: FinanceRequestType | null;
  },
): FinanceActionCapability {
  const backendSupported = isBackendSupportedAction(
    input.actionType,
    options?.requestType ?? null,
  );

  if (!input.canExecute) {
    return {
      ...input,
      isEnabled: false,
      disabledReason: input.disabledReason ?? "ليست لديك الصلاحية لتنفيذ هذا الإجراء.",
      backendSupported,
    };
  }

  if (!backendSupported) {
    return {
      ...input,
      isEnabled: false,
      disabledReason: "هذا الإجراء غير مربوط بعد بمسار backend حقيقي.",
      backendSupported,
    };
  }

  return {
    ...input,
    isEnabled: true,
    disabledReason: null,
    backendSupported,
  };
}
