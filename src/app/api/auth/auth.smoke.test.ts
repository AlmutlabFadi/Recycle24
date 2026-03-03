import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockUser = {
  id: string;
  email?: string;
  phone?: string;
  password: string;
  name: string;
  userType: string;
  status: string;
  firstName?: string | null;
  lastName?: string | null;
  titleId?: string | null;
  gender?: string;
};

const createMockDb = () => {
  const users = new Map<string, MockUser>();

  const findByPhone = (phone?: string | null) => {
    if (!phone) return null;
    return Array.from(users.values()).find((u) => u.phone === phone) ?? null;
  };

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
          return findByPhone(phoneCandidate);
        }),
        create: vi.fn(async ({ data }: { data: { email?: string; phone?: string; password: string; name: string; userType: string; status: string; firstName?: string | null; lastName?: string | null; titleId?: string | null; gender?: string } }) => {
          const user: MockUser = {
            id: `u_${users.size + 1}`,
            email: data.email,
            phone: data.phone,
            password: data.password,
            name: data.name,
            userType: data.userType,
            status: data.status,
            firstName: data.firstName ?? null,
            lastName: data.lastName ?? null,
            titleId: data.titleId ?? null,
            gender: data.gender,
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
      $transaction: vi.fn(async (callback: (tx: { user: { create: (args: { data: { phone?: string | null; email?: string | null; password: string; name: string; userType: string; status: string; firstName?: string | null; lastName?: string | null; titleId?: string | null; gender?: string } }) => Promise<MockUser> }; wallet: { create: (args: { data: { userId: string; balanceSYP: number; balanceUSD: number } }) => Promise<{ id: string }> } }) => Promise<unknown>) => callback({
        user: {
          create: async (args: { data: { phone?: string | null; email?: string | null; password: string; name: string; userType: string; status: string; firstName?: string | null; lastName?: string | null; titleId?: string | null; gender?: string } }) => {
            const user: MockUser = {
              id: `u_${users.size + 1}`,
              email: args.data.email ?? undefined,
              phone: args.data.phone ?? undefined,
              password: args.data.password,
              name: args.data.name,
              userType: args.data.userType,
              status: args.data.status,
              firstName: args.data.firstName ?? null,
              lastName: args.data.lastName ?? null,
              titleId: args.data.titleId ?? null,
              gender: args.data.gender,
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

let mockDb: ReturnType<typeof createMockDb>["db"];
let mockIsDemoMode = false;

vi.mock("@/lib/db", () => ({
  db: mockDb,
  isDemoMode: mockIsDemoMode,
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn(async (password: string) => `hashed:${password}`),
  compare: vi.fn(async (password: string, hashed: string) => hashed === `hashed:${password}`),
}));

vi.mock("jsonwebtoken", () => ({
  sign: vi.fn(() => "test_token"),
}));

describe("Auth smoke", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    const { db } = createMockDb();
    mockDb = db;
    mockIsDemoMode = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("registers then logs in with email in demo mode", async () => {
    mockIsDemoMode = true;
    vi.stubEnv("DEMO_MODE", "true");
    const { POST: registerPost } = await import("./register/route");
    const { POST: loginPost } = await import("./login/route");

    const email = "smoke@test.com";
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
    expect(loginBody.token).toBe("test_token");
  });

  it("registers then logs in with phone in demo mode", async () => {
    mockIsDemoMode = true;
    vi.stubEnv("DEMO_MODE", "true");
    const { POST: registerPost } = await import("./register/route");
    const { POST: loginPost } = await import("./login/route");

    const phone = "0991234567";
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
    expect(loginBody.token).toBe("test_token");
  });

  it("registers then logs in with email in db mode", async () => {
    const { POST: registerPost } = await import("./register/route");
    const { POST: loginPost } = await import("./login/route");

    const email = "dbsmoke@test.com";
    const password = "123456";

    const registerReq = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name: "Smoke DB", userType: "TRADER" }),
    });

    const registerRes = await registerPost(registerReq as never);
    expect(registerRes.status).toBe(200);

    const { hash } = await import("bcryptjs");
    expect(hash).toHaveBeenCalledWith(password, 10);

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
    expect(loginBody.token).toBe("test_token");
  });
});
