import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

type SupportRow = {
  totalSupport: unknown;
};

type UserSummary = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  isLocked: boolean;
  lockReason: string | null;
};

export async function GET(_request: NextRequest) {
  try {
    const auth = await requirePermission("MANAGE_FINANCE");

    if (!auth.ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: auth.status }
      );
    }

    // Compatibility treasury snapshot for current admin UI
    let companyWallet = await db.companyWallet.findFirst();

    if (!companyWallet) {
      companyWallet = await db.companyWallet.create({
        data: {},
      });
    }

    // Total government support / waived value from journal metadata
    const supportRows = await db.$queryRaw<SupportRow[]>`
      SELECT COALESCE(SUM((metadata->>'originalAmount')::numeric), 0) AS "totalSupport"
      FROM "JournalLine"
      WHERE COALESCE((metadata->>'isExempt')::boolean, false) = true
    `;

    const totalSupportSYP = Number(supportRows[0]?.totalSupport ?? 0);

    // Total open escrow / holds
    const escrowResult = await db.ledgerHold.aggregate({
      where: {
        status: "OPEN",
      },
      _sum: {
        amount: true,
      },
    });

    const totalEscrowSYP = escrowResult._sum.amount ?? 0;

    // Ledger-backed user account overview
    const ledgerAccounts = await db.ledgerAccount.findMany({
      where: {
        ownerId: {
          not: null,
        },
        currency: "SYP",
      },
      orderBy: [
        {
          balance: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],
      take: 20,
      select: {
        id: true,
        ownerId: true,
        balance: true,
        status: true,
        debtStatus: true,
        lockedByDebt: true,
        debtDueAt: true,
        updatedAt: true,
      },
    });

    const ownerIds = ledgerAccounts
      .map((account) => account.ownerId)
      .filter((value): value is string => Boolean(value));

    const users = ownerIds.length
      ? await db.user.findMany({
          where: {
            id: {
              in: ownerIds,
            },
          },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            isLocked: true,
            lockReason: true,
          },
        })
      : [];

    const userMap = new Map<string, UserSummary>(
      users.map((user) => [
        user.id,
        {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          isLocked: user.isLocked,
          lockReason: user.lockReason,
        },
      ])
    );

    const userWallets = ledgerAccounts.map((account) => {
      const user =
        (account.ownerId ? userMap.get(account.ownerId) : null) ?? null;

      return {
        id: account.id,
        balanceSYP: account.balance,
        balanceUSD: 0,
        debtStatus: account.debtStatus,
        lockedByDebt: account.lockedByDebt,
        debtDueAt: account.debtDueAt,
        user: {
          name: user?.name ?? "Unknown",
          phone: user?.phone ?? "",
          email: user?.email ?? "",
          isLocked: user?.isLocked ?? false,
          lockReason: user?.lockReason ?? null,
        },
      };
    });

    const riskAccountsCount = await db.ledgerAccount.count({
      where: {
        ownerId: {
          not: null,
        },
        OR: [
          {
            balance: {
              lt: 0,
            },
          },
          {
            lockedByDebt: true,
          },
          {
            debtStatus: {
              not: "CLEAR",
            },
          },
        ],
      },
    });

    const pendingDepositRequests = await db.depositRequest.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        amount: true,
        currency: true,
        method: true,
        status: true,
        proofUrl: true,
        requestNote: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    const pendingPayoutRequests = await db.payoutRequest.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        amount: true,
        currency: true,
        method: true,
        destination: true,
        status: true,
        requestNote: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    const activeWaivers = await db.accountWaiverPolicy.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        accountId: true,
        waiveCommissions: true,
        waiveAuctionDeposits: true,
        waiveServiceFees: true,
        reason: true,
        approvedById: true,
        createdAt: true,
        account: {
          select: {
            id: true,
            ownerId: true,
            slug: true,
            balance: true,
            debtStatus: true,
            lockedByDebt: true,
          },
        },
      },
    });

    const overdueAccounts = await db.ledgerAccount.findMany({
      where: {
        ownerId: {
          not: null,
        },
        OR: [
          {
            debtStatus: "OVERDUE",
          },
          {
            lockedByDebt: true,
          },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        ownerId: true,
        slug: true,
        balance: true,
        debtStatus: true,
        debtDueAt: true,
        lockedByDebt: true,
        debtLockReason: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      companyWallet,
      totalSupportSYP,
      totalEscrowSYP,
      riskAccountsCount,
      userWallets,
      pendingDepositRequests,
      pendingPayoutRequests,
      activeWaivers,
      overdueAccounts,
    });
  } catch (error) {
    console.error("Admin finance GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load finance admin data",
      },
      { status: 500 }
    );
  }
}