import { config } from "dotenv";
config({ path: ".env.test" });

import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";

async function resetMutableFinancialTestState() {
  await db.$transaction([
    db.notification.deleteMany(),
    db.auditLog.deleteMany(),
    db.payoutRequest.deleteMany(),
    db.depositRequest.deleteMany(),
    db.ledgerHold.deleteMany(),
    db.wallet.deleteMany(),
    db.user.deleteMany(),
  ]);
}

beforeAll(async () => {
  await db.$connect();
  await resetMutableFinancialTestState();
});

beforeEach(async () => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await resetMutableFinancialTestState();
  await db.$disconnect();
});