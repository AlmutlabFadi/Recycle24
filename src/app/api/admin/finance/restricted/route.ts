import { NextRequest, NextResponse } from "next/server";

import type {
  FinanceAccountClass,
  FinanceCurrencyCode,
  FinanceRestrictionRow,
  FinanceRiskFlag,
} from "@/app/admin/finance/_lib/types";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

type RestrictedUserSummary = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  userType: string;
  role: string;
  status: string;
  isLocked: boolean;
  lockReason: string | null;
  updatedAt: Date;
};

type RestrictedLedgerAccountSummary = {
  id: string;
  ownerId: string | null;
  slug: string;
  currency: string;
  balance: number;
  status: string;
  debtStatus: string;
  lockedByDebt: boolean;
  debtLockReason: string | null;
  updatedAt: Date;
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

function parseStatus(value: string | null): "ACTIVE" | "RELEASED" | "ALL" {
  const normalized = (value ?? "ACTIVE").trim().toUpperCase();

  if (normalized === "ALL") {
    return "ALL";
  }

  if (normalized === "RELEASED") {
    return "RELEASED";
  }

  return "ACTIVE";
}

function normalizeStatus(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

function isRestrictiveUserStatus(status: string) {
  return status.length > 0 && status !== "ACTIVE" && status !== "PENDING";
}

function isRestrictiveLedgerStatus(status: string) {
  return status.length > 0 && status !== "ACTIVE";
}

function mapAccountClass(userType: string | null | undefined, role: string | null | undefined): FinanceAccountClass {
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

  if (value.includes("ADMIN") || value.includes("STAFF") || value.includes("INTERNAL") || value.includes("SYSTEM")) {
    return "INTERNAL";
  }

  return "CUSTOMER";
}

function mapCurrency(value: string | null | undefined): FinanceCurrencyCode {
  return (value ?? "SYP").toUpperCase() === "USD" ? "USD" : "SYP";
}

function buildRestrictionFlags(
  account: RestrictedLedgerAccountSummary,
  user: RestrictedUserSummary | null,
): FinanceRiskFlag[] {
  const appliedAt = new Date(
    Math.max(account.updatedAt.getTime(), user?.updatedAt?.getTime() ?? 0),
  ).toISOString();

  const flags: FinanceRiskFlag[] = [];

  if (user?.isLocked) {
    flags.push({
      id: `${account.id}-user-lock`,
      code: "USER_LOCK",
      description: user.lockReason?.trim() || "User account is locked.",
      severity: "HIGH",
      appliedAt,
    });
  }

  const userStatus = normalizeStatus(user?.status);
  if (isRestrictiveUserStatus(userStatus)) {
    flags.push({
      id: `${account.id}-user-status`,
      code: "USER_STATUS_RESTRICTION",
      description: `User status is ${userStatus}.`,
      severity: userStatus === "BANNED" ? "CRITICAL" : "HIGH",
      appliedAt,
    });
  }

  if (account.lockedByDebt) {
    flags.push({
      id: `${account.id}-debt-lock`,
      code: "DEBT_LOCK",
      description: account.debtLockReason?.trim() || `Account locked by debt rules (${account.debtStatus}).`,
      severity: account.debtStatus === "OVERDUE" ? "CRITICAL" : "HIGH",
      appliedAt,
    });
  }

  const accountStatus = normalizeStatus(account.status);
  if (isRestrictiveLedgerStatus(accountStatus)) {
    flags.push({
      id: `${account.id}-ledger-status`,
      code: "LEDGER_STATUS_RESTRICTION",
      description: `Ledger account status is ${accountStatus}.`,
      severity: "HIGH",
      appliedAt,
    });
  }

  return flags;
}

function buildRestrictionRow(
  account: RestrictedLedgerAccountSummary,
  user: RestrictedUserSummary | null,
): FinanceRestrictionRow | null {
  const userStatus = normalizeStatus(user?.status);
  const accountStatus = normalizeStatus(account.status);

  const relatedFlags = buildRestrictionFlags(account, user);

  let restrictionType: FinanceRestrictionRow["restrictionType"] | null = null;
  let reason = "";
  let appliedAt = account.updatedAt.toISOString();

  if (userStatus === "BANNED") {
    restrictionType = "BLACKLISTED";
    reason = user?.lockReason?.trim() || "User account is banned.";
    appliedAt = user?.updatedAt?.toISOString() ?? appliedAt;
  } else if (user?.isLocked) {
    restrictionType = "FULL_SUSPENSION";
    reason = user.lockReason?.trim() || "User account is locked.";
    appliedAt = user.updatedAt.toISOString();
  } else if (isRestrictiveUserStatus(userStatus)) {
    restrictionType = "FULL_SUSPENSION";
    reason = `User status is ${userStatus}.`;
    appliedAt = user?.updatedAt?.toISOString() ?? appliedAt;
  } else if (account.lockedByDebt) {
    restrictionType = "FROZEN_DEBIT";
    reason = account.debtLockReason?.trim() || `Account locked by debt rules (${account.debtStatus}).`;
    appliedAt = account.updatedAt.toISOString();
  } else if (isRestrictiveLedgerStatus(accountStatus)) {
    restrictionType = "FROZEN_BALANCE";
    reason = `Ledger account status is ${accountStatus}.`;
    appliedAt = account.updatedAt.toISOString();
  }

  if (!restrictionType) {
    return null;
  }

  const accountName =
    user?.name?.trim() ||
    user?.email?.trim() ||
    user?.phone?.trim() ||
    account.slug ||
    account.id;

  return {
    accountId: account.id,
    accountName,
    accountClass: mapAccountClass(user?.userType, user?.role),
    accountType: account.slug || "LEDGER_ACCOUNT",
    restrictionType,
    status: "ACTIVE",
    reason,
    appliedBy: "SYSTEM",
    appliedAt,
    frozenBalance: Math.max(account.balance, 0),
    currency: mapCurrency(account.currency),
    relatedFlags,
  };
}

function matchesQuery(row: FinanceRestrictionRow, query: string) {
  const haystack = [
    row.accountId,
    row.accountName,
    row.accountType,
    row.accountClass,
    row.restrictionType,
    row.status,
    row.reason,
    row.appliedBy,
    ...row.relatedFlags.map((flag) => `${flag.code} ${flag.description}`),
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

    const status = parseStatus(searchParams.get("status"));
    const query = parseSearch(searchParams.get("query"));
    const take = parsePositiveInt(searchParams.get("take"), 20, 100);
    const skip = parsePositiveInt(searchParams.get("skip"), 0, 5000);

    const restrictedUsers = await db.user.findMany({
      where: {
        OR: [{ isLocked: true }, { status: { not: "ACTIVE" } }],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        userType: true,
        role: true,
        status: true,
        isLocked: true,
        lockReason: true,
        updatedAt: true,
      },
    });

    const restrictedUserIds = restrictedUsers.map((user) => user.id);

    const affectedAccounts = await db.ledgerAccount.findMany({
      where: {
        ownerId: { not: null },
        OR: [
          { lockedByDebt: true },
          { status: { not: "ACTIVE" } },
          ...(restrictedUserIds.length > 0 ? [{ ownerId: { in: restrictedUserIds } }] : []),
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
        lockedByDebt: true,
        debtLockReason: true,
        updatedAt: true,
      },
    });

    const ownerIds = affectedAccounts
      .map((account) => account.ownerId)
      .filter((value): value is string => Boolean(value));

    const ownerUsers = ownerIds.length
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
            status: true,
            isLocked: true,
            lockReason: true,
            updatedAt: true,
          },
        })
      : [];

    const userMap = new Map<string, RestrictedUserSummary>(
      ownerUsers.map((user) => [user.id, user]),
    );

    const rows = affectedAccounts
      .map((account) => {
        const user = account.ownerId ? userMap.get(account.ownerId) ?? null : null;
        return buildRestrictionRow(account, user);
      })
      .filter((row): row is FinanceRestrictionRow => Boolean(row));

    const filteredRows = rows.filter((row) => {
      if (status !== "ALL" && row.status !== status) {
        return false;
      }

      if (query && !matchesQuery(row, query)) {
        return false;
      }

      return true;
    });

    const paginatedRows = filteredRows.slice(skip, skip + take);

    return NextResponse.json({
      success: true,
      filters: {
        status,
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
    console.error("Admin finance restricted GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load restricted finance accounts",
      },
      { status: 500 },
    );
  }
}