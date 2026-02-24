import { beforeEach, describe, expect, it, vi } from "vitest";

describe("db module", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.DEMO_MODE;
    delete process.env.DATABASE_URL;
  });

  it("sets demo mode to true when DEMO_MODE=true", async () => {
    process.env.DEMO_MODE = "true";
    process.env.DATABASE_URL = "postgres://test";

    vi.doMock("@prisma/client", () => ({
      PrismaClient: vi.fn(() => ({ mock: true })),
    }));

    const mod = await import("@/lib/db");
    expect(mod.isDemoMode).toBe(true);
  });

  it("sets demo mode to true when DATABASE_URL is missing", async () => {
    vi.doMock("@prisma/client", () => ({
      PrismaClient: vi.fn(() => ({ mock: true })),
    }));

    const mod = await import("@/lib/db");
    expect(mod.isDemoMode).toBe(true);
  });

  it("sets demo mode to false with DATABASE_URL and DEMO_MODE not true", async () => {
    process.env.DEMO_MODE = "false";
    process.env.DATABASE_URL = "postgres://test";

    vi.doMock("@prisma/client", () => ({
      PrismaClient: vi.fn(() => ({ mock: true })),
    }));

    const mod = await import("@/lib/db");
    expect(mod.isDemoMode).toBe(false);
  });

  it("exports a usable prisma instance", async () => {
    vi.doMock("@prisma/client", () => ({
      PrismaClient: vi.fn(() => ({
      user: { findMany: vi.fn() },
      })),
    }));

    const mod = await import("@/lib/db");
    expect(mod.db).toBeTruthy();
    expect(typeof mod.db).toBe("object");
  });
});
