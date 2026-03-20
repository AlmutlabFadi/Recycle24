import { config } from "dotenv";
config({ path: ".env.test" });

import { afterAll, beforeAll, beforeEach, vi } from "vitest";

import { db } from "@/lib/db";

async function resetMutableIntegrationTestState() {
  await db.$transaction(async (tx) => {
    await tx.auctionEventLog.deleteMany();
    await tx.auctionDispute.deleteMany();
    await tx.auctionPenalty.deleteMany();
    await tx.bid.deleteMany();
    await tx.auctionParticipant.deleteMany();
    await tx.auctionImage.deleteMany();
    await tx.auction.deleteMany();

    await tx.notification.deleteMany();
    await tx.auditLog.deleteMany();

    await tx.ledgerHold.deleteMany();
    await tx.depositRequest.deleteMany();
    await tx.payoutRequest.deleteMany();
    await tx.transaction.deleteMany();

    await tx.wallet.deleteMany();
  });
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