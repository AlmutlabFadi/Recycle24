import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  normalizeCurrency,
  validateWalletAmount,
} from "@/lib/finance/policy";
import { LedgerEnforcementService } from "@/lib/ledger/enforcement";
import { LedgerPostingService } from "@/lib/ledger/service";
import { Currency, HoldStatus } from "@/lib/ledger/types";
import { enforceInMemoryRateLimit } from "@/lib/security/request-rate-limit";

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const senderId = session.user.id;

    // Strict rate limiting: 3 transfers per minute
    const ip = getClientIp(request);
    const rateLimit = enforceInMemoryRateLimit(`wallet:transfer:${senderId}:${ip}`, 3, 60 * 1000);
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many transfer attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { receiverPhoneOrEmail, idempotencyKey } = body;
    const amount = Number(body.amount);
    const currency = normalizeCurrency(body.currency);

    if (!receiverPhoneOrEmail || !amount || !currency || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid transfer parameters. Receiver, amount, and valid currency are required." },
        { status: 400 }
      );
    }

    // Standard payout policy limits apply loosely to P2P transfers
    try {
      validateWalletAmount(currency, "payout", amount);
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Amount out of policy bounds" }, { status: 400 });
    }

    // Deduplication key
    const safeIdempotencyKey = idempotencyKey || crypto.randomUUID();

    const result = await db.$transaction(async (tx) => {
      // 1. Resolve receiver
      const receiver = await tx.user.findFirst({
        where: {
          OR: [
            { phone: receiverPhoneOrEmail },
            { email: receiverPhoneOrEmail }
          ]
        },
        select: { id: true, name: true, phone: true }
      });

      if (!receiver) {
        throw new Error("RECEIVER_NOT_FOUND");
      }

      if (receiver.id === senderId) {
        throw new Error("SELF_TRANSFER_NOT_ALLOWED");
      }

      // 2. Check Sender Debt Lock
      const senderDebtSnapshot = await LedgerEnforcementService.getDebtSnapshot(senderId);
      if (senderDebtSnapshot.isLocked) {
        throw new Error("SENDER_LOCKED_BY_DEBT");
      }

      // 3. Sender Account Validation
      const senderLedgerDesc = `USER_${senderId}_${currency}`;
      const senderAccount = await tx.ledgerAccount.findUnique({
        where: { slug: senderLedgerDesc }
      });

      if (!senderAccount) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      const activeHolds = await tx.ledgerHold.aggregate({
        where: { accountId: senderAccount.id, status: HoldStatus.OPEN },
        _sum: { amount: true }
      });
      const heldAmount = activeHolds._sum.amount ?? 0;
      const availableBalance = senderAccount.balance - heldAmount;

      if (availableBalance < amount) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // 4. Receiver Account Auto-Creation if missing (handled securely via service inside transaction context)
      // Since LedgerPostingService isn't natively transactional, we mimic getOrCreate logic:
      const receiverLedgerDesc = `USER_${receiver.id}_${currency}`;
      let receiverAccount = await tx.ledgerAccount.findUnique({
        where: { slug: receiverLedgerDesc }
      });
      if (!receiverAccount) {
        receiverAccount = await tx.ledgerAccount.create({
          data: {
            slug: receiverLedgerDesc,
            currency: currency,
            ownerId: receiver.id,
            balance: 0,
            creditLimit: 0,
            debtStatus: "CLEAR",
            lockedByDebt: false
          }
        });
      }

      // 5. Post Journal Entry internally across tx boundary or manually handling
      const journalEntry = await tx.journalEntry.create({
        data: {
          type: "P2P_TRANSFER",
          description: `Internal P2P transfer from ${senderId} to ${receiver.id}`,
          idempotencyKey: safeIdempotencyKey,
          metadata: { referenceId: `P2P-${safeIdempotencyKey}` },
          lines: {
            create: [
              {
                accountId: senderAccount.id,
                amount: -amount,
                description: `Transfer to ${receiver.name || receiver.phone}`
              },
              {
                accountId: receiverAccount.id,
                amount: amount,
                description: `Transfer from user ID: ${senderId.slice(0, 8)}...`
              }
            ]
          }
        },
        include: { lines: true }
      });

      // Update Ledger Balances atomically
      await tx.ledgerAccount.update({
        where: { id: senderAccount.id },
        data: { balance: { decrement: amount } }
      });

      await tx.ledgerAccount.update({
        where: { id: receiverAccount.id },
        data: { balance: { increment: amount } }
      });

      // Update Quick Wallets (for quick dashboard rendering UI)
      const currencyField = currency === Currency.SYP ? "balanceSYP" : "balanceUSD";
      await tx.wallet.updateMany({
        where: { userId: senderId },
        data: {
           [currencyField]: { decrement: amount }
        }
      });
      
      const receiverWallet = await tx.wallet.findUnique({ where: { userId: receiver.id }});
      if (!receiverWallet) {
         await tx.wallet.create({
           data: {
             userId: receiver.id,
             balanceSYP: currency === Currency.SYP ? amount : 0,
             balanceUSD: currency === Currency.USD ? amount : 0
           }
         });
      } else {
         await tx.wallet.update({
          where: { id: receiverWallet.id },
          data: {
            [currencyField]: { increment: amount }
          }
        });
      }

      return {
        transactionId: journalEntry.id,
        receiverName: receiver.name || receiver.phone
      };
    });

    return NextResponse.json({
      success: true,
      message: "Transfer completed successfully",
      data: result
    });

  } catch (error: any) {
    if (error.code === 'P2002') { // Prisma unique constraint violation for idempotency key
      return NextResponse.json({ error: "Duplicate transfer request detected" }, { status: 409 });
    }

    const message = error.message;
    switch (message) {
      case "RECEIVER_NOT_FOUND":
        return NextResponse.json({ error: "No user found with that phone or email number." }, { status: 404 });
      case "SELF_TRANSFER_NOT_ALLOWED":
        return NextResponse.json({ error: "You cannot transfer money to yourself." }, { status: 400 });
      case "INSUFFICIENT_FUNDS":
        return NextResponse.json({ error: "Insufficient available balance for this transfer." }, { status: 400 });
      case "SENDER_LOCKED_BY_DEBT":
        return NextResponse.json({ error: "Your account is locked due to outstanding debts." }, { status: 423 });
      default:
        console.error("Internal transfer error:", error);
        return NextResponse.json({ error: "An unexpected error occurred processing your transfer." }, { status: 500 });
    }
  }
}
