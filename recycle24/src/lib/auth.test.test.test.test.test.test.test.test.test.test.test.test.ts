import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { isDemoMode, DEMO_USERS } from "@/lib/demo-data";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authOptions } from "@/lib/auth";

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('PrismaAdapter', () => {
  it('should create a new PrismaAdapter instance', () => {
    const adapter = new PrismaAdapter();
    expect(adapter).toBeInstanceOf(PrismaAdapter);
  });
});

describe('db', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should findFirst user from the database', async () => {
    const expectedUser = { id: '1', name: 'User', email: 'user@example.com' };
    db.user.findFirst.mockResolvedValue(expectedUser);
    const user = await db.user.findFirst();
    expect(user).toEqual(expectedUser);
    expect(db.user.findFirst).toHaveBeenCalled();
  });

  it('should not find user if findFirst returns null', async () => {
    db.user.findFirst.mockResolvedValue(null);
    const user = await db.user.findFirst();
    expect(user).toBeNull();
    expect(db.user.findFirst).toHaveBeenCalled();
  });
});

describe('compare', () => {
  it('should compare passwords correctly', () => {
    const passwordHash = '$2b$10$...';
    const password = 'password123';
    const result = compare(password, passwordHash);
    expect(result).toBe(true);
  });

  it('should return false if passwords do not match', () => {
    const passwordHash = '$2b$10$...';
    const password = 'wrongpassword';
    const result = compare(password, passwordHash);
    expect(result).toBe(false);
  });
});

describe('isDemoMode', () => {
  it('should return true if in demo mode', () => {
    process.env.NODE_ENV = 'development';
    const result = isDemoMode();
    expect(result).toBe(true);
  });

  it('should return false if not in demo mode', () => {
    process.env.NODE_ENV = 'production';
    const result = isDemoMode();
    expect(result).toBe(false);
  });
});

describe('CredentialsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error if credentials are required', async () => {
    const credentials = {};
    await expect(CredentialsProvider.authorize(credentials)).rejects.toThrow('Credentials are required');
  });

  it('should return user if credentials are correct', async () => {
    const credentials = { email: 'user@example.com', password: 'password123' };
    const expectedUser = { id: '1', name: 'User', email: 'user@example.com' };
    vi.mock('@/lib/db', () => ({
      db: {
        user: {
          findFirst: vi.fn().mockResolvedValue(expectedUser),
        },
      },
    }));
    const result = await CredentialsProvider.authorize(credentials);
    expect(result).toEqual(expectedUser);
  });

  it('should return null if credentials are incorrect', async () => {
    const credentials = { email: 'user@example.com', password: 'wrongpassword' };
    vi.mock('@/lib/db', () => ({
      db: {
        user: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
    }));
    const result = await CredentialsProvider.authorize(credentials);
    expect(result).toBeNull();
  });
});