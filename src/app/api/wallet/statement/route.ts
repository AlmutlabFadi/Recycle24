import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const currency = searchParams.get("currency") || "SYP";

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid year/month" }, { status: 400 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const accountSlug = `USER_${userId}_${currency}`;
    const account = await db.ledgerAccount.findUnique({
      where: { slug: accountSlug },
      select: { id: true, balance: true },
    });

    if (!account) {
      return NextResponse.json({
        success: true,
        statement: {
          year, month, currency, accountSlug,
          openingBalance: 0,
          closingBalance: 0,
          totalCredits: 0,
          totalDebits: 0,
          entries: [],
          breakdown: {},
        }
      });
    }

    // Fetch journal lines for this account in the given period
    const journalLines = await db.journalLine.findMany({
      where: {
        accountId: account.id,
        entry: {
          postedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      },
      include: {
        entry: {
          select: {
            id: true,
            type: true,
            description: true,
            postedAt: true,
            metadata: true,
          },
        },
      },
      orderBy: {
        entry: { postedAt: "asc" },
      },
    });

    // Calculate opening balance (sum of all entries before this month)
    const openingAgg = await db.journalLine.aggregate({
      where: {
        accountId: account.id,
        entry: {
          postedAt: {
            lt: startDate,
          },
        },
      },
      _sum: { amount: true },
    });
    const openingBalance = openingAgg._sum.amount ?? 0;

    // Compute totals and breakdown
    let totalCredits = 0;
    let totalDebits = 0;
    const breakdown: Record<string, { credit: number; debit: number; count: number }> = {};

    const entries = journalLines.map((line) => {
      const type = line.entry.type || "UNKNOWN";
      if (line.amount > 0) totalCredits += line.amount;
      else totalDebits += Math.abs(line.amount);

      if (!breakdown[type]) {
        breakdown[type] = { credit: 0, debit: 0, count: 0 };
      }
      breakdown[type].count += 1;
      if (line.amount > 0) breakdown[type].credit += line.amount;
      else breakdown[type].debit += Math.abs(line.amount);

      return {
        id: line.id,
        date: line.entry.postedAt,
        type: line.entry.type,
        description: line.entry.description || line.description,
        amount: line.amount,
        metadata: line.entry.metadata,
      };
    });

    const closingBalance = openingBalance + totalCredits - totalDebits;

    // Also fetch active holds
    const activeHolds = await db.ledgerHold.findMany({
      where: {
        accountId: account.id,
        status: "OPEN",
      },
      select: {
        id: true,
        amount: true,
        referenceType: true,
        referenceId: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Safety check for TransferRequest (dynamic access to avoid TS build errors if client generation is lagging)
    const depositRequests = await db.depositRequest.findMany({
      where: { userId, createdAt: { gte: startDate, lt: endDate }, currency },
      select: { id: true, amount: true, status: true, method: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    
    const payoutRequests = await db.payoutRequest.findMany({
      where: { userId, createdAt: { gte: startDate, lt: endDate }, currency },
      select: { id: true, amount: true, status: true, method: true, destination: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    let transferRequestsSent: any[] = [];
    let transferRequestsReceived: any[] = [];

    // @ts-ignore
    if (db.transferRequest) {
      // @ts-ignore
      transferRequestsSent = await db.transferRequest.findMany({
        where: { senderId: userId, createdAt: { gte: startDate, lt: endDate }, currency },
        select: { id: true, amount: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      // @ts-ignore
      transferRequestsReceived = await db.transferRequest.findMany({
        where: { receiverId: userId, createdAt: { gte: startDate, lt: endDate }, currency },
        select: { id: true, amount: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      success: true,
      statement: {
        year,
        month,
        currency,
        accountSlug,
        openingBalance,
        closingBalance,
        totalCredits,
        totalDebits,
        entries,
        breakdown,
        activeHolds,
        depositRequests,
        payoutRequests,
        transferRequestsSent,
        transferRequestsReceived,
      },
    });
  } catch (error) {
    console.error("Monthly statement error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
