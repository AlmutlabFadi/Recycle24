import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { LedgerPostingService } from "@/lib/ledger/service";
import { TransactionType } from "@/lib/ledger/types";

const FIXED_EXCHANGE_RATE = 15000; // 1 USD = 15000 SYP

type ExchangeBody = {
  fromCurrency?: string;
  amount?: number | string;
};

function isRetryablePrismaSerializationError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: unknown };
  return candidate.code === "P2034";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ExchangeBody;
    const fromCurrency = typeof body.fromCurrency === "string"
      ? body.fromCurrency.toUpperCase()
      : "";
    const numericAmount = Number(body.amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (fromCurrency !== "SYP" && fromCurrency !== "USD") {
      return NextResponse.json(
        { error: "Invalid currency direction" },
        { status: 400 }
      );
    }

    const toCurrency = fromCurrency === "SYP" ? "USD" : "SYP";
    const targetAmount =
      fromCurrency === "SYP"
        ? numericAmount / FIXED_EXCHANGE_RATE
        : numericAmount * FIXED_EXCHANGE_RATE;

    const userId = session.user.id;
    const userFromSlug = `USER_${userId}_${fromCurrency}`;
    const userToSlug = `USER_${userId}_${toCurrency}`;
    const systemFromSlug = `SYSTEM_EXCHANGE_${fromCurrency}`;
    const systemToSlug = `SYSTEM_EXCHANGE_${toCurrency}`;

    const fromAccount = await LedgerPostingService.findAccountBySlug(userFromSlug);

    if (!fromAccount) {
      return NextResponse.json(
        { error: "Sender account not found" },
        { status: 404 }
      );
    }

    const activeHolds = await db.ledgerHold.aggregate({
      where: {
        accountId: fromAccount.id,
        status: "OPEN",
      },
      _sum: {
        amount: true,
      },
    });

    const heldAmount = activeHolds._sum.amount || 0;
    const availableBalance = fromAccount.balance - heldAmount;

    if (availableBalance < numericAmount) {
      return NextResponse.json(
        {
          error: `Insufficient ${fromCurrency} balance. Available: ${availableBalance.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    const idempotencyBase = `${userId}_${Date.now()}`;
    let attempt = 0;

    while (true) {
      try {
        await db.$transaction(
          async (tx) => {
            await LedgerPostingService.postEntryInTransaction(tx, {
              type: TransactionType.EXCHANGE,
              description: `Currency exchange from ${fromCurrency} to ${toCurrency}`,
              idempotencyKey: `EXC_OUT_${idempotencyBase}_${attempt}`,
              lines: [
                {
                  accountSlug: userFromSlug,
                  amount: -numericAmount,
                  description: "Exchange deduction",
                },
                {
                  accountSlug: systemFromSlug,
                  amount: numericAmount,
                  description: "Exchange system credit",
                },
              ],
              metadata: {
                exchangeRate: FIXED_EXCHANGE_RATE,
                targetCurrency: toCurrency,
              },
            });

            await LedgerPostingService.postEntryInTransaction(tx, {
              type: TransactionType.EXCHANGE,
              description: `Currency exchange from ${fromCurrency} to ${toCurrency}`,
              idempotencyKey: `EXC_IN_${idempotencyBase}_${attempt}`,
              lines: [
                {
                  accountSlug: systemToSlug,
                  amount: -targetAmount,
                  description: "Exchange system deduction",
                },
                {
                  accountSlug: userToSlug,
                  amount: targetAmount,
                  description: "Exchange credit",
                },
              ],
              metadata: {
                exchangeRate: FIXED_EXCHANGE_RATE,
                sourceCurrency: fromCurrency,
              },
            });
          },
          {
            isolationLevel: "Serializable",
          }
        );

        break;
      } catch (error: unknown) {
        attempt += 1;

        if (isRetryablePrismaSerializationError(error) && attempt < 3) {
          continue;
        }

        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      exchangeRate: FIXED_EXCHANGE_RATE,
      sourceCurrency: fromCurrency,
      targetCurrency: toCurrency,
      sourceAmount: numericAmount,
      targetAmount,
    });
  } catch (error) {
    console.error("Exchange API error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}