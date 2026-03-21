import { NextRequest, NextResponse } from "next/server";

import type {
  FinanceAccountClass,
  FinanceAgingBucket,
  FinanceCurrencyCode,
  FinanceDebtRow,
  FinanceDebtType,
} from "@/app/admin/finance/_lib/types";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

type DebtUserSummary = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  userType: string;
  role: string;
};

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function parseSearch(value: string | null) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

function mapAccountClass(
  userType: string | null | undefined,
  role: string | null | undefined,
): FinanceAccountClass {
  const value = `${userType ?? ""} ${role ?? ""}`.toUpperCase();

  if (value.includes("TRADER") || value.includes("MERCHANT")) {
    return "MERCHANT";
  }

  if (value.includes("DRIVER")) {
    return "DRIVER";
  }

  if (value.includes("GOVERNMENT") || value.includes("GOV")) {
    return "GOVERNMENT";
  }

  if (
    value.includes("ADMIN") ||
    value.includes("STAFF") ||
    value.includes("INTERNAL") ||
    value.includes("SYSTEM")
  ) {
    return "INTERNAL";
  }

  return "CUSTOMER";
}

function mapCurrency(value: string | null | undefined): FinanceCurrencyCode {
  return (value ?? "SYP").toUpperCase() === "USD" ? "USD" : "SYP";
}

function inferDebtType(slug: string | null | undefined): FinanceDebtType {
  const value = (slug ?? "").toLowerCase();

  if (value.includes("subscription")) {
    return "SUBSCRIPTION";
  }

  if (
    value.includes("logistic") ||
    value.includes("delivery") ||
    value.includes("transport")
  ) {
    return "LOGISTICS";
  }

  if (value.includes("penalty") || value.includes("fine")) {
    return "PENALTY";
  }

  return "COMMISSION";
}

function getAgingBucket(dueDate: Date, now: Date): FinanceAgingBucket {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / msPerDay);

  if (diffDays < 0) {
    return "NOT_DUE";
  }

  if (diffDays <= 7) {
    return "0-7_DAYS";
  }

  if (diffDays <= 30) {
    return "8-30_DAYS";
  }

  return "30+_DAYS";
}

function getDebtStatus(
  debtStatus: string,
  outstanding: number,
  dueDate: Date,
  now: Date,
): FinanceDebtRow["status"] {
  if (outstanding <= 0) {
    return "PAID";
  }

  if (debtStatus === "OVERDUE" || dueDate.getTime() < now.getTime()) {
    return "OVERDUE";
  }

  return "PENDING";
}

function matchesQuery(row: FinanceDebtRow, query: string) {
  const haystack = [
    row.id,
    row.accountId,
    row.accountName,
    row.accountClass,
    row.accountType,
    row.debtType,
    row.status,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("MANAGE_FINANCE");

    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);

    const query = parseSearch(searchParams.get("query"));
    const take = parsePositiveInt(searchParams.get("take"), 20, 100);
    const skip = parsePositiveInt(searchParams.get("skip"), 0, 5000);

    const accounts = await db.ledgerAccount.findMany({
      where: {
        ownerId: { not: null },
        OR: [
          { debtStatus: { not: "CLEAR" } },
          { lockedByDebt: true },
          { balance: { lt: 0 } },
        ],
      },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        ownerId: true,
        slug: true,
        currency: true,
        balance: true,
        status: true,
        debtStatus: true,
        debtDueAt: true,
        lockedByDebt: true,
        debtLockReason: true,
        creditLimit: true,
        updatedAt: true,
        waiverPolicies: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            waiveCommissions: true,
            waiveAuctionDeposits: true,
            waiveServiceFees: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });

    const ownerIds = accounts
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
            userType: true,
            role: true,
          },
        })
      : [];

    const userMap = new Map<string, DebtUserSummary>(users.map((user) => [user.id, user]));

    const now = new Date();

    const rows: FinanceDebtRow[] = accounts.map((account) => {
      const user = account.ownerId ? userMap.get(account.ownerId) ?? null : null;
      const dueDate = account.debtDueAt ?? account.updatedAt;
      const rawOutstanding = account.balance < 0 ? Math.abs(account.balance) : 0;
      const outstanding =
        account.debtStatus !== "CLEAR" || account.lockedByDebt
          ? Math.max(rawOutstanding, 0.01)
          : rawOutstanding;

      const amount = outstanding;
      const waiverApplied = account.waiverPolicies.length > 0;

      const idSuffix =
        account.debtStatus === "OVERDUE"
          ? "overdue"
          : account.lockedByDebt
            ? "locked"
            : "open";

      return {
        id: `${account.id}:${idSuffix}`,
        accountId: account.id,
        accountName:
          user?.name?.trim() ||
          user?.email?.trim() ||
          user?.phone?.trim() ||
          account.slug ||
          account.id,
        accountClass: mapAccountClass(user?.userType, user?.role),
        accountType: account.slug || "LEDGER_ACCOUNT",
        debtType: inferDebtType(account.slug),
        amount,
        currency: mapCurrency(account.currency),
        outstanding,
        dueDate: dueDate.toISOString(),
        agingBucket: getAgingBucket(dueDate, now),
        status: getDebtStatus(account.debtStatus, outstanding, dueDate, now),
        waiverApplied,
        lastActionAt: account.updatedAt.toISOString(),
      };
    });

    const filteredRows = rows
      .filter((row) => row.outstanding > 0)
      .filter((row) => (query ? matchesQuery(row, query) : true));

    const paginatedRows = filteredRows.slice(skip, skip + take);

    return NextResponse.json({
      success: true,
      filters: {
        query: query ?? null,
        take,
        skip,
      },
      summary: {
        totalCount: filteredRows.length,
      },
      items: paginatedRows,
    });
  } catch (error) {
    console.error("Admin finance debts GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load finance debts",
      },
      { status: 500 },
    );
  }
}