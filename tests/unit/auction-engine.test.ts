import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuctionExtensionStage,
  AuctionWorkflowStatus,
  BidWorkflowStatus,
} from "@prisma/client";

vi.mock("@/lib/db", () => {
  const auction = {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  };

  const bid = {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  return {
    db: {
      auction,
      bid,
      $transaction: async (fn: (tx: any) => Promise<any>) => {
        return fn({ auction, bid });
      },
    },
  };
});

import { db } from "@/lib/db";
import { placeBid } from "@/core/auction/auction-engine";

describe("auction engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects bid when auction is not found", async () => {
    vi.mocked(db.auction.findUnique).mockResolvedValueOnce(null as any);

    const result = await placeBid({
      auctionId: "a1",
      bidderId: "u1",
      participantId: "p1",
      amount: 100,
      now: new Date("2026-03-14T10:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("AUCTION_NOT_FOUND");
    }
  });

  it("rejects bid when auction is not open", async () => {
    vi.mocked(db.auction.findUnique).mockResolvedValueOnce({
      id: "a1",
      sellerId: "seller-1",
      title: "Auction",
      startingBid: 1000,
      status: "SCHEDULED",
      workflowStatus: "DRAFT",
      isFinallyClosed: false,
      endsAt: new Date("2026-03-14T12:00:00.000Z"),
      effectiveEndsAt: new Date("2026-03-14T12:00:00.000Z"),
      extensionCount: 0,
      currentBid: null,
      winningBidId: null,
      version: 0,
    } as any);

    const result = await placeBid({
      auctionId: "a1",
      bidderId: "u1",
      participantId: "p1",
      amount: 1050,
      now: new Date("2026-03-14T10:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("AUCTION_NOT_OPEN");
    }
  });

  it("rejects bid lower than minimum increment", async () => {
    vi.mocked(db.auction.findUnique).mockResolvedValueOnce({
      id: "a1",
      sellerId: "seller-1",
      title: "Auction",
      startingBid: 1000,
      status: "LIVE",
      workflowStatus: "OPEN",
      isFinallyClosed: false,
      endsAt: new Date("2026-03-14T12:00:00.000Z"),
      effectiveEndsAt: new Date("2026-03-14T12:00:00.000Z"),
      extensionCount: 0,
      currentBid: 1000,
      winningBidId: "b9",
      version: 0,
    } as any);

    vi.mocked(db.bid.findFirst).mockResolvedValueOnce({
      id: "b9",
      bidderId: "u9",
      amount: 1000,
      status: BidWorkflowStatus.WINNING,
      createdAt: new Date("2026-03-14T09:00:00.000Z"),
    } as any);

    const result = await placeBid({
      auctionId: "a1",
      bidderId: "u1",
      participantId: "p1",
      amount: 1010,
      now: new Date("2026-03-14T10:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("BID_TOO_LOW");
    }
  });

  it("accepts a valid bid", async () => {
    vi.mocked(db.auction.findUnique).mockResolvedValueOnce({
      id: "a1",
      sellerId: "seller-1",
      title: "Auction",
      startingBid: 1000,
      status: "LIVE",
      workflowStatus: "OPEN",
      isFinallyClosed: false,
      endsAt: new Date("2026-03-14T12:00:00.000Z"),
      effectiveEndsAt: new Date("2026-03-14T12:00:00.000Z"),
      extensionCount: 0,
      currentBid: 1000,
      winningBidId: "b9",
      version: 0,
    } as any);

    vi.mocked(db.bid.findFirst).mockResolvedValueOnce({
      id: "b9",
      bidderId: "u9",
      amount: 1000,
      status: BidWorkflowStatus.WINNING,
      createdAt: new Date("2026-03-14T09:00:00.000Z"),
    } as any);

    vi.mocked(db.bid.update).mockResolvedValueOnce({} as any);
    vi.mocked(db.bid.create).mockResolvedValueOnce({
      id: "b10",
      bidderId: "u1",
      amount: 1050,
      status: BidWorkflowStatus.WINNING,
      createdAt: new Date("2026-03-14T10:00:00.000Z"),
    } as any);
    vi.mocked(db.auction.updateMany).mockResolvedValueOnce({ count: 1 } as any);

    const result = await placeBid({
      auctionId: "a1",
      bidderId: "u1",
      participantId: "p1",
      amount: 1050,
      now: new Date("2026-03-14T10:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bidId).toBe("b10");
      expect(result.currentBid).toBe(1050);
      expect(result.winningBidId).toBe("b10");
      expect(result.previousHighestBidId).toBe("b9");
      expect(result.previousHighestBidderId).toBe("u9");
      expect(result.extended).toBe(false);
    }
  });

  it("extends auction in anti-sniping window", async () => {
    vi.mocked(db.auction.findUnique).mockResolvedValueOnce({
      id: "a1",
      sellerId: "seller-1",
      title: "Auction",
      startingBid: 1000,
      status: "LIVE",
      workflowStatus: "OPEN",
      isFinallyClosed: false,
      endsAt: new Date("2026-03-14T10:00:20.000Z"),
      effectiveEndsAt: new Date("2026-03-14T10:00:20.000Z"),
      extensionCount: 0,
      currentBid: 1000,
      winningBidId: "b9",
      version: 0,
    } as any);

    vi.mocked(db.bid.findFirst).mockResolvedValueOnce({
      id: "b9",
      bidderId: "u9",
      amount: 1000,
      status: BidWorkflowStatus.WINNING,
      createdAt: new Date("2026-03-14T09:00:00.000Z"),
    } as any);

    vi.mocked(db.bid.update).mockResolvedValueOnce({} as any);
    vi.mocked(db.bid.create).mockResolvedValueOnce({
      id: "b10",
      bidderId: "u1",
      amount: 1050,
      status: BidWorkflowStatus.WINNING,
      createdAt: new Date("2026-03-14T10:00:00.000Z"),
    } as any);
    vi.mocked(db.auction.updateMany).mockResolvedValueOnce({ count: 1 } as any);

    const result = await placeBid({
      auctionId: "a1",
      bidderId: "u1",
      participantId: "p1",
      amount: 1050,
      now: new Date("2026-03-14T10:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.extended).toBe(true);
      expect(result.extensionCount).toBe(1);
      expect(result.effectiveEndsAt?.toISOString()).toBe("2026-03-14T10:01:00.000Z");
    }
  });

  it("rejects bid when auction version changes during update", async () => {
    vi.mocked(db.auction.findUnique).mockResolvedValueOnce({
      id: "a1",
      sellerId: "seller-1",
      title: "Auction",
      startingBid: 1000,
      status: "LIVE",
      workflowStatus: "OPEN",
      isFinallyClosed: false,
      endsAt: new Date("2026-03-14T12:00:00.000Z"),
      effectiveEndsAt: new Date("2026-03-14T12:00:00.000Z"),
      extensionCount: 2,
      currentBid: 1000,
      winningBidId: "b9",
      version: 3,
    } as any);

    vi.mocked(db.bid.findFirst).mockResolvedValueOnce({
      id: "b9",
      bidderId: "u9",
      amount: 1000,
      status: BidWorkflowStatus.WINNING,
      createdAt: new Date("2026-03-14T09:00:00.000Z"),
    } as any);

    vi.mocked(db.bid.update).mockResolvedValueOnce({} as any);
    vi.mocked(db.bid.create).mockResolvedValueOnce({
      id: "b10",
      bidderId: "u1",
      amount: 1050,
      status: BidWorkflowStatus.WINNING,
      createdAt: new Date("2026-03-14T10:00:00.000Z"),
    } as any);
    vi.mocked(db.auction.updateMany).mockResolvedValueOnce({ count: 0 } as any);

    const result = await placeBid({
      auctionId: "a1",
      bidderId: "u1",
      participantId: "p1",
      amount: 1050,
      now: new Date("2026-03-14T10:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("BID_CONFLICT");
    }
  });
});
