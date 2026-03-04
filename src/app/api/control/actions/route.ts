import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitControlEvent } from "@/lib/control/emit-event";

// GET: List actions with filters
export async function GET(request: NextRequest) {
    try {
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
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

// POST: Request a new containment action
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, reason, scope, requestedByUserId, incidentId } = body;

        // Validate required fields
        if (!type || !reason || !scope || !requestedByUserId) {
            return NextResponse.json(
                { success: false, error: "type, reason, scope, and requestedByUserId are required" },
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
                requestedByUserId,
                reason,
                scope: scope || {},
                incidentId: incidentId || null,
                result: {},
            },
        });

        // Audit log
        await db.auditLog.create({
            data: {
                actorRole: "ADMIN",
                actorId: requestedByUserId,
                action: "ACTION.REQUESTED",
                entityType: "ControlAction",
                entityId: action.id,
                afterJson: { type, reason, scope },
            },
        });

        // Emit control event
        await emitControlEvent({
            sourceComponentKey: "auth",
            eventType: `ACTION.REQUESTED.${type}`,
            severity: "warn",
            actorUserId: requestedByUserId,
            entityType: "action",
            entityId: action.id,
            payload: { type, reason, scope },
        });

        return NextResponse.json({ success: true, data: action });
    } catch (error) {
        console.error("Action request error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
