import { Prisma, TransferRequest } from "@prisma/client";

import { evaluateApproval } from "@/app/admin/finance/_lib/policy-engine";
import { LedgerPostingService } from "@/lib/ledger/service";
import { buildWalletAddressPair } from "@/lib/wallet/address";
import { Currency, TransactionType } from "@/lib/ledger/types";

type Tx = Prisma.TransactionClient;

type ApproveTransferParams = {
  tx: Tx;
  transferRequestId: string;
  actorUserId: string;
};

type RejectTransferParams = {
  tx: Tx;
  transferRequestId: string;
  actorUserId: string;
  reviewNote: string | null;
};

type ApproveTransferResult = {
  kind: "staged" | "completed";
  transferRequest: TransferRequest;
  notifications: Awaited<
    ReturnType<typeof LedgerPostingService.postEntryInTransaction>
  >["notifications"];
};

type RejectTransferResult = {
  transferRequest: TransferRequest;
};

function isSupportedCurrency(value: string): value is Currency {
  return value === Currency.SYP || value === Currency.USD;
}

async function syncWalletBalance(params: {
  tx: Tx;
  userId: string;
  currency: Currency;
  balance: number;
}) {
  const { tx, userId, currency, balance } = params;
  const walletAddresses = buildWalletAddressPair(userId);

  await tx.wallet.upsert({
    where: { userId },
    update: {
      ...(currency === Currency.SYP
        ? { balanceSYP: balance }
        : { balanceUSD: balance }),
      walletAddressSYP: walletAddresses.walletAddressSYP,
      walletAddressUSD: walletAddresses.walletAddressUSD,
    },
    create: {
      userId,
      balanceSYP: currency === Currency.SYP ? balance : 0,
      balanceUSD: currency === Currency.USD ? balance : 0,
      walletAddressSYP: walletAddresses.walletAddressSYP,
      walletAddressUSD: walletAddresses.walletAddressUSD,
    },
  });
}

async function getTransferForExecution(tx: Tx, transferRequestId: string) {
  return tx.transferRequest.findUnique({
    where: { id: transferRequestId },
    include: {
      senderAccount: true,
      receiverAccount: true,
    },
  });
}

async function getOpenTransferHold(tx: Tx, transferRequestId: string) {
  return tx.ledgerHold.findFirst({
    where: {
      referenceType: "TRANSFER_REQUEST",
      referenceId: transferRequestId,
      status: "OPEN",
    },
  });
}

