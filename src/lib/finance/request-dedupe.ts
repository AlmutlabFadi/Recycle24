import { db } from "@/lib/db";

const DUPLICATE_WINDOW_MS = 90 * 1000;

type DuplicateDepositInput = {
  userId: string;
  accountId: string;
  amount: number;
  currency: string;
  method: string;
  proofUrl?: string | null;
  requestNote?: string | null;
};

type DuplicatePayoutInput = {
  userId: string;
  accountId: string;
  amount: number;
  currency: string;
  method: string;
  destination: string;
  requestNote?: string | null;
};

function recentThreshold() {
  return new Date(Date.now() - DUPLICATE_WINDOW_MS);
}

export async function findRecentDuplicateDepositRequest(
  input: DuplicateDepositInput
) {
  return await db.depositRequest.findFirst({
    where: {
      userId: input.userId,
      accountId: input.accountId,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      proofUrl: input.proofUrl ?? null,
      requestNote: input.requestNote ?? null,
      status: {
        in: ["PENDING", "UNDER_REVIEW", "COMPLETED"],
      },
      createdAt: {
        gte: recentThreshold(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      amount: true,
      currency: true,
      method: true,
    },
  });
}

export async function findRecentDuplicatePayoutRequest(
  input: DuplicatePayoutInput
) {
  return await db.payoutRequest.findFirst({
    where: {
      userId: input.userId,
      accountId: input.accountId,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      destination: input.destination,
      requestNote: input.requestNote ?? null,
      status: {
        in: ["PENDING", "UNDER_REVIEW", "COMPLETED"],
      },
      createdAt: {
        gte: recentThreshold(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      amount: true,
      currency: true,
      method: true,
      destination: true,
    },
  });
}
