import { PrismaClient } from "@prisma/client";
import { z } from "zod";

declare global {
  var prisma: PrismaClient | undefined;
}

const isDemoMode = process.env.DEMO_MODE === "true" ||
                   process.env.VERCEL === "1" ||
                   !process.env.DATABASE_URL ||
                   process.env.DATABASE_URL?.includes("file:");

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

let _db: PrismaClient | null = null;

async function getDb(): Promise<PrismaClient> {
  if (_db) return _db;

  try {
    if (isDemoMode) {
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

export const db = getDb();

export function isDemoMode(): boolean {
  return isDemoMode;
}

// Example usage of Prisma with proper error handling, type safety, and transaction
async function updateMetalRecord(metalId: string, newDetails: { weight: number; price: number }) {
  const schema = z.object({
    weight: z.number().positive(),
    price: z.number().positive(),
  });

  const { weight, price } = schema.parse(newDetails);

  try {
    const prisma = await getDb();
    await prisma.$transaction(async (tx) => {
      const metal = await tx.metal.findUnique({
        where: { id: metalId },
        select: { weight: true, price: true },
      });

      if (!metal) {
        throw new Error('Metal record not found');
      }

      await tx.metal.update({
        where: { id: metalId },
        data: { weight, price },
      });
    });
  } catch (error) {
    console.error("Failed to update metal record:", error);
    throw error;
  }
}