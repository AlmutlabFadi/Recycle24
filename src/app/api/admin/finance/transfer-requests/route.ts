import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
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

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("MANAGE_FINANCE");

    if (!auth.ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(request.url);

    const status = parseStatus(searchParams.get("status")) ?? "PENDING";
    const query = parseSearch(searchParams.get("query"));
    const take = parsePositiveInt(searchParams.get("take"), 20, 100);
    const skip = parsePositiveInt(searchParams.get("skip"), 0, 5000);

    const where = {
      ...(status === "ALL" ? {} : { status }),
      ...(query
        ? {
            OR: [
              {
                referenceNote: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
              {
                reviewNote: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
              {
                sender: {
                  is: {
                    name: { contains: query, mode: "insensitive" as const },
                  },
                },
              },
              {
                sender: {
                  is: {
                    phone: { contains: query, mode: "insensitive" as const },
                  },
                },
              },
              {
                receiver: {
                  is: {
                    name: { contains: query, mode: "insensitive" as const },
                  },
                },
              },
              {
                receiver: {
                  is: {
                    phone: { contains: query, mode: "insensitive" as const },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, totalCount, statusGroups] = await Promise.all([
      db.transferRequest.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
        skip,
        take,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          referenceNote: true,
          reviewNote: true,
          reviewedById: true,
          reviewedAt: true,
          completedAt: true,
          failedAt: true,
          createdAt: true,
          updatedAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              isLocked: true,
              lockReason: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              isLocked: true,
              lockReason: true,
            },
          },
        },
      }),
      db.transferRequest.count({ where }),
      db.transferRequest.groupBy({
        where,
        by: ["status"],
        _count: {
          _all: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      filters: {
        status,
        query: query ?? null,
        take,
        skip,
      },
      summary: {
        totalCount,
        byStatus: statusGroups.map((group) => ({
          status: group.status,
          approvalStage: "NONE", // Transfers don't have multi-stage yet
          count: group._count._all,
        })),
      },
      items,
    });
  } catch (error) {
    console.error("Admin transfer requests GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load transfer requests",
      },
      { status: 500 }
    );
  }
}



