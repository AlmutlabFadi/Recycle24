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

// Example usage of Prisma with proper error handling, type safety, and transaction
async function updateMetalRecord(metalId: string, newDetails: { weight: number; price: number }) {
  const schema = z.object({
    weight: z.number().positive(),
    price: z.number().positive(),
  });

  const { weight, price } = schema.parse(newDetails);

  try {
    const prisma = db;
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
