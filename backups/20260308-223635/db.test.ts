import { beforeEach, describe, expect, it, vi } from "vitest";

describe("db module", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.DEMO_MODE;
    delete process.env.DATABASE_URL;
  });

  it("exports a usable db instance when DATABASE_URL exists", async () => {
    process.env.DATABASE_URL = "postgres://test";

    vi.doMock("@prisma/client", () => ({
      PrismaClient: vi.fn(() => ({
        user: { findMany: vi.fn() },
      })),
    }));

    const mod = await import("@/lib/db");
    expect(mod.db).toBeTruthy();
    expect(typeof mod.db).toBe("object");
  });

  it("exports a usable db instance when DATABASE_URL is missing", async () => {
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