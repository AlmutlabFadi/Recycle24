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

export async function requireControlAccess(request: NextRequest): Promise<
    | { ok: true; actor: ControlActor }
    | { ok: false; status: number; error: string }
> {
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
    const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
    return { ip, userAgent, requestId };
}

export async function enforceControlKillSwitch() {
    await guardKillSwitch("CONTROL_PLANE", "Control plane is disabled by kill switch");
}

export async function enforceControlNonce(request: NextRequest, actorUserId: string) {
    const nonce = request.headers.get("x-control-nonce");
    if (!nonce) {
        return { ok: false as const, status: 400, error: "Missing x-control-nonce" };
    }

    const now = new Date();
    await db.controlNonce.deleteMany({ where: { expiresAt: { lt: now } } });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    try {
        await db.controlNonce.create({
            data: {
                nonce,
                actorUserId,
                expiresAt,
            },
        });
        return { ok: true as const, nonce };
    } catch {
        return { ok: false as const, status: 409, error: "Nonce already used" };
    }
}

export async function enforceControlRateLimit(params: {
    actorUserId: string;
    routeKey: string;
    limit: number;
    windowMs: number;
}) {
    const { actorUserId, routeKey, limit, windowMs } = params;
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    const existing = await db.controlRateLimit.findUnique({
        where: { actorUserId_routeKey: { actorUserId, routeKey } },
    });

    if (!existing || existing.windowStart < windowStart) {
        await db.controlRateLimit.upsert({
            where: { actorUserId_routeKey: { actorUserId, routeKey } },
            create: { actorUserId, routeKey, windowStart: now, count: 1 },
            update: { windowStart: now, count: 1 },
        });
        return { ok: true as const };
    }

    if (existing.count >= limit) {
        const retryAfter = Math.max(1, Math.ceil((existing.windowStart.getTime() + windowMs - now.getTime()) / 1000));
        return { ok: false as const, status: 429, error: "Rate limit exceeded", retryAfter };
    }

    await db.controlRateLimit.update({
        where: { actorUserId_routeKey: { actorUserId, routeKey } },
        data: { count: { increment: 1 } },
    });

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
        ? crypto.createHash("sha256").update(JSON.stringify(params.payload)).digest("hex")
        : null;

    await db.controlAuditLog.create({
        data: {
            actorUserId: params.actorUserId,
            actorRole: params.actorRole,
            actionType: params.actionType,
            entityType: params.entityType,
            entityId: params.entityId ?? null,
            requestId: params.requestId,
            ip: params.ip,
            userAgent: params.userAgent,
            payloadHash,
            payload: params.payload ?? null,
        },
    });
}

export function isKillSwitchError(error: unknown): error is KillSwitchError {
    return error instanceof KillSwitchError;
}
