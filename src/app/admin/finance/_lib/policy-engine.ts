import { normalizeToUSD } from "./fx-engine";

type OperationType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "EXCHANGE";
type Currency = "USD" | "SYP";

export interface PolicyInput {
  type: OperationType;
  amount: number;
  currency: Currency;
  userId: string;
  velocityTriggered?: boolean;
}

export interface PolicyResult {
  requiresFirstApproval: boolean;
  requiresFinalApproval: boolean;
  flags: {
    highValue: boolean;
    velocityTriggered: boolean;
  };
}

// 🔒 thresholds
const WITHDRAWAL_LIMIT_USD = 500;
const WITHDRAWAL_LIMIT_SYP = 50000;

const TRANSFER_LIMIT_AUTO_USD = 1000;
const TRANSFER_LIMIT_AUTO_SYP = 120000;
const TRANSFER_LIMIT_FIRST_USD = 5000;
const TRANSFER_LIMIT_FIRST_SYP = 600000;

export function evaluateApproval(input: PolicyInput): PolicyResult {
  const normalizedUSD = normalizeToUSD(input.amount, input.currency);

  const velocityTriggered = input.velocityTriggered ?? false;

  let requiresFirstApproval = false;
  let requiresFinalApproval = false;
  let highValue = false;

  switch (input.type) {
    case "DEPOSIT":
      return {
        requiresFirstApproval: false,
        requiresFinalApproval: false,
        flags: {
          highValue: false,
          velocityTriggered: false,
        },
      };

    case "WITHDRAWAL":
      requiresFirstApproval = true;

      const withdrawalLimit =
        input.currency === "SYP" ? TRANSFER_LIMIT_FIRST_SYP : TRANSFER_LIMIT_FIRST_USD;

      if (input.amount > withdrawalLimit || velocityTriggered) {
        requiresFinalApproval = true;
        highValue = input.amount > withdrawalLimit;
      }

      break;

    case "TRANSFER":
      const autoLimit = input.currency === "SYP" ? TRANSFER_LIMIT_AUTO_SYP : TRANSFER_LIMIT_AUTO_USD;
      const firstLimit = input.currency === "SYP" ? TRANSFER_LIMIT_FIRST_SYP : TRANSFER_LIMIT_FIRST_USD;

      if (velocityTriggered) {
        requiresFirstApproval = true;
        requiresFinalApproval = true;
        highValue = input.amount > autoLimit;
      } else if (input.amount <= autoLimit) {
        requiresFirstApproval = false;
        requiresFinalApproval = false;
        highValue = false;
      } else if (input.amount <= firstLimit) {
        requiresFirstApproval = true;
        requiresFinalApproval = false;
        highValue = false;
      } else {
        requiresFirstApproval = true;
        requiresFinalApproval = true;
        highValue = true;
      }

      break;

    case "EXCHANGE":
      return {
        requiresFirstApproval: false,
        requiresFinalApproval: false,
        flags: {
          highValue: false,
          velocityTriggered: false,
        },
      };

    default:
      throw new Error("Unsupported operation type");
  }

  return {
    requiresFirstApproval,
    requiresFinalApproval,
    flags: {
      highValue,
      velocityTriggered,
    },
  };
}