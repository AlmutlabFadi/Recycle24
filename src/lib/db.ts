import { PrismaClient } from "@prisma/client";
import { z } from "zod";

declare global {
  var prisma: PrismaClient | undefined;
}

export const isDemoMode = process.env.DEMO_MODE === "true" || !process.env.DATABASE_URL;

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// isDemoMode is exported as a const above

// Example usage of Prisma is removed because the model "metal" does not exist in schema.
