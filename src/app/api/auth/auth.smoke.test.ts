import { beforeEach, describe, expect, it, vi } from "vitest";

const createMockDb = () => {
  const users = new Map<string, { id: string; email?: string; phone?: string; password: string; name: string; userType: string; status: string }>();

  return {
    users,
    db: {
      user: {
        findUnique: vi.fn(async ({ where }: { where: { email?: string; phone?: string } }) => {
          if (where.email) return users.get(where.email) ?? null;
          if (where.phone) return users.get(where.phone) ?? null;
          return null;
        }),
        findFirst: vi.fn(async ({ where }: { where: { OR: Array<{ email?: string; phone?: string }> } }) => {
          const emailCandidate = where.OR.find((v) => Boolean(v.email))?.email;
          if (emailCandidate && users.has(emailCandidate)) return users.get(emailCandidate) ?? null;
          const phoneCandidate = where.OR.find((v) => Boolean(v.phone))?.phone;
          if (!phoneCandidate) return null;
          return Array.from(users.values()).find((u) => u.phone === phoneCandidate) ?? null;
        }),
        create: vi.fn(async ({ data }: { data: { email?: string; phone?: string; password: string; name: string; userType: string; status: string; firstName?: string | null; lastName?: string | null; titleId?: string | null; gender?: string } }) => {
          const user = {
            id: `u_${users.size + 1}`,
            email: data.email,
            phone: data.phone,
            password: data.password,
            name: data.name,
            userType: data.userType,
            status: data.status,
          };
          if (user.email) users.set(user.email, user);
          if (user.phone) users.set(user.phone, user);
          return user;
        }),
      },
      wallet: {
        create: vi.fn(async ({ data }: { data: { userId: string; balanceSYP: number; balanceUSD: number } }) => ({ id: `w_${data.userId}` })),
      },
      recyclePoints: {
        upsert: vi.fn(async () => ({ id: "rp_1" })),
      },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({
        user: {
          create: async (args: { data: { phone?: string | null; email?: string | null; password: string; name: string; userType: string; status: string; firstName?: string | null; lastName?: string | null; titleId?: string | null; gender?: string } }) => {
            const user = {
              id: `u_${users.size + 1}`,
              email: args.data.email ?? undefined,
              phone: args.data.phone ?? undefined,
              password: args.data.password,
              name: args.data.name,
              userType: args.data.userType,
              status: args.data.status,
            };
            if (user.email) users.set(user.email, user);
            if (user.phone) users.set(user.phone, user);
            return user;
          },
        },
        wallet: {
          create: async (args: { data: { userId: string; balanceSYP: number; balanceUSD: number } }) => ({ id: `w_${args.data.userId}` }),
        },
      })),
    },
  };
};

describe("Auth smoke", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.DEMO_MODE;
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/recycle24_test";
  });

  it("registers then logs in with email in demo mode", async () => {
    process.env.DEMO_MODE = "true";

    const { db } = createMockDb();
    vi.doMock("@/lib/db", () => ({ db, isDemoMode: true }));

    const { POST: registerPost } = await import("./register/route");
    const { POST: loginPost } = await import("./login/route");

    const email = `smoke${Date.now()}@test.com`;
    const password = "123456";

    const registerReq = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name: "Smoke Email", userType: "TRADER" }),
    });

    const registerRes = await registerPost(registerReq as never);
    expect(registerRes.status).toBe(200);

    const loginReq = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const loginRes = await loginPost(loginReq as never);
    const loginBody = await loginRes.json();

    expect(loginRes.status).toBe(200);
    expect(loginBody.success).toBe(true);
    expect(loginBody.user.email).toBe(email);
  });

  it("registers then logs in with phone in demo mode", async () => {
    process.env.DEMO_MODE = "true";

    const { db } = createMockDb();
    vi.doMock("@/lib/db", () => ({ db, isDemoMode: true }));

    const { POST: registerPost } = await import("./register/route");
    const { POST: loginPost } = await import("./login/route");

    const phone = `099${String(Date.now()).slice(-7)}`;
    const password = "123456";

    const registerReq = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, password, name: "Smoke Phone", userType: "TRADER" }),
    });

    const registerRes = await registerPost(registerReq as never);
    expect(registerRes.status).toBe(200);

    const loginReq = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });

    const loginRes = await loginPost(loginReq as never);
    const loginBody = await loginRes.json();

    expect(loginRes.status).toBe(200);
    expect(loginBody.success).toBe(true);
    expect(loginBody.user.phone).toBe(phone);
  });

  it("registers then logs in with email in db mode", async () => {
    const { db, users } = createMockDb();
    vi.doMock("@/lib/db", () => ({ db, isDemoMode: false }));

    const { POST: registerPost } = await import("./register/route");
    const { POST: loginPost } = await import("./login/route");

    const email = `dbsmoke${Date.now()}@test.com`;
    const password = "123456";

    const registerReq = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name: "Smoke DB", userType: "TRADER" }),
    });

    const registerRes = await registerPost(registerReq as never);
    expect(registerRes.status).toBe(200);

    const stored = users.get(email);
    expect(stored).toBeTruthy();
    expect(stored?.password).not.toBe(password);

    const loginReq = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const loginRes = await loginPost(loginReq as never);
    const loginBody = await loginRes.json();

    expect(loginRes.status).toBe(200);
    expect(loginBody.success).toBe(true);
    expect(loginBody.user.email).toBe(email);

  });
});
