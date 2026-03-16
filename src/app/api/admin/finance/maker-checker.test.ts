import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { POST as approveDepositRoute } from "@/app/api/admin/finance/deposit-requests/[id]/approve/route";
import { POST as approvePayoutRoute } from "@/app/api/admin/finance/payout-requests/[id]/approve/route";
import { requirePermission } from "@/lib/rbac";

vi.mock("@/lib/rbac", () => ({
  requirePermission: vi.fn(),
}));

const mockedRequirePermission = vi.mocked(requirePermission);

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
      email: email ?? `${uniqueValue("finance-user")}@example.com`,
      password: "test-password",
      name: "Finance Test User",
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

describe("finance maker-checker approvals", () => {
  beforeEach(() => {
    mockedRequirePermission.mockResolvedValue({
      ok: true,
      status: 200,
      userId: "finance-admin-1",
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("moves large deposit request into final approval stage on first approval", async () => {
    const user = await createTestUser();
    const account = await createLedgerAccount({
      ownerId: user.id,
      balance: 0,
    });

    await createWallet(user.id, 0);

    const depositRequest = await db.depositRequest.create({
      data: {
        accountId: account.id,
        userId: user.id,
        amount: 50_000_000,
        currency: "SYP",
        method: "BANK_TRANSFER",
        status: "PENDING",
      },
    });

    const response = await approveDepositRoute(
      makeJsonRequest({ reviewNote: "First review" }),
      { params: { id: depositRequest.id } } as never
    );

    expect(response!.status).toBe(200);

    const payload = await response!.json();
    expect(payload.message).toContain("final approval stage");

    const updatedRequest = await db.depositRequest.findUniqueOrThrow({
      where: { id: depositRequest.id },
    });

    expect(updatedRequest.status).toBe("UNDER_REVIEW");
    expect(updatedRequest.approvalStage).toBe("AWAITING_FINAL_APPROVAL");
    expect(updatedRequest.reviewedById).toBe("finance-admin-1");

    const journalEntries = await db.journalEntry.findMany({
      where: {
        idempotencyKey: `deposit-approve:${depositRequest.id}`,
      },
    });

    expect(journalEntries).toHaveLength(0);
  });

  it("rejects final approval when the same admin tries to approve a large deposit twice", async () => {
    const user = await createTestUser();
    const account = await createLedgerAccount({
      ownerId: user.id,
      balance: 0,
    });

    await createWallet(user.id, 0);

    const depositRequest = await db.depositRequest.create({
      data: {
        accountId: account.id,
        userId: user.id,
        amount: 60_000_000,
        currency: "SYP",
        method: "BANK_TRANSFER",
        status: "UNDER_REVIEW",
        approvalStage: "AWAITING_FINAL_APPROVAL",
        reviewedById: "finance-admin-1",
        reviewedAt: new Date(),
      },
    });

    const response = await approveDepositRoute(
      makeJsonRequest({ reviewNote: "Second review by same admin" }),
      { params: { id: depositRequest.id } } as never
    );

    expect(response!.status).toBe(409);

    const payload = await response!.json();
    expect(payload.error).toContain("second finance admin");
  });

  it("allows a second admin to finalize a large deposit", async () => {
    const user = await createTestUser();
    const account = await createLedgerAccount({
      ownerId: user.id,
      balance: 0,
    });

    await createWallet(user.id, 0);

    const depositRequest = await db.depositRequest.create({
      data: {
        accountId: account.id,
        userId: user.id,
        amount: 70_000_000,
        currency: "SYP",
        method: "BANK_TRANSFER",
        status: "UNDER_REVIEW",
        approvalStage: "AWAITING_FINAL_APPROVAL",
        reviewedById: "finance-admin-1",
        reviewedAt: new Date(),
      },
    });

    mockedRequirePermission.mockResolvedValueOnce({
      ok: true,
      status: 200,
      userId: "finance-admin-2",
    } as never);

    const response = await approveDepositRoute(
      makeJsonRequest({ reviewNote: "Final approval by second admin" }),
      { params: { id: depositRequest.id } } as never
    );

    expect(response!.status).toBe(200);

    const updatedRequest = await db.depositRequest.findUniqueOrThrow({
      where: { id: depositRequest.id },
    });

    expect(updatedRequest.status).toBe("COMPLETED");
    expect(updatedRequest.approvalStage).toBe("FINAL_APPROVED");
    expect(updatedRequest.reviewedById).toBe("finance-admin-1");
    expect(updatedRequest.approvedById).toBe("finance-admin-2");
    expect(updatedRequest.approvedAt).not.toBeNull();

    const updatedAccount = await db.ledgerAccount.findUniqueOrThrow({
      where: { id: account.id },
    });

    expect(updatedAccount.balance).toBe(70_000_000);
  });

  it("moves large payout request into final approval stage on first approval", async () => {
    const user = await createTestUser();
    const account = await createLedgerAccount({
      ownerId: user.id,
      balance: 80_000_000,
    });

    await createWallet(user.id, 80_000_000);

    const payoutRequest = await db.payoutRequest.create({
      data: {
        accountId: account.id,
        userId: user.id,
        amount: 25_000_000,
        currency: "SYP",
        method: "BANK_TRANSFER",
        destination: uniqueValue("destination"),
        status: "PENDING",
      },
    });

    const response = await approvePayoutRoute(
      makeJsonRequest({ reviewNote: "First payout review" }),
      { params: { id: payoutRequest.id } } as never
    );

    expect(response!.status).toBe(200);

    const payload = await response!.json();
    expect(payload.message).toContain("final approval stage");

    const updatedRequest = await db.payoutRequest.findUniqueOrThrow({
      where: { id: payoutRequest.id },
    });

    expect(updatedRequest.status).toBe("UNDER_REVIEW");
    expect(updatedRequest.approvalStage).toBe("AWAITING_FINAL_APPROVAL");
    expect(updatedRequest.reviewedById).toBe("finance-admin-1");
  });

  it("allows a second admin to finalize a large payout", async () => {
    const user = await createTestUser();
    const account = await createLedgerAccount({
      ownerId: user.id,
      balance: 90_000_000,
    });

    await createWallet(user.id, 90_000_000);

    const payoutRequest = await db.payoutRequest.create({
      data: {
        accountId: account.id,
        userId: user.id,
        amount: 30_000_000,
        currency: "SYP",
        method: "BANK_TRANSFER",
        destination: uniqueValue("destination"),
        status: "UNDER_REVIEW",
        approvalStage: "AWAITING_FINAL_APPROVAL",
        reviewedById: "finance-admin-1",
        reviewedAt: new Date(),
      },
    });

    mockedRequirePermission.mockResolvedValueOnce({
      ok: true,
      status: 200,
      userId: "finance-admin-2",
    } as never);

    const response = await approvePayoutRoute(
      makeJsonRequest({ reviewNote: "Final payout approval" }),
      { params: { id: payoutRequest.id } } as never
    );

    expect(response!.status).toBe(200);

    const updatedRequest = await db.payoutRequest.findUniqueOrThrow({
      where: { id: payoutRequest.id },
    });

    expect(updatedRequest.status).toBe("COMPLETED");
    expect(updatedRequest.approvalStage).toBe("FINAL_APPROVED");
    expect(updatedRequest.reviewedById).toBe("finance-admin-1");
    expect(updatedRequest.approvedById).toBe("finance-admin-2");
    expect(updatedRequest.approvedAt).not.toBeNull();

    const updatedAccount = await db.ledgerAccount.findUniqueOrThrow({
      where: { id: account.id },
    });

    expect(updatedAccount.balance).toBe(60_000_000);
  });
});

