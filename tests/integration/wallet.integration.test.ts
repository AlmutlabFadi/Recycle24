import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { POST as createDepositRoute, PUT as createPayoutRoute } from "@/app/api/wallet/route";
import { POST as approveDepositRoute } from "@/app/api/admin/finance/deposit-requests/[id]/approve/route";
import { POST as rejectDepositRoute } from "@/app/api/admin/finance/deposit-requests/[id]/reject/route";
import { POST as approvePayoutRoute } from "@/app/api/admin/finance/payout-requests/[id]/approve/route";
import { POST as rejectPayoutRoute } from "@/app/api/admin/finance/payout-requests/[id]/reject/route";
import { getServerSession } from "next-auth";
import { requirePermission } from "@/lib/rbac";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  requirePermission: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRequirePermission = vi.mocked(requirePermission);

function uniqueValue(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeJsonRequest(
  url: string,
  method: "POST" | "PUT",
  body: Record<string, unknown>
) {
  return new NextRequest(url, {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function makeAdminJsonRequest(body: Record<string, unknown> = {}) {
  return new NextRequest("http://localhost/api/admin/test", {
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
      email: email ?? `${uniqueValue("wallet-user")}@example.com`,
      password: "test-password",
      name: "Wallet Integration User",
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
      slug: params.slug ?? uniqueValue("wallet-ledger-account"),
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
    userId: "finance-admin-1",
  } as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("wallet end-to-end integration", () => {
  it("creates a deposit request from wallet api and credits balance only after admin approval", async () => {
    const user = await createTestUser();

    mockedGetServerSession.mockResolvedValue({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    } as never);

    const createResponse = await createDepositRoute(
      makeJsonRequest("http://localhost/api/wallet", "POST", {
        amount: 25_000_000,
        currency: "SYP",
        method: "syriatel",
        proofUrl: "https://example.com/proof-deposit.png",
        requestNote: "Wallet integration deposit request",
      })
    );

    expect(createResponse.status).toBe(200);

    const createPayload = await createResponse.json();
    expect(createPayload.success).toBe(true);

    const depositRequestId = createPayload.depositRequest.id as string;

    const createdRequest = await db.depositRequest.findUniqueOrThrow({
      where: { id: depositRequestId },
    });

    expect(createdRequest.status).toBe("PENDING");
    expect(createdRequest.amount).toBe(25_000_000);

    const accountBeforeApproval = await db.ledgerAccount.findUniqueOrThrow({
      where: { id: createdRequest.accountId },
    });

    expect(accountBeforeApproval.balance).toBe(0);

    const walletBeforeApproval = await db.wallet.findUnique({
      where: { userId: user.id },
    });

    expect(walletBeforeApproval).toBeNull();

    const approveResponse = await approveDepositRoute(
      makeAdminJsonRequest({ reviewNote: "Approved from wallet integration test" }),
      { params: Promise.resolve({ id: depositRequestId }) } as never
    );

    expect(approveResponse!.status).toBe(200);

    const approvedRequest = await db.depositRequest.findUniqueOrThrow({
      where: { id: depositRequestId },
    });

    expect(approvedRequest.status).toBe("COMPLETED");
    expect(approvedRequest.approvalStage).toBe("FINAL_APPROVED");

    const accountAfterApproval = await db.ledgerAccount.findUniqueOrThrow({
      where: { id: createdRequest.accountId },
    });

    expect(accountAfterApproval.balance).toBe(25_000_000);

    const walletAfterApproval = await db.wallet.findUniqueOrThrow({
      where: { userId: user.id },
    });

    expect(walletAfterApproval.balanceSYP).toBe(25_000_000);
  }, 20000);

  it("creates a payout request from wallet api and debits balance only after admin approval", async () => {
    const user = await createTestUser();
    const account = await createLedgerAccount({
      ownerId: user.id,
      slug: `USER_${user.id}_SYP`,
      balance: 40_000_000,
      currency: "SYP",
    });

    await createWallet(user.id, 40_000_000);

    mockedGetServerSession.mockResolvedValue({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    } as never);

    const createResponse = await createPayoutRoute(
      makeJsonRequest("http://localhost/api/wallet", "PUT", {
        amount: 10_000_000,
        currency: "SYP",
        method: "syriatel",
        destination: "0933123456",
        requestNote: "Wallet integration payout request",
      })
    );

    expect(createResponse.status).toBe(200);

    const createPayload = await createResponse.json();
    expect(createPayload.success).toBe(true);

    const payoutRequestId = createPayload.payoutRequest.id as string;

    const createdRequest = await db.payoutRequest.findUniqueOrThrow({
      where: { id: payoutRequestId },
    });

    expect(createdRequest.status).toBe("PENDING");
    expect(createdRequest.amount).toBe(10_000_000);

    const accountBeforeApproval = await db.ledgerAccount.findUniqueOrThrow({
      where: { id: account.id },
    });

    expect(accountBeforeApproval.balance).toBe(40_000_000);

    const walletBeforeApproval = await db.wallet.findUniqueOrThrow({
      where: { userId: user.id },
    });

    expect(walletBeforeApproval.balanceSYP).toBe(40_000_000);

    const approveResponse = await approvePayoutRoute(
      makeAdminJsonRequest({ reviewNote: "Approved payout from wallet integration test" }),
      { params: Promise.resolve({ id: payoutRequestId }) } as never
    );

    expect(approveResponse!.status).toBe(200);

    const approvedRequest = await db.payoutRequest.findUniqueOrThrow({
      where: { id: payoutRequestId },
    });

    expect(approvedRequest.status).toBe("COMPLETED");
    expect(approvedRequest.approvalStage).toBe("FINAL_APPROVED");

    const accountAfterApproval = await db.ledgerAccount.findUniqueOrThrow({
      where: { id: account.id },
    });

    expect(accountAfterApproval.balance).toBe(30_000_000);

    const walletAfterApproval = await db.wallet.findUniqueOrThrow({
      where: { userId: user.id },
    });

    expect(walletAfterApproval.balanceSYP).toBe(30_000_000);
  }, 20000);

  it("rejects a wallet-created deposit request without changing ledger or wallet balance", async () => {
    const user = await createTestUser();

    mockedGetServerSession.mockResolvedValue({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    } as never);

    const createResponse = await createDepositRoute(
      makeJsonRequest("http://localhost/api/wallet", "POST", {
        amount: 5_000_000,
        currency: "SYP",
        method: "syriatel",
        proofUrl: "https://example.com/reject-deposit.png",
        requestNote: "Deposit that should be rejected",
      })
    );

    expect(createResponse.status).toBe(200);

    const createPayload = await createResponse.json();
    const depositRequestId = createPayload.depositRequest.id as string;

    const createdRequest = await db.depositRequest.findUniqueOrThrow({
      where: { id: depositRequestId },
    });

    const accountBeforeReject = await db.ledgerAccount.findUniqueOrThrow({
      where: { id: createdRequest.accountId },
    });

    expect(accountBeforeReject.balance).toBe(0);

    const rejectResponse = await rejectDepositRoute(
      makeAdminJsonRequest({ reviewNote: "Rejected in wallet integration test" }),
      { params: Promise.resolve({ id: depositRequestId }) } as never
    );

    expect(rejectResponse.status).toBe(200);

    const rejectedRequest = await db.depositRequest.findUniqueOrThrow({
      where: { id: depositRequestId },
    });

    expect(rejectedRequest.status).toBe("REJECTED");

    const accountAfterReject = await db.ledgerAccount.findUniqueOrThrow({
      where: { id: createdRequest.accountId },
    });

    expect(accountAfterReject.balance).toBe(0);

    const walletAfterReject = await db.wallet.findUnique({
      where: { userId: user.id },
    });

    if (walletAfterReject) {
      expect(walletAfterReject.balanceSYP).toBe(0);
    }
  });

  it("rejects a wallet-created payout request without changing ledger or wallet balance", async () => {
    const user = await createTestUser();
    const account = await createLedgerAccount({
      ownerId: user.id,
      slug: `USER_${user.id}_SYP`,
      balance: 15_000_000,
      currency: "SYP",
    });

    await createWallet(user.id, 15_000_000);

    mockedGetServerSession.mockResolvedValue({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    } as never);

    const createResponse = await createPayoutRoute(
      makeJsonRequest("http://localhost/api/wallet", "PUT", {
        amount: 3_000_000,
        currency: "SYP",
        method: "syriatel",
        destination: "0933000000",
        requestNote: "Payout that should be rejected",
      })
    );

    expect(createResponse.status).toBe(200);

    const createPayload = await createResponse.json();
    const payoutRequestId = createPayload.payoutRequest.id as string;

    const accountBeforeReject = await db.ledgerAccount.findUniqueOrThrow({
      where: { id: account.id },
    });

    expect(accountBeforeReject.balance).toBe(15_000_000);

    const rejectResponse = await rejectPayoutRoute(
      makeAdminJsonRequest({ reviewNote: "Rejected payout in wallet integration test" }),
      { params: Promise.resolve({ id: payoutRequestId }) } as never
    );

    expect(rejectResponse.status).toBe(200);

    const rejectedRequest = await db.payoutRequest.findUniqueOrThrow({
      where: { id: payoutRequestId },
    });

    expect(rejectedRequest.status).toBe("REJECTED");
    expect(rejectedRequest.failureReason).toBe("Rejected payout in wallet integration test");

    const accountAfterReject = await db.ledgerAccount.findUniqueOrThrow({
      where: { id: account.id },
    });

    expect(accountAfterReject.balance).toBe(15_000_000);

    const walletAfterReject = await db.wallet.findUniqueOrThrow({
      where: { userId: user.id },
    });

    expect(walletAfterReject.balanceSYP).toBe(15_000_000);
  });

  it("routes a large wallet-created deposit through maker-checker before balance is credited", async () => {
    const user = await createTestUser();

    mockedGetServerSession.mockResolvedValue({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    } as never);

    const createResponse = await createDepositRoute(
      makeJsonRequest("http://localhost/api/wallet", "POST", {
        amount: 50_000_000,
        currency: "SYP",
        method: "syriatel",
        proofUrl: "https://example.com/large-deposit.png",
        requestNote: "Large deposit requiring maker-checker",
      })
    );

    expect(createResponse.status).toBe(200);

    const createPayload = await createResponse.json();
    const depositRequestId = createPayload.depositRequest.id as string;

    const createdRequest = await db.depositRequest.findUniqueOrThrow({
      where: { id: depositRequestId },
    });

    const firstApprovalResponse = await approveDepositRoute(
      makeAdminJsonRequest({ reviewNote: "First review for large deposit" }),
      { params: Promise.resolve({ id: depositRequestId }) } as never
    );

    expect(firstApprovalResponse!.status).toBe(200);

    const stagedRequest = await db.depositRequest.findUniqueOrThrow({
      where: { id: depositRequestId },
    });

    expect(stagedRequest.status).toBe("UNDER_REVIEW");
    expect(stagedRequest.approvalStage).toBe("AWAITING_FINAL_APPROVAL");
    expect(stagedRequest.reviewedById).toBe("finance-admin-1");

    const accountAfterFirstApproval = await db.ledgerAccount.findUniqueOrThrow({
      where: { id: createdRequest.accountId },
    });

    expect(accountAfterFirstApproval.balance).toBe(0);

    mockedRequirePermission.mockResolvedValueOnce({
      ok: true,
      status: 200,
      userId: "finance-admin-2",
    } as never);

    const finalApprovalResponse = await approveDepositRoute(
      makeAdminJsonRequest({ reviewNote: "Second review for large deposit" }),
      { params: Promise.resolve({ id: depositRequestId }) } as never
    );

    expect(finalApprovalResponse!.status).toBe(200);

    const completedRequest = await db.depositRequest.findUniqueOrThrow({
      where: { id: depositRequestId },
    });

    expect(completedRequest.status).toBe("COMPLETED");
    expect(completedRequest.approvalStage).toBe("FINAL_APPROVED");
    expect(completedRequest.reviewedById).toBe("finance-admin-1");
    expect(completedRequest.approvedById).toBe("finance-admin-2");

    const accountAfterFinalApproval = await db.ledgerAccount.findUniqueOrThrow({
      where: { id: createdRequest.accountId },
    });

    expect(accountAfterFinalApproval.balance).toBe(50_000_000);

    const walletAfterFinalApproval = await db.wallet.findUniqueOrThrow({
      where: { userId: user.id },
    });

    expect(walletAfterFinalApproval.balanceSYP).toBe(50_000_000);
  });
});


