import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const _isDemoMode = process.env.DEMO_MODE === "true" ||
                   process.env.VERCEL === "1" ||
                   !process.env.DATABASE_URL ||
                   process.env.DATABASE_URL?.includes("file:");

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

let _db: PrismaClient | null = null;

export async function getDb(): Promise<PrismaClient> {
  if (_db) return _db;

  try {
    if (_isDemoMode) {
      _db = createPrismaClient();
      return _db;
    }

    if (process.env.NODE_ENV === "production") {
      _db = createPrismaClient();
      return _db;
    }

    if (!globalThis.prisma) {
      globalThis.prisma = createPrismaClient();
    }
    _db = globalThis.prisma;
    return _db;
  } catch (error) {
    console.error("Failed to get Prisma client:", error);
    throw new Error("Failed to initialize Prisma client");
  }
}

export const db = createPrismaClient();

export const isDemoMode = _isDemoMode;
