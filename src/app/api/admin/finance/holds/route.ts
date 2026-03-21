import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function parseStatus(value: string | null) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();

  return normalized.length > 0 ? normalized : undefined;
}

function parseSearch(value: string | null) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

function mapHoldType(
  referenceType: string | null | undefined,
): "AUCTION_DEPOSIT" | "PAYOUT_RESERVE" | "DISPUTE" | "COMPLIANCE" {
  switch ((referenceType ?? "").toUpperCase()) {
    case "AUCTION":
    case "AUCTION_DEPOSIT":
      return "AUCTION_DEPOSIT";
    case "PAYOUT":
    case "PAYOUT_REQUEST":
      return "PAYOUT_RESERVE";
    case "DISPUTE":
      return "DISPUTE";
    default:
      return "COMPLIANCE";
  }
}

function mapHoldStatus(status: string | null | undefined): "OPEN" | "RELEASED" | "CAPTURED" {
  switch ((status ?? "").toUpperCase()) {
    case "EXECUTED":
    case "CAPTURED":
      return "CAPTURED";
    case "CANCELLED":
    case "RELEASED":
      return "RELEASED";
    default:
      return "OPEN";
  }
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

    const where = {
      ...(status && status !== "ALL" ? { status } : {}),
      ...(query
        ? {
            OR: [
              {
                referenceType: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
              {
                referenceId: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
              {
                account: {
                  is: {
                    slug: {
                      contains: query,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
              {
                account: {
                  is: {
                    ownerId: {
                      contains: query,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, totalCount] = await Promise.all([
      db.ledgerHold.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
        skip,
        take,
        select: {
          id: true,
          accountId: true,
          amount: true,
          status: true,
          referenceType: true,
          referenceId: true,
          expiresAt: true,
          createdAt: true,
          account: {
            select: {
              id: true,
              slug: true,
              currency: true,
              ownerId: true,
            },
          },
        },
      }),
      db.ledgerHold.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      filters: {
        status: status ?? "ALL",
        query: query ?? null,
        take,
        skip,
      },
      summary: {
        totalCount,
      },
      items: items.map((item) => ({
        id: item.id,
        holdType: mapHoldType(item.referenceType),
        accountId: item.accountId,
        accountName: item.account.slug ?? item.accountId,
        accountClass: "INTERNAL" as const,
        accountType: item.account.slug ?? "LEDGER_ACCOUNT",
        amount: item.amount,
        currency: (item.account.currency ?? "SYP") as "SYP" | "USD",
        status: mapHoldStatus(item.status),
        referenceType: item.referenceType ?? "UNKNOWN",
        referenceId: item.referenceId ?? item.id,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt,
      })),
    });
  } catch (error) {
    console.error("Admin finance holds GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load finance holds",
      },
      { status: 500 },
    );
  }
}