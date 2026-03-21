import { NextRequest, NextResponse } from "next/server";

import type { FinanceAuditRow } from "@/app/admin/finance/_lib/types";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

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

function stringifyJson(value: unknown): string {
  if (value == null) {
    return "";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function buildReason(log: {
  action: string;
  beforeJson: unknown;
  afterJson: unknown;
}) {
  const beforeText = stringifyJson(log.beforeJson);
  const afterText = stringifyJson(log.afterJson);

  if (beforeText && afterText) {
    return `Before: ${beforeText} | After: ${afterText}`;
  }

  if (afterText) {
    return afterText;
  }

  if (beforeText) {
    return `Before: ${beforeText}`;
  }

  return log.action;
}

function matchesQuery(row: FinanceAuditRow, query: string) {
  const haystack = [
    row.id,
    row.actor,
    row.action,
    row.reason,
    row.ipAddress ?? "",
    row.entityType,
    row.entityId,
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
    const take = parsePositiveInt(searchParams.get("take"), 50, 200);
    const skip = parsePositiveInt(searchParams.get("skip"), 0, 5000);

    const logs = await db.auditLog.findMany({
      where: {
        entityType: {
          in: ["DepositRequest", "PayoutRequest", "TransferRequest"],
        },
      },
      orderBy: [{ createdAt: "desc" }],
      skip,
      take,
      select: {
        id: true,
        actorRole: true,
        actorId: true,
        action: true,
        entityType: true,
        entityId: true,
        beforeJson: true,
        afterJson: true,
        ip: true,
        createdAt: true,
      },
    });

    const rows: FinanceAuditRow[] = logs.map((log) => ({
      id: log.id,
      actor: log.actorId ? `${log.actorRole}:${log.actorId}` : log.actorRole,
      action: log.action,
      reason: buildReason(log),
      ipAddress: log.ip,
      timestamp: log.createdAt.toISOString(),
      entityType: log.entityType,
      entityId: log.entityId,
    }));

    const filteredRows = query
      ? rows.filter((row) => matchesQuery(row, query))
      : rows;

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
      items: filteredRows,
    });
  } catch (error) {
    console.error("Admin finance audit GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load finance audit trail",
      },
      { status: 500 },
    );
  }
}