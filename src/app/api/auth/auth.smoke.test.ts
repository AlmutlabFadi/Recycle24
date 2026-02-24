import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Auth smoke", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.DEMO_MODE;
    process.env.DATABASE_URL = "test-db-url";
  });

  it("registers then logs in with email in demo mode", async () => {
    process.env.DEMO_MODE = "true";

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
    const users = new Map<string, { id: string; email: string; password: string; name: string; userType: string; status: string }>();

    vi.doMock("@/lib/db", () => ({
      db: {
        user: {
          findUnique: vi.fn(async ({ where }: { where: { email?: string; phone?: string } }) => {
            if (where.email) return users.get(where.email) ?? null;
            return null;
          }),
          create: vi.fn(async ({ data }: { data: { email?: string; password: string; name: string; userType: string } }) => {
            const user = {
              id: `u_${users.size + 1}`,
              email: data.email ?? "",
              password: data.password,
              name: data.name,
              userType: data.userType,
              status: "PENDING",
            };
            users.set(user.email, user);
            return user;
          }),
          findFirst: vi.fn(async ({ where }: { where: { OR: Array<{ email?: string; phone?: string }> } }) => {
            const emailCandidate = where.OR.find((v) => Boolean(v.email))?.email;
            if (!emailCandidate) return null;
            return users.get(emailCandidate) ?? null;
          }),
        },
      },
    }));

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