export class TransferExecutionService {
  static async approve(
    params: ApproveTransferParams
  ): Promise<ApproveTransferResult> {
    const { tx, transferRequestId, actorUserId } = params;

    const transferReq = await getTransferForExecution(tx, transferRequestId);

    if (!transferReq) {
      throw new Error("TRANSFER_NOT_FOUND");
    }

    if (!transferReq.senderAccount || !transferReq.receiverAccount) {
      throw new Error("TRANSFER_ACCOUNTS_MISSING");
    }

    if (!isSupportedCurrency(transferReq.currency)) {
      throw new Error("TRANSFER_UNSUPPORTED_CURRENCY");
    }

    if (transferReq.status === "COMPLETED") {
      return {
        kind: "completed",
        transferRequest: transferReq,
        notifications: [],
      };
    }

    if (!["PENDING", "UNDER_REVIEW"].includes(transferReq.status)) {
      throw new Error("INVALID_STATUS");
    }

    const policy = evaluateApproval({
      type: "TRANSFER",
      amount: transferReq.amount,
      currency: transferReq.currency,
      userId: transferReq.senderId,
      velocityTriggered: false,
    });

    if (
      policy.requiresFinalApproval &&
      transferReq.reviewedById &&
      transferReq.reviewedById === actorUserId
    ) {
      throw new Error("FINAL_APPROVER_MUST_DIFFER");
    }

    if (policy.requiresFinalApproval && transferReq.status === "PENDING") {
      const stagedRequest = await tx.transferRequest.update({
        where: { id: transferReq.id },
        data: {
          status: "UNDER_REVIEW",
          reviewedById: actorUserId,
          reviewedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorRole: "ADMIN",
          actorId: actorUserId,
          action: "FINANCE_TRANSFER_REQUEST_REVIEWED",
          entityType: "TransferRequest",
          entityId: stagedRequest.id,
          beforeJson: {
            status: transferReq.status,
            reviewedById: transferReq.reviewedById,
          },
          afterJson: {
            status: stagedRequest.status,
            reviewedById: stagedRequest.reviewedById,
            reviewedAt: stagedRequest.reviewedAt,
          },
        },
      });

      return {
        kind: "staged",
        transferRequest: stagedRequest,
        notifications: [],
      };
    }

    const hold = await getOpenTransferHold(tx, transferReq.id);
    if (!hold) {
      throw new Error("TRANSFER_HOLD_NOT_FOUND");
    }

    const senderBalanceBefore = transferReq.senderAccount.balance;
    const receiverBalanceBefore = transferReq.receiverAccount.balance;

    const ledgerResult = await LedgerPostingService.postEntryInTransaction(
      tx as never,
      {
        type: TransactionType.WALLET_TRANSFER,
        description: `Approved internal transfer ${transferReq.id}`,
        idempotencyKey: `transfer-approve:${transferReq.id}`,
        lines: [
          {
            accountSlug: transferReq.senderAccount.slug,
            amount: -transferReq.amount,
            description: `Internal transfer ${transferReq.id} sent`,
          },
          {
            accountSlug: transferReq.receiverAccount.slug,
            amount: transferReq.amount,
            description: `Internal transfer ${transferReq.id} received`,
          },
        ],
        metadata: {
          transferRequestId: transferReq.id,
          referenceType: "TRANSFER_REQUEST",
          referenceId: transferReq.id,
          senderId: transferReq.senderId,
          receiverId: transferReq.receiverId,
          reviewedByUserId: transferReq.reviewedById ?? actorUserId,
          approvedByUserId: policy.requiresFinalApproval ? actorUserId : null,
          policyFlags: policy.flags,
        },
      }
    );

    await tx.ledgerHold.update({
      where: { id: hold.id },
      data: {
        status: "EXECUTED",
        updatedAt: new Date(),
      },
    });

    const completedReq = await tx.transferRequest.update({
      where: { id: transferReq.id },
      data: {
        status: "COMPLETED",
        reviewedById: transferReq.reviewedById ?? actorUserId,
        reviewedAt: transferReq.reviewedAt ?? new Date(),
        completedAt: new Date(),
      },
    });

    const [updatedSenderAccount, updatedReceiverAccount] = await Promise.all([
      tx.ledgerAccount.findUnique({
        where: { id: transferReq.senderAccountId ?? "" },
        select: { balance: true },
      }),
      tx.ledgerAccount.findUnique({
        where: { id: transferReq.receiverAccountId ?? "" },
        select: { balance: true },
      }),
    ]);

    await syncWalletBalance({
      tx,
      userId: transferReq.senderId,
      currency: transferReq.currency,
      balance: updatedSenderAccount?.balance ?? senderBalanceBefore,
    });

    await syncWalletBalance({
      tx,
      userId: transferReq.receiverId,
      currency: transferReq.currency,
      balance: updatedReceiverAccount?.balance ?? receiverBalanceBefore,
    });

    await tx.auditLog.create({
      data: {
        actorRole: "ADMIN",
        actorId: actorUserId,
        action: "FINANCE_TRANSFER_REQUEST_APPROVED",
        entityType: "TransferRequest",
        entityId: completedReq.id,
        beforeJson: {
          status: transferReq.status,
          reviewedById: transferReq.reviewedById,
          holdId: hold.id,
          holdStatus: hold.status,
          senderBalanceBefore,
          receiverBalanceBefore,
        },
        afterJson: {
          status: completedReq.status,
          reviewedById: completedReq.reviewedById,
          reviewedAt: completedReq.reviewedAt,
          completedAt: completedReq.completedAt,
          holdStatus: "EXECUTED",
          senderBalanceAfter: updatedSenderAccount?.balance ?? null,
          receiverBalanceAfter: updatedReceiverAccount?.balance ?? null,
          policyFlags: policy.flags,
        },
      },
    });

    return {
      kind: "completed",
      transferRequest: completedReq,
      notifications: ledgerResult.notifications,
    };
  }

  static async reject(
    params: RejectTransferParams
  ): Promise<RejectTransferResult> {
    const { tx, transferRequestId, actorUserId, reviewNote } = params;

    const transferReq = await getTransferForExecution(tx, transferRequestId);

    if (!transferReq) {
      throw new Error("TRANSFER_NOT_FOUND");
    }

    if (transferReq.status === "REJECTED") {
      throw new Error("ALREADY_REJECTED");
    }

    if (transferReq.status === "COMPLETED") {
      throw new Error("ALREADY_COMPLETED");
    }

    if (!["PENDING", "UNDER_REVIEW"].includes(transferReq.status)) {
      throw new Error("INVALID_STATUS");
    }

    const hold = await getOpenTransferHold(tx, transferReq.id);

    if (hold) {
      await tx.ledgerHold.update({
        where: { id: hold.id },
        data: {
          status: "CANCELLED",
          updatedAt: new Date(),
        },
      });
    }

    const rejectedReq = await tx.transferRequest.update({
      where: { id: transferReq.id },
      data: {
        status: "REJECTED",
        reviewedById: transferReq.reviewedById ?? actorUserId,
        reviewedAt: transferReq.reviewedAt ?? new Date(),
        failedAt: new Date(),
        reviewNote,
      },
    });

    await tx.auditLog.create({
      data: {
        actorRole: "ADMIN",
        actorId: actorUserId,
        action: "FINANCE_TRANSFER_REQUEST_REJECTED",
        entityType: "TransferRequest",
        entityId: rejectedReq.id,
        beforeJson: {
          status: transferReq.status,
          reviewedById: transferReq.reviewedById,
          holdReleased: Boolean(hold),
        },
        afterJson: {
          status: rejectedReq.status,
          reviewedById: rejectedReq.reviewedById,
          reviewedAt: rejectedReq.reviewedAt,
          failedAt: rejectedReq.failedAt,
          reviewNote: rejectedReq.reviewNote,
          holdStatus: hold ? "CANCELLED" : "NOT_FOUND",
        },
      },
    });

    return {
      transferRequest: rejectedReq,
    };
  }
}
