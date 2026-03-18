import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  AuctionDepositWorkflowStatus,
  AuctionType,
  AuctionWorkflowStatus,
} from "@prisma/client";

import { db } from "@/lib/db";
import { LedgerPostingService } from "@/lib/ledger/service";
import { POST as joinAuctionRoute } from "@/app/api/auctions/[id]/join/route";
import { POST as bidAuctionRoute } from "@/app/api/auctions/[id]/bid/route";
import { POST as dischargeAuctionRoute } from "@/app/api/auctions/[id]/discharge/route";
import { AuctionSettlementService } from "@/lib/auction/settlement";
import { getServerSession } from "next-auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/notifications/service", () => ({
  NotificationService: {
    create: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/realtime/sse-server", () => ({
  sseManager: {
    broadcast: vi.fn(),
  },
}));

const mockedGetServerSession = vi.mocked(getServerSession);

function uniqueValue(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeJsonRequest(
  url: string,
  body: Record<string, unknown> = {}
): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function setSessionUser(userId: string) {
  mockedGetServerSession.mockResolvedValue({
    user: { id: userId },
  } as never);
}

async function createUser(params?: {
  email?: string;
  name?: string;
  userType?: string;
  isVerified?: boolean;
}) {
  return db.user.create({
    data: {
      email: params?.email ?? `${uniqueValue("auction-user")}@example.com`,
      password: "test-password",
      name: params?.name ?? "Auction Test User",
      userType: params?.userType ?? "CLIENT",
      isVerified: params?.isVerified ?? true,
      role: "CLIENT",
      status: "ACTIVE",
    },
  });
}

async function createApprovedTrader(userId: string, businessName: string) {
  return db.trader.create({
    data: {
      userId,
      businessName,
      verificationStatus: "APPROVED",
    },
  });
}

async function ensureLedgerBalance(userId: string, balance: number) {
  const account = await LedgerPostingService.getOrCreateAccount(
    `USER_${userId}_SYP`,
    userId,
    "SYP"
  );

  await db.ledgerAccount.update({
    where: { id: account.id },
    data: { balance },
  });

  return db.ledgerAccount.findUniqueOrThrow({
    where: { id: account.id },
  });
}

describe("Auction integration", () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
  });

  it("runs the full auction flow: join -> bid -> close financials -> discharge", async () => {
    const seller = await createUser({
      name: "Seller",
      userType: "CLIENT",
      isVerified: true,
    });

    const bidderA = await createUser({
      name: "Bidder A",
      userType: "CLIENT",
      isVerified: true,
    });

    const bidderB = await createUser({
      name: "Bidder B",
      userType: "CLIENT",
      isVerified: true,
    });

    await createApprovedTrader(bidderA.id, "Bidder A Metals");
    await createApprovedTrader(bidderB.id, "Bidder B Metals");

    await ensureLedgerBalance(bidderA.id, 5000);
    await ensureLedgerBalance(bidderB.id, 5000);

    const endsAt = new Date(Date.now() + 60 * 60 * 1000);

    const auction = await db.auction.create({
      data: {
        sellerId: seller.id,
        title: "Nickel Scrap Lot",
        category: "NICKEL",
        weight: 1000,
        weightUnit: "KG",
        location: "Damascus",
        startingBid: 1000,
        securityDeposit: 100,
        depositPercent: 10,
        entryFee: 0,
        duration: 60,
        status: "LIVE",
        type: AuctionType.PRIVATE,
        workflowStatus: AuctionWorkflowStatus.OPEN,
        endsAt,
        effectiveEndsAt: endsAt,
        isFinallyClosed: false,
      },
    });

    const lot = await db.auctionLot.create({
      data: {
        auctionId: auction.id,
        lineNo: 1,
        title: "Nickel Lot A",
        description: null,
        category: "NICKEL",
        quantity: 1000,
        unit: "KG",
        pricingUnit: "KG",
        startingPrice: 1000,
        reservePrice: null,
        buyNowPrice: null,
        depositModeOverride: "FIXED",
        depositAmountOverride: 100,
        currentBestBid: null,
        status: "OPEN",
      },
    });

    setSessionUser(bidderA.id);
    const joinAResponse = await joinAuctionRoute(
      makeJsonRequest(`http://localhost/api/auctions/${auction.id}/join`, {
        agreedToTerms: true,
        agreedToPrivacy: true,
        agreedToCommission: true,
        agreedToDataSharing: true,
        hasInspectedGoods: true,
        agreedToInvoice: true,
        lotIds: [lot.id],
      }),
      { params: Promise.resolve({ id: auction.id }) }
    );

    expect(joinAResponse.status).toBe(200);

    setSessionUser(bidderB.id);
    const joinBResponse = await joinAuctionRoute(
      makeJsonRequest(`http://localhost/api/auctions/${auction.id}/join`, {
        agreedToTerms: true,
        agreedToPrivacy: true,
        agreedToCommission: true,
        agreedToDataSharing: true,
        hasInspectedGoods: true,
        agreedToInvoice: true,
        lotIds: [lot.id],
      }),
      { params: Promise.resolve({ id: auction.id }) }
    );

    expect(joinBResponse.status).toBe(200);

    const participantAAfterJoin = await db.auctionParticipant.findUniqueOrThrow({
      where: {
        auctionId_userId: {
          auctionId: auction.id,
          userId: bidderA.id,
        },
      },
    });

    const participantBAfterJoin = await db.auctionParticipant.findUniqueOrThrow({
      where: {
        auctionId_userId: {
          auctionId: auction.id,
          userId: bidderB.id,
        },
      },
    });

    expect(participantAAfterJoin.depositWorkflowStatus).toBe(
      AuctionDepositWorkflowStatus.HELD
    );
    expect(participantBAfterJoin.depositWorkflowStatus).toBe(
      AuctionDepositWorkflowStatus.HELD
    );
    expect(participantAAfterJoin.depositPaid).toBe(100);
    expect(participantBAfterJoin.depositPaid).toBe(100);

    const bidderAHoldAfterJoin = await db.ledgerHold.findFirst({
      where: {
        referenceType: "AUCTION_DEPOSIT",
        referenceId: lot.id,
        status: "OPEN",
      },
      orderBy: { createdAt: "asc" },
    });

    expect(bidderAHoldAfterJoin).not.toBeNull();

    setSessionUser(bidderA.id);
    const bidAResponse = await bidAuctionRoute(
      makeJsonRequest(`http://localhost/api/auctions/${auction.id}/bid`, {
        amount: 1100,
        lotId: lot.id,
        requestKey: uniqueValue("bid-a"),
      }),
      { params: Promise.resolve({ id: auction.id }) }
    );

    expect(bidAResponse.status).toBe(200);

    const bidAPayload = await bidAResponse.json();
    expect(bidAPayload.success).toBe(true);
    expect(bidAPayload.bid.amount).toBe(1100);

    setSessionUser(bidderB.id);
    const bidBResponse = await bidAuctionRoute(
      makeJsonRequest(`http://localhost/api/auctions/${auction.id}/bid`, {
        amount: 1200,
        lotId: lot.id,
        requestKey: uniqueValue("bid-b"),
      }),
      { params: Promise.resolve({ id: auction.id }) }
    );

    expect(bidBResponse.status).toBe(200);

    const bidBPayload = await bidBResponse.json();
    expect(bidBPayload.success).toBe(true);
    expect(bidBPayload.bid.amount).toBe(1200);

    const topBid = await db.bid.findFirstOrThrow({
      where: { auctionId: auction.id },
      orderBy: [{ amount: "desc" }, { createdAt: "desc" }],
    });

    expect(topBid.bidderId).toBe(bidderB.id);
    expect(topBid.amount).toBe(1200);

    await db.auction.update({
      where: { id: auction.id },
      data: {
        endsAt: new Date(Date.now() - 10 * 60 * 1000),
        effectiveEndsAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    });

    const settlementResult =
      await AuctionSettlementService.closeAuctionFinancials(auction.id);

    expect(settlementResult.success).toBe(true);
    expect(settlementResult.winnersCount).toBe(1);
    expect(settlementResult.workflowStatus).toBe(
      AuctionWorkflowStatus.AWAITING_PAYMENT_PROOF
    );

    const lotAfterSettlement = await db.auctionLot.findUniqueOrThrow({
      where: { id: lot.id },
    });

    expect(lotAfterSettlement.winnerId).toBe(bidderB.id);
    expect(lotAfterSettlement.finalPrice).toBe(1200);

    const auctionAfterSettlement = await db.auction.findUniqueOrThrow({
      where: { id: auction.id },
    });

    expect(auctionAfterSettlement.winnerId).toBe(bidderB.id);
    expect(auctionAfterSettlement.finalPrice).toBe(1200);
    expect(auctionAfterSettlement.workflowStatus).toBe(
      AuctionWorkflowStatus.AWAITING_PAYMENT_PROOF
    );
    expect(auctionAfterSettlement.isFinallyClosed).toBe(true);

    const participantAAfterSettlement =
      await db.auctionParticipant.findUniqueOrThrow({
        where: {
          auctionId_userId: {
            auctionId: auction.id,
            userId: bidderA.id,
          },
        },
      });

    const participantBAfterSettlement =
      await db.auctionParticipant.findUniqueOrThrow({
        where: {
          auctionId_userId: {
            auctionId: auction.id,
            userId: bidderB.id,
          },
        },
      });

    expect(participantAAfterSettlement.depositWorkflowStatus).toBe(
      AuctionDepositWorkflowStatus.RELEASED
    );
    expect(participantBAfterSettlement.depositWorkflowStatus).toBe(
      AuctionDepositWorkflowStatus.HELD
    );

    const bidderAHoldAfterSettlement = await db.ledgerHold.findFirst({
      where: {
        referenceType: "AUCTION_DEPOSIT",
        referenceId: lot.id,
        account: {
          ownerId: bidderA.id,
        },
        status: "OPEN",
      },
    });

    const bidderBHoldAfterSettlement = await db.ledgerHold.findFirst({
      where: {
        referenceType: "AUCTION_DEPOSIT",
        referenceId: lot.id,
        account: {
          ownerId: bidderB.id,
        },
        status: "OPEN",
      },
    });

    expect(bidderAHoldAfterSettlement).toBeNull();
    expect(bidderBHoldAfterSettlement).not.toBeNull();

    const commissionEntries = await db.journalEntry.findMany({
      where: {
        type: "PLATFORM_COMMISSION",
      },
      include: {
        lines: true,
      },
    });

    expect(commissionEntries.length).toBeGreaterThanOrEqual(2);

    setSessionUser(seller.id);
    const dischargeResponse = await dischargeAuctionRoute(
      makeJsonRequest(`http://localhost/api/auctions/${auction.id}/discharge`),
      { params: Promise.resolve({ id: auction.id }) }
    );

    expect(dischargeResponse.status).toBe(200);

    const dischargePayload = await dischargeResponse.json();
    expect(dischargePayload.success).toBe(true);

    const participantBAfterDischarge =
      await db.auctionParticipant.findUniqueOrThrow({
        where: {
          auctionId_userId: {
            auctionId: auction.id,
            userId: bidderB.id,
          },
        },
      });

    expect(participantBAfterDischarge.depositWorkflowStatus).toBe(
      AuctionDepositWorkflowStatus.RELEASED
    );

    const bidderBHoldAfterDischarge = await db.ledgerHold.findFirst({
      where: {
        referenceType: "AUCTION_DEPOSIT",
        referenceId: lot.id,
        account: {
          ownerId: bidderB.id,
        },
        status: "OPEN",
      },
    });

    expect(bidderBHoldAfterDischarge).toBeNull();

    const auctionAfterDischarge = await db.auction.findUniqueOrThrow({
      where: { id: auction.id },
    });

    expect(auctionAfterDischarge.workflowStatus).toBe(
      AuctionWorkflowStatus.COMPLETED
    );

    const eventLogs = await db.auctionEventLog.findMany({
      where: { auctionId: auction.id },
      orderBy: { createdAt: "asc" },
    });

    const eventTypes = eventLogs.map((event) => event.eventType);

    expect(eventTypes).toContain("AUCTION_PARTICIPANT_JOINED");
    expect(eventTypes).toContain("AUCTION_BID_PLACED");
    expect(eventTypes).toContain("AUCTION_FINANCIALS_CLOSED");
    expect(eventTypes).toContain("AUCTION_WINNER_DISCHARGED");
  }, 20000);
});

