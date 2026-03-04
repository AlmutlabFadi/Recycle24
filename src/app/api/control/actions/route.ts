import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitControlEvent } from "@/lib/control/emit-event";
import {
    enforceControlKillSwitch,
    enforceControlNonce,
    enforceControlRateLimit,
    getRequestMeta,
    isKillSwitchError,
    recordControlAudit,
    requireControlAccess,
} from "@/lib/control/security";

// GET: List actions with filters
export async function GET(request: NextRequest) {
    try {
        const auth = await requireControlAccess(request);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const type = searchParams.get("type");
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

        const where: any = {};
        if (status) where.status = status;
        if (type) where.type = type;

        const actions = await db.controlAction.findMany({
            where,
            take: limit,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, data: actions });
    } catch (error) {
        if (isKillSwitchError(error)) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

// POST: Request a new containment action
export async function POST(request: NextRequest) {
    try {
        await enforceControlKillSwitch();
        const auth = await requireControlAccess(request);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const rate = await enforceControlRateLimit({
            actorUserId: auth.actor.userId,
            routeKey: "control:actions:create",
            limit: 10,
            windowMs: 60_000,
        });
        if (!rate.ok) {
            return NextResponse.json({ success: false, error: rate.error, retryAfter: rate.retryAfter }, { status: rate.status });
        }

        const nonce = await enforceControlNonce(request, auth.actor.userId, "control:actions:create");
        if (!nonce.ok) {
            return NextResponse.json({ success: false, error: nonce.error }, { status: nonce.status });
        }

        const body = await request.json();
        const { type, reason, scope, incidentId } = body;

        // Validate required fields
        if (!type || !reason || !scope) {
            return NextResponse.json(
                { success: false, error: "type, reason, and scope are required" },
                { status: 400 }
            );
        }

        // Validate action type
        const validTypes = [
            "FREEZE_USER", "UNFREEZE_USER",
            "PAUSE_AUCTION", "RESUME_AUCTION",
            "BLOCK_IP", "UNBLOCK_IP",
            "DISABLE_PAYMENT_GATEWAY", "ENABLE_PAYMENT_GATEWAY",
            "FORCE_LOGOUT", "RESET_PASSWORD",
        ];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { success: false, error: `Invalid type. Valid types: ${validTypes.join(", ")}` },
                { status: 400 }
            );
        }

        // Create the action with 'pending' status (needs approval)
        const action = await db.controlAction.create({
            data: {
                type,
                status: "pending",
                requestedByUserId: auth.actor.userId,
                reason,
                scope: scope || {},
                incidentId: incidentId || null,
                result: {},
            },
        });

        // Audit log
        const meta = getRequestMeta(request);
        await recordControlAudit({
            actorUserId: auth.actor.userId,
            actorRole: auth.actor.role,
            actionType: "ACTION.REQUESTED",
            entityType: "ControlAction",
            entityId: action.id,
            requestId: meta.requestId,
            ip: meta.ip,
            userAgent: meta.userAgent,
            payload: { type, reason, scope, incidentId },
        });

        // Emit control event
        await emitControlEvent({
            sourceComponentKey: "auth",
            eventType: `ACTION.REQUESTED.${type}`,
            severity: "warn",
            actorUserId: auth.actor.userId,
            entityType: "action",
            entityId: action.id,
            payload: { type, reason, scope },
        });

        return NextResponse.json({ success: true, data: action });
    } catch (error) {
        if (isKillSwitchError(error)) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        console.error("Action request error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
