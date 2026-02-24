import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    getDb: vi.fn(),
    isDemoMode: vi.fn(),
    updateMetalRecord: vi.fn(),
  },
}));

describe('db', () => {
  beforeEach(() => {
    (db.getDb as vi.Mock).reset();
    (db.isDemoMode as vi.Mock).reset();
    (db.updateMetalRecord as vi.Mock).reset();
  });

  it('should return the same PrismaClient instance on multiple calls', async () => {
    const prismaClient1 = await db.getDb();
    const prismaClient2 = await db.getDb();
    expect(prismaClient1).toBe(prismaClient2);
  });

  it('should return true for isDemoMode when DEMO_MODE is true', () => {
    process.env.DEMO_MODE = 'true';
    expect(db.isDemoMode()).toBe(true);
  });

  it('should return false for isDemoMode when DEMO_MODE is not true', () => {
    process.env.DEMO_MODE = 'false';
    expect(db.isDemoMode()).toBe(false);
  });

  it('should call PrismaClient.update with correct parameters', async () => {
    const metalId = '1';
    const newDetails = { weight: 10, price: 100 };
    await db.updateMetalRecord(metalId, newDetails);
    expect((db.updateMetalRecord as vi.Mock).calledWith(metalId, newDetails)).toBe(true);
  });

  it('should throw an error if metal record not found', async () => {
    const metalId = '1';
    const newDetails = { weight: 10, price: 100 };
    (db.updateMetalRecord as vi.Mock).mockRejectedValue(new Error('Metal record not found'));
    await expect(db.updateMetalRecord(metalId, newDetails)).rejects.toThrow('Metal record not found');
  });

  it('should throw an error if PrismaClient.update throws', async () => {
    const metalId = '1';
    const newDetails = { weight: 10, price: 100 };
    (db.updateMetalRecord as vi.Mock).mockRejectedValue(new Error('Prisma update error'));
    await expect(db.updateMetalRecord(metalId, newDetails)).rejects.toThrow('Prisma update error');
  });
});
