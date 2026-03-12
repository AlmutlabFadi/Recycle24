import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enforceInMemoryRateLimit } from "@/lib/security/request-rate-limit";

describe("request rate limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within the limit", () => {
    const first = enforceInMemoryRateLimit("wallet:test", 2, 60_000);
    const second = enforceInMemoryRateLimit("wallet:test", 2, 60_000);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
  });

  it("blocks requests after the limit is exceeded", () => {
    enforceInMemoryRateLimit("wallet:block", 2, 60_000);
    enforceInMemoryRateLimit("wallet:block", 2, 60_000);

    const third = enforceInMemoryRateLimit("wallet:block", 2, 60_000);

    expect(third.ok).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window expires", () => {
    enforceInMemoryRateLimit("wallet:reset", 1, 60_000);

    const blocked = enforceInMemoryRateLimit("wallet:reset", 1, 60_000);
    expect(blocked.ok).toBe(false);

    vi.advanceTimersByTime(60_001);

    const afterReset = enforceInMemoryRateLimit("wallet:reset", 1, 60_000);
    expect(afterReset.ok).toBe(true);
  });
});
