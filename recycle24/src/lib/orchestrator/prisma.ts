/**
 * 🗄️ ORCHESTRATOR PRISMA SINGLETON
 *
 * A single shared PrismaClient for the entire Orchestrator system.
 * SQLite cannot handle 20+ concurrent connections — this pattern
 * ensures all agents share ONE connection, preventing P1008 timeouts.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  orchestratorPrisma: PrismaClient | undefined;
};

export const orchestratorPrisma =
  globalForPrisma.orchestratorPrisma ??
  new PrismaClient({
    log: [],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.orchestratorPrisma = orchestratorPrisma;
}

export default orchestratorPrisma;
