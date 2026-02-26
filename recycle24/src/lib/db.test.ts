import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDb, isDemoMode } from '@/lib/db';

describe('db', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the same PrismaClient instance on multiple calls', async () => {
    const prismaClient1 = await getDb();
    const prismaClient2 = await getDb();
    expect(prismaClient1).toBe(prismaClient2);
  });

  it('should return correct isDemoMode value', () => {
    expect(typeof isDemoMode).toBe('boolean');
  });
});
