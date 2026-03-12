import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { POST as rejectPayoutRoute } from "@/app/api/admin/finance/payout-requests/[id]/reject/route";
import { requirePermission } from "@/lib/rbac";

vi.mock("@/lib/rbac", () => ({
  requirePermission: vi.fn(),
}));

const mockedRequirePermission = vi.mocked(requirePermission);
const TEST_ADMIN_ID = "finance-reject-admin";

function uniqueValue(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeJsonRequest(body: Record<string, unknown> = {}) {
  return new NextRequest("http://localhost/api/test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function createTestUser(email?: string) {
  return await db.user.create({
    data: {
      email: email ?? `${uniqueValue("payout-user")}@example.com`,
      password: "test-password",
      name: "Payout Reject User",
    },
  });
}

async function createLedgerAccount(params: {
  ownerId?: string;
  slug?: string;
  balance?: number;
  currency?: string;
}) {
  return await db.ledgerAccount.create({
    data: {
      ownerId: params.ownerId,
      slug: params.slug ?? uniqueValue("ledger-account"),
      balance: params.balance ?? 0,
      currency: params.currency ?? "SYP",
      status: "ACTIVE",
    },
  });
}

async function createWallet(userId: string, balanceSYP = 0) {
  return await db.wallet.create({
    data: {
      userId,
      balanceSYP,
      balanceUSD: 0,
    },
  });
}

beforeEach(() => {
  mockedRequirePermission.mockResolvedValue({
    ok: true,
    status: 200,
    userId: TEST_ADMIN_ID,
  } as never);
});

describe("Finance payout reject route", () => {
  it("rejects a pending payout request with review note", async () => {
    const user = await createTestUser();
    const account = await createLedgerAccount({
      ownerId: user.id,
      balance: 500_000,
    });

    await createWallet(user.id, 500_000);

    const payoutRequest = await db.payoutRequest.create({
      data: {
        accountId: account.id,
        userId: user.id,
        amount: 100_000,
        currency: "SYP",
        method: "BANK_TRANSFER",
        destination: uniqueValue("destination"),
        status: "PENDING",
      },
    });

    const response = await rejectPayoutRoute(
      makeJsonRequest({ reviewNote: "Rejected due to payout mismatch" }),
      { params: { id: payoutRequest.id } } as never
    );

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.success).toBe(true);

    const updatedRequest = await db.payoutRequest.findUniqueOrThrow({
      where: { id: payoutRequest.id },
    });

    expect(updatedRequest.status).toBe("REJECTED");
    expect(updatedRequest.reviewedById).toBe(TEST_ADMIN_ID);
    expect(updatedRequest.reviewNote).toBe("Rejected due to payout mismatch");
    expect(updatedRequest.failureReason).toBe("Rejected due to payout mismatch");
    expect(updatedRequest.failedAt).not.toBeNull();

    const auditLog = await db.auditLog.findFirst({
      where: {
        action: "FINANCE_PAYOUT_REQUEST_REJECTED",
        entityId: payoutRequest.id,
      },
    });

    expect(auditLog).not.toBeNull();
  });

  it("requires review note for payout rejection", async () => {
    const user = await createTestUser();
    const account = await createLedgerAccount({
      ownerId: user.id,
      balance: 200_000,
    });

    await createWallet(user.id, 200_000);

    const payoutRequest = await db.payoutRequest.create({
      data: {
        accountId: account.id,
        userId: user.id,
        amount: 50_000,
        currency: "SYP",
        method: "BANK_TRANSFER",
        destination: uniqueValue("destination"),
        status: "PENDING",
      },
    });

    const response = await rejectPayoutRoute(
      makeJsonRequest({ reviewNote: "" }),
      { params: { id: payoutRequest.id } } as never
    );

    expect(response.status).toBe(400);

    const payload = await response.json();
    expect(payload.error).toContain("Review note is required");
  });
});
