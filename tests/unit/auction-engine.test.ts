import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => {
  const auction = {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  };

  const bid = {
    create: vi.fn(),
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
      amount: 100,
      now: new Date("2026-03-14T10:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("AUCTION_NOT_FOUND");
    }
  });

  it("rejects bid lower than minimum increment", async () => {
    vi.mocked(db.auction.findUnique).mockResolvedValueOnce({
      id: "a1",
      status: "LIVE",
      endAt: new Date("2026-03-14T12:00:00.000Z"),
      currentPrice: 1000,
      highestBidderId: "u9",
      version: 0,
    } as any);

    const result = await placeBid({
      auctionId: "a1",
      bidderId: "u1",
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
      status: "LIVE",
      endAt: new Date("2026-03-14T12:00:00.000Z"),
      currentPrice: 1000,
      highestBidderId: "u9",
      version: 0,
    } as any);

    vi.mocked(db.bid.create).mockResolvedValueOnce({} as any);
    vi.mocked(db.auction.updateMany).mockResolvedValueOnce({ count: 1 } as any);

    const result = await placeBid({
      auctionId: "a1",
      bidderId: "u1",
      amount: 1050,
      now: new Date("2026-03-14T10:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.currentPrice).toBe(1050);
      expect(result.highestBidderId).toBe("u1");
      expect(result.extended).toBe(false);
    }
  });

  it("extends auction in anti-sniping window", async () => {
    vi.mocked(db.auction.findUnique).mockResolvedValueOnce({
      id: "a1",
      status: "LIVE",
      endAt: new Date("2026-03-14T10:00:20.000Z"),
      currentPrice: 1000,
      highestBidderId: "u9",
      version: 0,
    } as any);

    vi.mocked(db.bid.create).mockResolvedValueOnce({} as any);
    vi.mocked(db.auction.updateMany).mockResolvedValueOnce({ count: 1 } as any);

    const result = await placeBid({
      auctionId: "a1",
      bidderId: "u1",
      amount: 1050,
      now: new Date("2026-03-14T10:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.extended).toBe(true);
      expect(result.endAt.toISOString()).toBe("2026-03-14T10:01:00.000Z");
    }
  });

  it("rejects bid when auction version changes during update", async () => {
    vi.mocked(db.auction.findUnique).mockResolvedValueOnce({
      id: "a1",
      status: "LIVE",
      endAt: new Date("2026-03-14T12:00:00.000Z"),
      currentPrice: 1000,
      highestBidderId: "u9",
      version: 3,
    } as any);

    vi.mocked(db.bid.create).mockResolvedValueOnce({} as any);
    vi.mocked(db.auction.updateMany).mockResolvedValueOnce({ count: 0 } as any);

    const result = await placeBid({
      auctionId: "a1",
      bidderId: "u1",
      amount: 1050,
      now: new Date("2026-03-14T10:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("BID_CONFLICT");
    }
  });
});
