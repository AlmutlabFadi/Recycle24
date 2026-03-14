import { config } from "dotenv";
config({ path: ".env.test" });

import { afterAll, beforeAll, beforeEach, vi } from "vitest";

import { db } from "@/lib/db";

async function resetMutableIntegrationTestState() {
  await db.$transaction([
    db.auctionEventLog.deleteMany(),
    db.auctionDispute.deleteMany(),
    db.auctionPenalty.deleteMany(),
    db.bid.deleteMany(),
    db.auctionParticipant.deleteMany(),
    db.auctionImage.deleteMany(),
    db.auction.deleteMany(),
    db.notification.deleteMany(),
    db.auditLog.deleteMany(),
    db.depositRequest.deleteMany(),
    db.payoutRequest.deleteMany(),
    db.ledgerHold.deleteMany(),
    db.transaction.deleteMany(),
    db.wallet.deleteMany(),
  ]);
}

beforeAll(async () => {
  await db.$connect();
  await resetMutableIntegrationTestState();
});

beforeEach(async () => {
  vi.restoreAllMocks();
  await resetMutableIntegrationTestState();
});

afterAll(async () => {
  await resetMutableIntegrationTestState();
  await db.$disconnect();
});