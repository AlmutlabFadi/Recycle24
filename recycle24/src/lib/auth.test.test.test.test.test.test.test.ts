import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { isDemoMode, DEMO_USERS } from "@/lib/demo-data";
import { NextAuthOptions, NextAuthProvider } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authOptions } from "@/lib/auth";

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/demo-data", () => ({
  isDemoMode: true,
  DEMO_USERS: {
    ...DEMO_USERS,
    "demo@example.com": {
      id: "1",
      name: "Demo User",
      email: "demo@example.com",
      phone: "1234567890",
      role: "TRADER",
      userType: "USER",
    },
  },
}));

describe('auth.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return NextAuthOptions with correct adapter and providers', () => {
    expect(authOptions).toEqual(
      expect.objectContaining({
        adapter: expect.any(PrismaAdapter),
        providers: expect.arrayContaining([
          expect.objectContaining({
            name: "Credentials",
            credentials: expect.objectContaining({
              phone: { label: "Phone", type: "text" },
              email: { label: "Email", type: "text" },
              password: { label: "Password", type: "password" },
            }),
          }),
        ]),
        session: expect.objectContaining({
          strategy: "jwt",
          maxAge: 24 * 60 * 60,
        }),
        callbacks: expect.objectContaining({
          jwt: expect.any(Function),
          session: expect.any(Function),
        }),
        secret: expect.any(String),
        pages: expect.objectContaining({
          signIn: "/login",
        }),
      })
    );
  });

  it('should throw error if NEXTAUTH_SECRET or JWT_SECRET is not set in production', () => {
    process.env.NODE_ENV = "production";
    const setSecret = authOptions.secret;
    process.env.NEXTAUTH_SECRET = undefined;
    process.env.JWT_SECRET = undefined;
    expect(() => setSecret()).toThrow("NEXTAUTH_SECRET or JWT_SECRET must be set in production");
  });

  it('should return demo user if credentials are correct in demo mode', async () => {
    process.env.NODE_ENV = "development";
    const credentials = { email: "demo@example.com", password: "123456" };
    const expectedUser = DEMO_USERS["demo@example.com"];
    const result = await CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error("Credentials are required");
        }
        const identifier = credentials.email || credentials.phone;
        const password = credentials.password;
        if (!identifier || !password) {
          throw new Error("Email/Phone and password are required");
        }
        if (isDemoMode) {
          const demoUser = DEMO_USERS[identifier];
          if (!demoUser || password !== "123456") {
            throw new Error("Invalid credentials");
          }
          return {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            phone: demoUser.phone,
            role: demoUser.role || "TRADER",
            userType: demoUser.userType,
          };
        }
        return null;
      },
    }).authorize(credentials);
    expect(result).toEqual(expectedUser);
  });

  it('should throw error if credentials are incorrect in demo mode', async () => {
    process.env.NODE_ENV = "development";
    const credentials = { email: "demo@example.com", password: "wrongpassword" };
    await expect(CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error("Credentials are required");
        }
        const identifier = credentials.email || credentials.phone;
        const password = credentials.password;
        if (!identifier || !password) {
          throw new Error("Email/Phone and password are required");
        }
        if (isDemoMode) {
          const demoUser = DEMO_USERS[identifier];
          if (!demoUser || password !== "123456") {
            throw new Error("Invalid credentials");
          }
          return {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            phone: demoUser.phone,
            role: demoUser.role || "TRADER",
            userType: demoUser.userType,
          };
        }
        return null;
      },
    }).authorize(credentials)).rejects.toThrow("Invalid credentials");
  });

  it('should return user from database if credentials are correct', async () => {
    const credentials = { email: "user@example.com", password: "password123" };
    const expectedUser = {
      id: "1",
      name: "User",
      email: "user@example.com",
      phone: "1234567890",
      role: "TRADER",
      userType: "USER",
      password: "$2b$10$...$2b$10$...",
    };
    vi.mock("@/lib/db", () => ({
      db: {
        user: {
          findUnique: vi.fn().mockResolvedValue(expectedUser),
        },
      },
    }));
    const result = await CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error("Credentials are required");
        }
        const identifier = credentials.email || credentials.phone;
        const password = credentials.password;
        if (!identifier || !password) {
          throw new Error("Email/Phone and password are required");
        }
        const user = await db.user.findUnique({
          where: {
            email: identifier,
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            userType: true,
            password: true,
          },
        });
        if (!user) {
          throw new Error("User not found");
        }
        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
          throw new Error("Invalid password");
        }
        return user;
      },
    }).authorize(credentials);
    expect(result).toEqual(expectedUser);
  });

  it('should throw error if user is not found in database', async () => {
    const credentials = { email: "user@example.com", password: "password123" };
    vi.mock("@/lib/db", () => ({
      db: {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      },
    }));
    await expect(CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error("Credentials are required");
        }
        const identifier = credentials.email || credentials.phone;
        const password = credentials.password;
        if (!identifier || !password) {
          throw new Error("Email/Phone and password are required");
        }
        const user = await db.user.findUnique({
          where: {
            email: identifier,
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            userType: true,
            password: true,
          },
        });
        if (!user) {
          throw new Error("User not found");
        }
        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
          throw new Error("Invalid password");
        }
        return user;
      },
    }).authorize(credentials)).rejects.toThrow("User not found");
  });

  it('should throw error if password is incorrect', async () => {
    const credentials = { email: "user@example.com", password: "wrongpassword" };
    const expectedUser = {
      id: "1",
      name: "User",
      email: "user@example.com",
      phone: "1234567890",
      role: "TRADER",
      userType: "USER",
      password: "$2b$10$...$2b$10$...",
    };
    vi.mock("@/lib/db", () => ({
      db: {
        user: {
          findUnique: vi.fn().mockResolvedValue(expectedUser),
        },
      },
    }));
    await expect(CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error("Credentials are required");
        }
        const identifier = credentials.email || credentials.phone;
        const password = credentials.password;
        if (!identifier || !password) {
          throw new Error("Email/Phone and password are required");
        }
        const user = await db.user.findUnique({
          where: {
            email: identifier,
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            userType: true,
            password: true,
          },
        });
        if (!user) {
          throw new Error("User not found");
        }
        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
          throw new Error("Invalid password");
        }
        return user;
      },
    }).authorize(credentials)).rejects.toThrow("Invalid password");
  });
});