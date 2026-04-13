import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  normalizeCurrency,
  validateWalletAmount,
} from "@/lib/finance/policy";
import { evaluateApproval } from "@/app/admin/finance/_lib/policy-engine";
import { LedgerEnforcementService } from "@/lib/ledger/enforcement";
import { LedgerPostingService } from "@/lib/ledger/service";
import { Currency, HoldStatus, TransactionType } from "@/lib/ledger/types";
import {
  buildFinancialOTPReference,
  SecurityOTPService,
} from "@/lib/security/otp";
import { enforceInMemoryRateLimit } from "@/lib/security/request-rate-limit";
import { buildWalletAddressPair } from "@/lib/wallet/address";

type TransferReceiver = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
};

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function buildTransferOtpReference(params: {
  senderId: string;
  receiverLocator: string;
  amount: number;
  currency: string;
}) {
  return buildFinancialOTPReference({
    userId: params.senderId,
    actionType: "TRANSFER",
    amount: params.amount,
    currency: params.currency,
    target: params.receiverLocator,
    note: null,
  });
}

function isWalletAddress(value: string): boolean {
  return /^R24-(SYP|USD)-\d{4}-\d{4}-\d{4}$/i.test(value.trim());
}

async function findReceiverByLocator(params: {
  tx: typeof db;
  currency: string;
  receiverLocator: string;
}): Promise<TransferReceiver | null> {
  const { tx, currency, receiverLocator } = params;

  if (isWalletAddress(receiverLocator)) {
    const normalizedWalletId = receiverLocator.trim().toUpperCase();

    const wallet =
      currency === "SYP"
        ? await tx.wallet.findFirst({
            where: { walletAddressSYP: normalizedWalletId },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true,
                },
              },
            },
          })
        : await tx.wallet.findFirst({
            where: { walletAddressUSD: normalizedWalletId },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true,
                },
              },
            },
          });

    return wallet?.user ?? null;
  }

  return tx.user.findFirst({
    where: {
      OR: [{ phone: receiverLocator }, { email: receiverLocator }],
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const senderId = session.user.id;
    const ip = getClientIp(request);

    const rateLimit = enforceInMemoryRateLimit(
      `wallet:transfer:${senderId}:${ip}`,
      3,
      60 * 1000
    );

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many transfer attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const receiverWalletIdRaw = body.receiverWalletId;
    const receiverPhoneOrEmailRaw = body.receiverPhoneOrEmail;
    const receiverLocator = String(
      body.receiverWalletId ?? body.receiverPhoneOrEmail ?? ""
    ).trim();
    const otpCode = body.otpCode ? String(body.otpCode).trim() : "";
    const amount = Number(body.amount);
    const currency = normalizeCurrency(body.currency);

    console.log("wallet.transfer.request", {
      senderId,
      receiverWalletIdRaw,
      receiverPhoneOrEmailRaw,
      receiverLocator,
      normalizedReceiverLocator: receiverLocator.trim().toUpperCase(),
      isWalletAddress: isWalletAddress(receiverLocator),
      currency,
      amount,
      hasOtp: Boolean(otpCode),
    });

    if (
      !receiverLocator ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !currency
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid transfer parameters. Receiver, amount, and valid currency are required.",
        },
        { status: 400 }
      );
    }

    const otpReference = buildTransferOtpReference({
      senderId,
      receiverLocator,
      amount,
      currency,
    });

    if (!otpCode) {
      await SecurityOTPService.generateOTP(senderId, "TRANSFER", otpReference, {
        amount,
        currency,
        target: receiverLocator,
      });

      return NextResponse.json({
        requiresOTP: true,
        message:
          "يرجى إدخال رمز التحقق (OTP) المرسل إلى بريدك الإلكتروني. الرمز صالح لمدة 120 ثانية.",
        expiresIn: 120,
      });
    }

    const isValidOTP = await SecurityOTPService.verifyOTP(
      senderId,
      "TRANSFER",
      otpCode,
      otpReference
    );

    if (!isValidOTP) {
      return NextResponse.json(
        {
          error:
            "رمز التحقق غير صحيح أو منتهي الصلاحية أو لا يخص هذه العملية.",
        },
        { status: 400 }
      );
    }

    try {
      validateWalletAmount(currency, "payout", amount);
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Amount out of policy bounds" },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const receiver = await findReceiverByLocator({
        tx: tx as unknown as typeof db,
        currency,
        receiverLocator,
      });

      console.log("wallet.transfer.lookup.result", {
        currency,
        receiverLocator,
        normalizedReceiverLocator: receiverLocator.trim().toUpperCase(),
        receiverFound: Boolean(receiver),
        receiverId: receiver?.id ?? null,
      });

      if (!receiver) {
        throw new Error("RECEIVER_NOT_FOUND");
      }

      if (receiver.id === senderId) {
        throw new Error("SELF_TRANSFER_NOT_ALLOWED");
      }

      const senderDebtSnapshot =
        await LedgerEnforcementService.getDebtSnapshot(senderId);

      if (senderDebtSnapshot.isLocked) {
        throw new Error("SENDER_LOCKED_BY_DEBT");
      }

      const senderLedgerSlug = `USER_${senderId}_${currency}`;
      const senderAccount = await tx.ledgerAccount.findUnique({
        where: { slug: senderLedgerSlug },
      });

      if (!senderAccount) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      const activeHolds = await tx.ledgerHold.aggregate({
        where: {
          accountId: senderAccount.id,
          status: HoldStatus.OPEN,
        },
        _sum: { amount: true },
      });

      const heldAmount = activeHolds._sum.amount ?? 0;
      const availableBalance = senderAccount.balance - heldAmount;

      if (availableBalance < amount) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      const receiverLedgerSlug = `USER_${receiver.id}_${currency}`;
      let receiverAccount = await tx.ledgerAccount.findUnique({
        where: { slug: receiverLedgerSlug },
      });

      if (!receiverAccount) {
        receiverAccount = await tx.ledgerAccount.create({
          data: {
            slug: receiverLedgerSlug,
            currency,
            ownerId: receiver.id,
            balance: 0,
            creditLimit: 0,
            debtStatus: "CLEAR",
            lockedByDebt: false,
          },
        });
      }

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last24hRequests = await tx.transferRequest.findMany({
        where: {
          senderId,
          createdAt: { gte: oneDayAgo },
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      });

      let activePenaltyUntil = 0;
      let validRequests: number[] = [];

      for (const req of last24hRequests) {
        const timestamp = req.createdAt.getTime();

        if (timestamp <= activePenaltyUntil) {
          continue;
        }

        validRequests = validRequests.filter(
          (existingTimestamp) =>
            timestamp - existingTimestamp <= 24 * 60 * 60 * 1000
        );
        validRequests.push(timestamp);

        if (validRequests.length >= 3) {
          activePenaltyUntil = timestamp + 4 * 60 * 60 * 1000;
          validRequests = [];
        }
      }

      const now = Date.now();
      let velocityTriggered = false;

      if (now <= activePenaltyUntil) {
        velocityTriggered = true;
      } else {
        validRequests = validRequests.filter(
          (existingTimestamp) => now - existingTimestamp <= 24 * 60 * 60 * 1000
        );
        validRequests.push(now);

        if (validRequests.length >= 3) {
          velocityTriggered = true;
        }
      }

      const policy = evaluateApproval({
        type: "TRANSFER",
        amount,
        currency,
        userId: senderId,
        velocityTriggered,
      });

      if (!policy.requiresFirstApproval) {
        const transferReq = await tx.transferRequest.create({
          data: {
            senderId,
            receiverId: receiver.id,
            senderAccountId: senderAccount.id,
            receiverAccountId: receiverAccount.id,
            amount,
            currency,
            status: "COMPLETED",
            referenceNote: `P2P Transfer to ${
              receiver.phone || receiver.email || receiver.id
            }`,
            completedAt: new Date(),
          },
        });

        const ledgerResult = await LedgerPostingService.postEntryInTransaction(
          tx as never,
          {
            type: TransactionType.WALLET_TRANSFER,
            description: `Auto-approved internal transfer ${transferReq.id}`,
            idempotencyKey: `transfer-approve:${transferReq.id}`,
            lines: [
              {
                accountSlug: senderAccount.slug,
                amount: -amount,
                description: `Internal transfer sent to ${
                  receiver.phone || receiver.email || receiver.id
                }`,
              },
              {
                accountSlug: receiverAccount.slug,
                amount,
                description: `Internal transfer received from ${
                  session.user.name || senderId
                }`,
              },
            ],
            metadata: {
              transferRequestId: transferReq.id,
              senderId,
              receiverId: receiver.id,
              referenceType: "TRANSFER_REQUEST",
              referenceId: transferReq.id,
            },
          }
        );

        const updatedSenderAccount = await tx.ledgerAccount.findUnique({
          where: { id: senderAccount.id },
          select: { balance: true },
        });

        const updatedReceiverAccount = await tx.ledgerAccount.findUnique({
          where: { id: receiverAccount.id },
          select: { balance: true },
        });

        const senderWalletAddresses = buildWalletAddressPair(senderId);
        const receiverWalletAddresses = buildWalletAddressPair(receiver.id);

        await tx.wallet.upsert({
          where: { userId: senderId },
          update: {
            ...(currency === Currency.SYP
              ? { balanceSYP: updatedSenderAccount?.balance ?? 0 }
              : { balanceUSD: updatedSenderAccount?.balance ?? 0 }),
            walletAddressSYP: senderWalletAddresses.walletAddressSYP,
            walletAddressUSD: senderWalletAddresses.walletAddressUSD,
          },
          create: {
            userId: senderId,
            balanceSYP:
              currency === Currency.SYP
                ? updatedSenderAccount?.balance ?? 0
                : 0,
            balanceUSD:
              currency === Currency.USD
                ? updatedSenderAccount?.balance ?? 0
                : 0,
            walletAddressSYP: senderWalletAddresses.walletAddressSYP,
            walletAddressUSD: senderWalletAddresses.walletAddressUSD,
          },
        });

        await tx.wallet.upsert({
          where: { userId: receiver.id },
          update: {
            ...(currency === Currency.SYP
              ? { balanceSYP: updatedReceiverAccount?.balance ?? 0 }
              : { balanceUSD: updatedReceiverAccount?.balance ?? 0 }),
            walletAddressSYP: receiverWalletAddresses.walletAddressSYP,
            walletAddressUSD: receiverWalletAddresses.walletAddressUSD,
          },
          create: {
            userId: receiver.id,
            balanceSYP:
              currency === Currency.SYP
                ? updatedReceiverAccount?.balance ?? 0
                : 0,
            balanceUSD:
              currency === Currency.USD
                ? updatedReceiverAccount?.balance ?? 0
                : 0,
            walletAddressSYP: receiverWalletAddresses.walletAddressSYP,
            walletAddressUSD: receiverWalletAddresses.walletAddressUSD,
          },
        });

        await tx.auditLog.create({
          data: {
            actorRole: "SYSTEM",
            actorId: "SYSTEM",
            action: "FINANCE_TRANSFER_REQUEST_AUTO_COMPLETED",
            entityType: "TransferRequest",
            entityId: transferReq.id,
            beforeJson: { status: "PENDING" },
            afterJson: { status: "COMPLETED" },
          },
        });

        return {
          kind: "completed",
          transferRequestId: transferReq.id,
          receiverName:
            receiver.name || receiver.phone || receiver.email || receiver.id,
          receiverId: receiver.id,
          status: "COMPLETED",
          notifications: ledgerResult.notifications,
        };
      }

      const hold = await tx.ledgerHold.create({
        data: {
          accountId: senderAccount.id,
          amount,
          status: "OPEN",
          referenceType: "TRANSFER_REQUEST",
        },
      });

      const transferReq = await tx.transferRequest.create({
        data: {
          senderId,
          receiverId: receiver.id,
          senderAccountId: senderAccount.id,
          receiverAccountId: receiverAccount.id,
          amount,
          currency,
          status: "PENDING",
          referenceNote: `P2P Transfer to ${
            receiver.phone || receiver.email || receiver.id
          }`,
        },
      });

      await tx.ledgerHold.update({
        where: { id: hold.id },
        data: { referenceId: transferReq.id },
      });

      return {
        kind: "pending",
        transferRequestId: transferReq.id,
        receiverName:
          receiver.name || receiver.phone || receiver.email || receiver.id,
        receiverId: receiver.id,
        status: "PENDING",
        notifications: [],
      };
    });

    if (result.kind === "completed" && result.notifications) {
      await LedgerPostingService.dispatchNotifications(result.notifications);

      const { NotificationService } = await import(
        "@/lib/notifications/service"
      );

      await NotificationService.create({
        userId: senderId,
        title: "تم التحويل بنجاح",
        message: `تم تحويل ${amount.toLocaleString()} ${currency} إلى ${
          result.receiverName
        }.`,
        type: "SUCCESS",
        link: `/wallet/transactions?focus=${result.transferRequestId}&kind=transfer-request`,
        metadata: {
          entityType: "TRANSFER_REQUEST",
          entityId: result.transferRequestId,
        },
      });

      await NotificationService.create({
        userId: result.receiverId,
        title: "تحويل وارد جديد",
        message: `لقد استلمت ${amount.toLocaleString()} ${currency} من مستخدم آخر.`,
        type: "INFO",
        link: `/wallet/transactions?focus=${result.transferRequestId}&kind=transfer-request`,
        metadata: {
          entityType: "TRANSFER_REQUEST",
          entityId: result.transferRequestId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message:
        result.kind === "completed"
          ? "تم التحويل بنجاح فورا."
          : "تم إرسال طلب التحويل بنجاح وهو قيد المراجعة المالية.",
      data: result,
    });
  } catch (error: any) {
    const message = error?.message;

    switch (message) {
      case "RECEIVER_NOT_FOUND":
        return NextResponse.json(
          { error: "No user found with that phone, email, or wallet ID." },
          { status: 404 }
        );

      case "SELF_TRANSFER_NOT_ALLOWED":
        return NextResponse.json(
          { error: "You cannot transfer money to yourself." },
          { status: 400 }
        );

      case "INSUFFICIENT_FUNDS":
        return NextResponse.json(
          { error: "Insufficient available balance for this transfer." },
          { status: 400 }
        );

      case "SENDER_LOCKED_BY_DEBT":
        return NextResponse.json(
          { error: "Your account is locked due to outstanding debts." },
          { status: 423 }
        );

      default:
        console.error("Internal transfer error:", error);
        return NextResponse.json(
          { error: "An unexpected error occurred processing your transfer." },
          { status: 500 }
        );
    }
  }
}
