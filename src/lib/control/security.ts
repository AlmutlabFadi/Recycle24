import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { guardKillSwitch, KillSwitchError } from "@/lib/control/kill-switch";

const CONTROL_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "SECURITY_OPERATOR", "OWNER"]);

export type ControlActor = {
  userId: string;
  role: string;
};

type NonceStore = Set<string>;
type RateStoreValue = { count: number; expiresAt: number };
type RateStore = Map<string, RateStoreValue>;

declare global {
  // eslint-disable-next-line no-var
  var __controlNonceStore__: NonceStore | undefined;
  // eslint-disable-next-line no-var
  var __controlRateStore__: RateStore | undefined;
}

const nonceStore: NonceStore = globalThis.__controlNonceStore__ ?? new Set<string>();
const rateStore: RateStore = globalThis.__controlRateStore__ ?? new Map<string, RateStoreValue>();

if (!globalThis.__controlNonceStore__) {
  globalThis.__controlNonceStore__ = nonceStore;
}

if (!globalThis.__controlRateStore__) {
  globalThis.__controlRateStore__ = rateStore;
}

export async function requireControlAccess(
  request: NextRequest
): Promise<{ ok: true; actor: ControlActor } | { ok: false; status: number; error: string }> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string; userType?: string } | undefined;

  if (!user?.id) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const role = user.role || user.userType || "UNKNOWN";
  if (!CONTROL_ROLES.has(role)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  const userRecord = await db.user.findUnique({
    where: { id: user.id },
    select: { status: true, isLocked: true },
  });

  if (!userRecord || userRecord.isLocked || userRecord.status !== "ACTIVE") {
    return { ok: false, status: 403, error: "Account disabled" };
  }

  return { ok: true, actor: { userId: user.id, role } };
}

export function getRequestMeta(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  return { ip, userAgent, requestId };
}

export async function enforceControlKillSwitch() {
  await guardKillSwitch("CONTROL_PLANE", "Control plane is disabled by kill switch");
}

export async function enforceControlNonce(
  request: NextRequest,
  actorUserId: string,
  routeKey: string
) {
  const nonce = request.headers.get("x-control-nonce");

  if (!nonce) {
    return { ok: false as const, status: 400, error: "Missing x-control-nonce" };
  }

  const compositeKey = `${actorUserId}:${routeKey}:${nonce}`;

  if (nonceStore.has(compositeKey)) {
    return { ok: false as const, status: 409, error: "Nonce already used" };
  }

  nonceStore.add(compositeKey);

  setTimeout(() => {
    nonceStore.delete(compositeKey);
  }, 5 * 60 * 1000);

  return { ok: true as const, nonce };
}

export async function enforceControlRateLimit(params: {
  actorUserId: string;
  routeKey: string;
  limit: number;
  windowMs: number;
}) {
  const { actorUserId, routeKey, limit, windowMs } = params;
  const now = Date.now();

  const bucketStart = Math.floor(now / windowMs) * windowMs;
  const key = `${actorUserId}:${routeKey}:${bucketStart}`;
  const current = rateStore.get(key);

  if (!current) {
    rateStore.set(key, {
      count: 1,
      expiresAt: bucketStart + windowMs,
    });

    return { ok: true as const };
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));
    return { ok: false as const, status: 429, error: "Rate limit exceeded", retryAfter };
  }

  current.count += 1;
  rateStore.set(key, current);

  return { ok: true as const };
}

export async function recordControlAudit(params: {
  actorUserId: string;
  actorRole: string;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  requestId: string;
  ip: string;
  userAgent: string;
  payload?: unknown;
}) {
  const payloadHash = params.payload
    ? crypto.createHash("sha256").update(stableStringify(params.payload)).digest("hex")
    : null;

  try {
    await (db as any).auditLog.create({
      data: {
        actorId: params.actorUserId,
        actorRole: params.actorRole,
        action: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        afterJson: params.payload ?? null,
        ip: params.ip,
        userAgent: params.userAgent,
        requestId: params.requestId,
        payloadHash,
      },
    });
  } catch (error) {
    console.warn("recordControlAudit skipped:", error);
  }
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return String(value);

  if (typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`);
  return `{${entries.join(",")}}`;
}

export function isKillSwitchError(error: unknown): error is KillSwitchError {
  return error instanceof KillSwitchError;
}