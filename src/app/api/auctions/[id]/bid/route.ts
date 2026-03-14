import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  AuctionDepositWorkflowStatus,
  AuctionExtensionStage,
  AuctionParticipantWorkflowStatus,
  AuctionWorkflowStatus,
  BidWorkflowStatus,
} from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  userType?: string;
}

type BidRequestBody = {
  amount?: number;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function canBidOnAuction(auction: {
  status: string;
  workflowStatus: AuctionWorkflowStatus;
  isFinallyClosed: boolean;
}) {
  const legacyOpen = auction.status === "LIVE";
  const workflowOpen = auction.workflowStatus === AuctionWorkflowStatus.OPEN;

  return !auction.isFinallyClosed && (workflowOpen || legacyOpen);
}

function resolveAuctionDeadline(auction: {
  effectiveEndsAt: Date | null;
  endsAt: Date | null;
}) {
  return auction.effectiveEndsAt ?? auction.endsAt;
}

function computeExtensionUpdate(auction: {
  effectiveEndsAt: Date | null;
  endsAt: Date | null;
  extensionCount: number;
}) {
  const deadline = resolveAuctionDeadline(auction);

  if (!deadline) {
    return null;
  }

  const msRemaining = deadline.getTime() - Date.now();
  const inLastMinute = msRemaining >= 0 && msRemaining <= 60 * 1000;

  if (!inLastMinute) {
    return null;
  }

  if (auction.extensionCount >= 3) {
    return null;
  }

  const nextExtensionCount = auction.extensionCount + 1;
  const nextDeadline = new Date(deadline.getTime() + 5 * 60 * 1000);

  const nextStage =
    nextExtensionCount === 1
      ? AuctionExtensionStage.FIRST
      : nextExtensionCount === 2
        ? AuctionExtensionStage.SECOND
        : AuctionExtensionStage.THIRD;

  return {
    extensionCount: nextExtensionCount,
    extensionStage: nextStage,
    effectiveEndsAt: nextDeadline,
    lastExtensionAt: new Date(),
  };
}

function getExtensionLabel(stage: AuctionExtensionStage) {
  switch (stage) {
    case AuctionExtensionStage.FIRST:
      return "التمديد الأول";
    case AuctionExtensionStage.SECOND:
      return "التمديد الثاني";
    case AuctionExtensionStage.THIRD:
      return "التمديد الثالث والأخير";
    case AuctionExtensionStage.FINAL_CLOSED:
      return "الإغلاق النهائي";
    default:
      return "بدون تمديد";
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للمزايدة" },
        { status: 401 }
      );
    }

    const sessionUser = session.user as SessionUser;
    const bidderId = sessionUser.id;

    if (!bidderId) {
      return NextResponse.json(
        { error: "معلومات المستخدم غير صالحة" },
        { status: 401 }
      );
    }

    const { id: auctionId } = await context.params;

    if (!auctionId) {
      return NextResponse.json(
        { error: "معرف المزاد مطلوب" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as BidRequestBody;
    const parsedAmount = Number(body.amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "مبلغ المزايدة مطلوب ويجب أن يكون أكبر من صفر" },
        { status: 400 }
      );
    }

    const bidAmount = roundMoney(parsedAmount);
    const prisma = await db;

    const user = await prisma.user.findUnique({
      where: { id: bidderId },
      include: {
        trader: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    if (user.isLocked) {
      return NextResponse.json(
        {
          error: `الحساب مقفل حالياً. السبب: ${user.lockReason || "تقييد على الحساب"}`,
        },
        { status: 403 }
      );
    }

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        title: true,
        sellerId: true,
        startingBid: true,
        status: true,
        workflowStatus: true,
        isFinallyClosed: true,
        endsAt: true,
        effectiveEndsAt: true,
        extensionCount: true,
        extensionStage: true,
        currentBid: true,
        participants: {
          where: { userId: bidderId },
          select: {
            id: true,
            userId: true,
            workflowStatus: true,
            depositWorkflowStatus: true,
            isExempt: true,
          },
          take: 1,
        },
        bids: {
          orderBy: [{ amount: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            bidderId: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          take: 1,
        },
      },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "المزاد غير موجود" },
        { status: 404 }
      );
    }

    if (!canBidOnAuction(auction)) {
      return NextResponse.json(
        { error: "المزاد غير نشط حالياً" },
        { status: 400 }
      );
    }

    if (auction.sellerId === bidderId) {
      return NextResponse.json(
        { error: "لا يمكنك المزايدة على مزادك الخاص" },
        { status: 400 }
      );
    }

    const deadline = resolveAuctionDeadline(auction);

    if (!deadline) {
      return NextResponse.json(
        { error: "المزاد غير مهيأ بوقت انتهاء صالح" },
        { status: 400 }
      );
    }

    if (Date.now() > deadline.getTime()) {
      return NextResponse.json(
        { error: "انتهى وقت المزاد" },
        { status: 400 }
      );
    }

    const participant = auction.participants[0];

    if (!participant) {
      return NextResponse.json(
        { error: "يجب الانضمام إلى المزاد أولاً قبل تقديم أي مزايدة" },
        { status: 403 }
      );
    }

    if (
      participant.workflowStatus !== AuctionParticipantWorkflowStatus.APPROVED
    ) {
      return NextResponse.json(
        { error: "الحساب غير معتمد للمشاركة في هذا المزاد" },
        { status: 403 }
      );
    }

    const depositAllowedStatuses: AuctionDepositWorkflowStatus[] = [
      AuctionDepositWorkflowStatus.HELD,
      AuctionDepositWorkflowStatus.VERIFIED,
      AuctionDepositWorkflowStatus.EXEMPT,
    ];

    if (!depositAllowedStatuses.includes(participant.depositWorkflowStatus)) {
      return NextResponse.json(
        { error: "لا يمكن تقديم مزايدة قبل تثبيت حالة التأمين" },
        { status: 403 }
      );
    }

    const currentHighestBid = auction.bids[0];
    const currentHighestAmount =
      currentHighestBid?.amount ?? auction.currentBid ?? auction.startingBid;

    if (bidAmount <= currentHighestAmount) {
      return NextResponse.json(
        {
          error: `يجب أن تكون المزايدة أعلى من ${currentHighestAmount.toLocaleString()} ل.س`,
          currentHighestAmount,
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const latestAuction = await tx.auction.findUnique({
        where: { id: auctionId },
        select: {
          id: true,
          title: true,
          sellerId: true,
          startingBid: true,
          currentBid: true,
          status: true,
          workflowStatus: true,
          isFinallyClosed: true,
          endsAt: true,
          effectiveEndsAt: true,
          extensionCount: true,
          extensionStage: true,
        },
      });

      if (!latestAuction) {
        throw new Error("Auction not found during bid transaction");
      }

      if (!canBidOnAuction(latestAuction)) {
        throw new Error("Auction is not open for bidding");
      }

      const latestDeadline = resolveAuctionDeadline(latestAuction);

      if (!latestDeadline || Date.now() > latestDeadline.getTime()) {
        throw new Error("Auction deadline has passed");
      }

      const latestHighestBid = await tx.bid.findFirst({
        where: {
          auctionId,
          status: {
            in: [
              BidWorkflowStatus.ACTIVE,
              BidWorkflowStatus.WINNING,
              BidWorkflowStatus.OUTBID,
              BidWorkflowStatus.FINALIZED,
            ],
          },
        },
        orderBy: [{ amount: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          bidderId: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      });

      const latestHighestAmount =
        latestHighestBid?.amount ??
        latestAuction.currentBid ??
        latestAuction.startingBid;

      if (bidAmount <= latestHighestAmount) {
        throw new Error(`Bid amount must exceed ${latestHighestAmount}`);
      }

      if (latestHighestBid?.status === BidWorkflowStatus.WINNING) {
        await tx.bid.update({
          where: { id: latestHighestBid.id },
          data: {
            status: BidWorkflowStatus.OUTBID,
          },
        });
      }

      const newBid = await tx.bid.create({
        data: {
          auctionId,
          bidderId,
          participantId: participant.id,
          amount: bidAmount,
          status: BidWorkflowStatus.WINNING,
          acceptedAt: new Date(),
        },
        include: {
          bidder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const extensionUpdate = computeExtensionUpdate({
        effectiveEndsAt: latestAuction.effectiveEndsAt,
        endsAt: latestAuction.endsAt,
        extensionCount: latestAuction.extensionCount,
      });

      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentBid: bidAmount,
          winningBidId: newBid.id,
          workflowStatus: AuctionWorkflowStatus.OPEN,
          ...(extensionUpdate ?? {}),
        },
        select: {
          id: true,
          currentBid: true,
          winningBidId: true,
          effectiveEndsAt: true,
          extensionCount: true,
          extensionStage: true,
        },
      });

      await tx.auctionEventLog.create({
        data: {
          auctionId,
          actorId: bidderId,
          eventType: "AUCTION_BID_PLACED",
          payload: {
            bidId: newBid.id,
            amount: bidAmount,
            bidderId,
            previousHighestBidId: latestHighestBid?.id ?? null,
            previousHighestAmount: latestHighestAmount,
            extensionApplied: Boolean(extensionUpdate),
            extensionCount: updatedAuction.extensionCount,
            extensionStage: updatedAuction.extensionStage,
            effectiveEndsAt:
              updatedAuction.effectiveEndsAt?.toISOString() ?? null,
          },
        },
      });

      if (extensionUpdate) {
        await tx.auctionEventLog.create({
          data: {
            auctionId,
            actorId: bidderId,
            eventType: "AUCTION_EXTENDED",
            payload: {
              extensionCount: updatedAuction.extensionCount,
              extensionStage: updatedAuction.extensionStage,
              extensionLabel: getExtensionLabel(updatedAuction.extensionStage),
              newEffectiveEndsAt:
                updatedAuction.effectiveEndsAt?.toISOString() ?? null,
            },
          },
        });
      }

      return {
        bid: newBid,
        updatedAuction,
        previousHighestBidderId:
          latestHighestBid?.bidderId && latestHighestBid.bidderId !== bidderId
            ? latestHighestBid.bidderId
            : null,
      };
    });

    if (result.previousHighestBidderId) {
      const { NotificationService } = await import("@/lib/notifications/service");

      await NotificationService.create({
        userId: result.previousHighestBidderId,
        title: "تمت المزايدة عليك بصورة أعلى!",
        message: `قام شخص آخر بالمزايدة بمبلغ ${bidAmount.toLocaleString()} ل.س في مزاد "${auction.title}"`,
        type: "URGENT",
        link: `/auctions/${auctionId}`,
        metadata: {
          auctionId,
          amount: bidAmount,
        },
      });
    }

    const { sseManager } = await import("@/lib/realtime/sse-server");

    sseManager.broadcast({
      type: "BID_PLACED",
      auctionId,
      amount: result.bid.amount,
      bidderName: result.bid.bidder.name,
      createdAt: result.bid.createdAt,
      extensionCount: result.updatedAuction.extensionCount,
      extensionStage: result.updatedAuction.extensionStage,
      effectiveEndsAt: result.updatedAuction.effectiveEndsAt,
    });

    return NextResponse.json({
      success: true,
      bid: {
        id: result.bid.id,
        amount: result.bid.amount,
        bidder: result.bid.bidder,
        createdAt: result.bid.createdAt,
        status: result.bid.status,
      },
      auction: {
        currentBid: result.updatedAuction.currentBid,
        winningBidId: result.updatedAuction.winningBidId,
        extensionCount: result.updatedAuction.extensionCount,
        extensionStage: result.updatedAuction.extensionStage,
        extensionLabel: getExtensionLabel(result.updatedAuction.extensionStage),
        effectiveEndsAt: result.updatedAuction.effectiveEndsAt,
      },
      message: "تم تقديم المزايدة بنجاح",
    });
  } catch (error) {
    console.error("Place bid error:", error);

    const message =
      error instanceof Error ? error.message : "حدث خطأ أثناء تقديم المزايدة";

    if (
      typeof message === "string" &&
      (message.includes("must exceed") ||
        message.includes("deadline has passed") ||
        message.includes("not open for bidding"))
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "حدث خطأ أثناء تقديم المزايدة" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const bids = await db.bid.findMany({
      where: { auctionId },
      orderBy: [{ amount: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        bidder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const total = await db.bid.count({
      where: { auctionId },
    });

    return NextResponse.json({
      success: true,
      bids: bids.map((bid) => ({
        id: bid.id,
        amount: bid.amount,
        bidder: bid.bidder,
        createdAt: bid.createdAt,
        status: bid.status,
      })),
      total,
    });
  } catch (error) {
    console.error("Get bids error:", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المزايدات" },
      { status: 500 }
    );
  }
}