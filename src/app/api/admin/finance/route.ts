import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

type SupportRow = {
  totalSupport: unknown;
};

function getStartOfTodayUtc() {
  const now = new Date();

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function GET(_request: NextRequest) {
  try {
    const auth = await requirePermission("MANAGE_FINANCE");

    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
    }

    let companyWallet = await db.companyWallet.findFirst();

    if (!companyWallet) {
      companyWallet = await db.companyWallet.create({
        data: {},
      });
    }

    const startOfTodayUtc = getStartOfTodayUtc();

    const restrictedUserIds = await db.user.findMany({
      where: {
        OR: [{ isLocked: true }, { status: { not: "ACTIVE" } }],
      },
      select: {
        id: true,
      },
    });

    const restrictedUserIdList = restrictedUserIds.map((user) => user.id);

    const [supportRows, totalEscrow, auctionEscrow, restrictedAccountsCount, overdueDebtCount] =
      await Promise.all([
        db.$queryRaw<SupportRow[]>`
          SELECT COALESCE(SUM((metadata->>'originalAmount')::numeric), 0) AS "totalSupport"
          FROM "JournalLine"
          WHERE COALESCE((metadata->>'isExempt')::boolean, false) = true
        `,
        db.ledgerHold.aggregate({
          where: {
            status: "OPEN",
          },
          _sum: {
            amount: true,
          },
        }),
        db.ledgerHold.aggregate({
          where: {
            status: "OPEN",
            OR: [{ referenceType: "AUCTION" }, { referenceType: "AUCTION_DEPOSIT" }],
          },
          _sum: {
            amount: true,
          },
        }),
        db.ledgerAccount.count({
          where: {
            ownerId: { not: null },
            OR: [
              { lockedByDebt: true },
              { status: { not: "ACTIVE" } },
              ...(restrictedUserIdList.length > 0 ? [{ ownerId: { in: restrictedUserIdList } }] : []),
            ],
          },
        }),
        db.ledgerAccount.count({
          where: {
            ownerId: { not: null },
            debtStatus: "OVERDUE",
          },
        }),
      ]);

    const totalSupportSYP = Number(supportRows[0]?.totalSupport ?? 0);
    const totalEscrowSYP = totalEscrow._sum.amount ?? 0;
    const auctionDepositsHeld = auctionEscrow._sum.amount ?? 0;

    const [
      pendingFirstReview,
      awaitingFinalApproval,
      processingRequests,
      failedRequestsToday,
      outstandingDebtAccounts,
      riskAccountsCount,
      pendingDepositRequests,
      pendingPayoutRequests,
      pendingTransferRequests,
      activeWaivers,
      overdueAccounts,
    ] = await Promise.all([
      Promise.all([
        db.depositRequest.count({
          where: {
            OR: [
              { approvalStage: "AWAITING_FIRST_REVIEW" },
              { status: "PENDING", approvalStage: "NONE" },
            ],
          },
        }),
        db.payoutRequest.count({
          where: {
            OR: [
              { approvalStage: "AWAITING_FIRST_REVIEW" },
              { status: "PENDING", approvalStage: "NONE" },
            ],
          },
        }),
        db.transferRequest.count({
          where: {
            status: "PENDING",
          },
        }),
      ]).then(([deposits, payouts, transfers]) => deposits + payouts + transfers),

      Promise.all([
        db.depositRequest.count({
          where: {
            approvalStage: "AWAITING_FINAL_APPROVAL",
          },
        }),
        db.payoutRequest.count({
          where: {
            approvalStage: "AWAITING_FINAL_APPROVAL",
          },
        }),
      ]).then(([deposits, payouts]) => deposits + payouts),

      Promise.all([
        db.depositRequest.count({
          where: {
            status: "PROCESSING",
          },
        }),
        db.payoutRequest.count({
          where: {
            status: "PROCESSING",
          },
        }),
        db.transferRequest.count({
          where: {
            status: "PROCESSING",
          },
        }),
      ]).then(([deposits, payouts, transfers]) => deposits + payouts + transfers),

      Promise.all([
        db.depositRequest.count({
          where: {
            createdAt: { gte: startOfTodayUtc },
            status: { in: ["FAILED", "REJECTED"] },
          },
        }),
        db.payoutRequest.count({
          where: {
            createdAt: { gte: startOfTodayUtc },
            status: { in: ["FAILED", "REJECTED"] },
          },
        }),
        db.transferRequest.count({
          where: {
            createdAt: { gte: startOfTodayUtc },
            status: { in: ["FAILED", "REJECTED"] },
          },
        }),
      ]).then(([deposits, payouts, transfers]) => deposits + payouts + transfers),

      db.ledgerAccount.count({
        where: {
          ownerId: { not: null },
          OR: [
            { debtStatus: { not: "CLEAR" } },
            { lockedByDebt: true },
            { balance: { lt: 0 } },
          ],
        },
      }),

      db.ledgerAccount.count({
        where: {
          ownerId: { not: null },
          OR: [
            { balance: { lt: 0 } },
            { lockedByDebt: true },
            { debtStatus: { not: "CLEAR" } },
            ...(restrictedUserIdList.length > 0 ? [{ ownerId: { in: restrictedUserIdList } }] : []),
          ],
        },
      }),

      db.depositRequest.findMany({
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
      }),

      db.payoutRequest.findMany({
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
      }),

      db.transferRequest.findMany({
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
          status: true,
          referenceNote: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      }),

      db.accountWaiverPolicy.findMany({
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
      }),

      db.ledgerAccount.findMany({
        where: {
          ownerId: { not: null },
          OR: [{ debtStatus: "OVERDUE" }, { lockedByDebt: true }],
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
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      companyWallet,
      totalSupportSYP,
      totalEscrowSYP,
      riskAccountsCount,
      pendingDepositRequests,
      pendingPayoutRequests,
      pendingTransferRequests,
      activeWaivers,
      overdueAccounts,
      summary: {
        pendingFirstReview,
        awaitingFinalApproval,
        processingRequests,
        failedRequestsToday,
        frozenAccounts: restrictedAccountsCount,
        totalHeldFunds: totalEscrowSYP,
        auctionDepositsHeld,
        outstandingDebts: outstandingDebtAccounts,
        overdueDebts: overdueDebtCount,
        highRiskAccounts: riskAccountsCount,
      },
    });
  } catch (error) {
    console.error("Admin finance GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load finance admin data",
      },
      { status: 500 },
    );
  }
}



