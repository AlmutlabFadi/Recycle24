import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parseLimit(value: string | null): number {
  const n = Number(value ?? DEFAULT_LIMIT);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

export async function GET(req: NextRequest) {
  const startedAt = Date.now();

  try {
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const kind = searchParams.get("kind");
    const cursor = searchParams.get("cursor");
    const limit = parseLimit(searchParams.get("limit"));

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (kind !== "trader" && kind !== "driver") {
      return NextResponse.json(
        { error: "kind must be trader or driver" },
        { status: 400 }
      );
    }

    if (kind === "trader") {
      const trader = await db.trader.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!trader) {
        return NextResponse.json(
          { error: "Trader profile not found" },
          { status: 404 }
        );
      }

      const rows = await db.traderDocument.findMany({
        where: { traderId: trader.id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
      });

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

      const totalMs = Date.now() - startedAt;
      console.log(
        JSON.stringify({
          type: "perf",
          label: "api.verification.documents.get",
          ok: true,
          kind,
          totalMs,
          count: items.length,
          hasMore,
        })
      );

      return NextResponse.json({
        ok: true,
        kind,
        items,
        pageInfo: {
          hasMore,
          nextCursor,
          limit,
        },
      });
    }

    const driver = await db.driver.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!driver) {
      return NextResponse.json(
        { error: "Driver profile not found" },
        { status: 404 }
      );
    }

    const rows = await db.driverDocument.findMany({
      where: { driverId: driver.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

    const totalMs = Date.now() - startedAt;
    console.log(
      JSON.stringify({
        type: "perf",
        label: "api.verification.documents.get",
        ok: true,
        kind,
        totalMs,
        count: items.length,
        hasMore,
      })
    );

    return NextResponse.json({
      ok: true,
      kind,
      items,
      pageInfo: {
        hasMore,
        nextCursor,
        limit,
      },
    });
  } catch (error) {
    const totalMs = Date.now() - startedAt;
    console.error(
      JSON.stringify({
        type: "perf",
        label: "api.verification.documents.get",
        ok: false,
        totalMs,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}