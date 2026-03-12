import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface SessionUser {
  id: string;
  role?: string;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? `${DEFAULT_LIMIT}`, 10);

  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return DEFAULT_LIMIT;
  }

  if (parsed < 1) return 1;
  if (parsed > MAX_LIMIT) return MAX_LIMIT;

  return parsed;
}

function normalizeFilter(value: string | null): string {
  return (value ?? "all").trim().toLowerCase();
}

function mapFilterToEntryTypes(filter: string): string[] | null {
  switch (filter) {
    case "all":
      return null;

    case "deposit":
      return ["WALLET_DEPOSIT"];

    case "withdrawal":
      return ["WALLET_WITHDRAWAL"];

    case "payment":
      return [
        "AUCTION_JOIN_DEPOSIT",
        "AUCTION_JOIN_FEE",
        "AUCTION_WIN_PAYMENT",
        "DEAL_PAYMENT",
        "FEE_COLLECTION",
        "PLATFORM_COMMISSION",
      ];

    case "refund":
      return ["AUCTION_REFUND", "REWARD_PAYMENT"];

    default:
      return [filter.toUpperCase()];
  }
}

function getStringFromJsonRecord(
  value: Prisma.JsonValue | null | undefined,
  key: string
): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, Prisma.JsonValue>;
  const field = record[key];

  return typeof field === "string" && field.trim().length > 0 ? field : null;
}

function mapEntryTypeToUiType(
  entryType: string
): "DEPOSIT" | "WITHDRAWAL" | "PAYMENT" | "REFUND" {
  switch (entryType) {
    case "WALLET_DEPOSIT":
      return "DEPOSIT";

    case "WALLET_WITHDRAWAL":
      return "WITHDRAWAL";

    case "AUCTION_REFUND":
    case "REWARD_PAYMENT":
      return "REFUND";

    default:
      return "PAYMENT";
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as SessionUser;
    const sessionUserId = sessionUser.id;
    const sessionUserRole = (sessionUser.role ?? "").toUpperCase();

    const { searchParams } = new URL(request.url);

    const requestedUserId = searchParams.get("userId")?.trim() || null;
    const filter = normalizeFilter(searchParams.get("type"));
    const limit = parseLimit(searchParams.get("limit"));
    const cursor = searchParams.get("cursor")?.trim() || null;

    const isPrivileged =
      sessionUserRole === "ADMIN" || sessionUserRole === "SUPPORT";

    const targetUserId =
      isPrivileged && requestedUserId ? requestedUserId : sessionUserId;

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (requestedUserId && requestedUserId !== sessionUserId && !isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const entryTypes = mapFilterToEntryTypes(filter);
    const accountSlug = `USER_${targetUserId}_SYP`;

    const ledgerAccount = await db.ledgerAccount.findUnique({
      where: { slug: accountSlug },
      select: {
        id: true,
        ownerId: true,
        slug: true,
        currency: true,
        balance: true,
        metadata: true,
        status: true,
        debtStartedAt: true,
        creditLimit: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!ledgerAccount) {
      return NextResponse.json({
        success: true,
        account: null,
        transactions: [],
        total: 0,
        nextCursor: null,
      });
    }

    const where: Prisma.JournalLineWhereInput = {
      accountId: ledgerAccount.id,
    };

    if (entryTypes && entryTypes.length > 0) {
      where.entry = {
        is: {
          type: {
            in: entryTypes,
          },
        },
      };
    }

    if (cursor) {
      where.id = {
        lt: cursor,
      };
    }

    const lines = await db.journalLine.findMany({
      where,
      include: {
        entry: {
          select: {
            id: true,
            type: true,
            description: true,
            metadata: true,
            postedAt: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    const hasMore = lines.length > limit;
    const pageLines = hasMore ? lines.slice(0, limit) : lines;

    const countWhere: Prisma.JournalLineWhereInput = {
      accountId: ledgerAccount.id,
    };

    if (entryTypes && entryTypes.length > 0) {
      countWhere.entry = {
        is: {
          type: {
            in: entryTypes,
          },
        },
      };
    }

    const total = await db.journalLine.count({
      where: countWhere,
    });

    const transactions = pageLines.map((line) => {
      const referenceType =
        getStringFromJsonRecord(line.metadata, "referenceType") ??
        getStringFromJsonRecord(line.entry.metadata, "referenceType");

      const referenceId =
        getStringFromJsonRecord(line.metadata, "referenceId") ??
        getStringFromJsonRecord(line.entry.metadata, "referenceId");

      return {
        id: line.id,
        type: mapEntryTypeToUiType(line.entry.type),
        rawType: line.entry.type,
        status: "COMPLETED",
        direction: line.amount >= 0 ? "CREDIT" : "DEBIT",
        amount: Math.abs(line.amount),
        signedAmount: line.amount,
        currency: ledgerAccount.currency,
        description: line.description ?? line.entry.description ?? null,
        referenceType,
        referenceId,
        entryId: line.entryId,
        createdAt: line.createdAt,
        postedAt: line.entry.postedAt,
      };
    });

    const nextCursor =
      hasMore && pageLines.length > 0
        ? pageLines[pageLines.length - 1].id
        : null;

    return NextResponse.json({
      success: true,
      account: ledgerAccount,
      transactions,
      total,
      nextCursor,
    });
  } catch (error) {
    console.error("Wallet transactions error:", error);

    return NextResponse.json(
      { error: "Failed to fetch wallet transactions" },
      { status: 500 }
    );
  }
}