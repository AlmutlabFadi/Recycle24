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

// POST: Approve or reject a pending action
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await enforceControlKillSwitch();
        const auth = await requireControlAccess(request);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const rate = await enforceControlRateLimit({
            actorUserId: auth.actor.userId,
            routeKey: "control:actions:approve",
            limit: 6,
            windowMs: 60_000,
        });
        if (!rate.ok) {
            return NextResponse.json({ success: false, error: rate.error, retryAfter: rate.retryAfter }, { status: rate.status });
        }

        const nonce = await enforceControlNonce(request, auth.actor.userId);
        if (!nonce.ok) {
            return NextResponse.json({ success: false, error: nonce.error }, { status: nonce.status });
        }

        const { id } = await params;
        const body = await request.json();
        const { decision, reason } = body;

        if (!decision) {
            return NextResponse.json(
                { success: false, error: "decision (approve|reject) is required" },
                { status: 400 }
            );
        }

        if (!["approve", "reject"].includes(decision)) {
            return NextResponse.json(
                { success: false, error: "decision must be 'approve' or 'reject'" },
                { status: 400 }
            );
        }

        // Find the action
        const action = await db.controlAction.findUnique({ where: { id } });
        if (!action) {
            return NextResponse.json({ success: false, error: "Action not found" }, { status: 404 });
        }

        if (action.status !== "pending") {
            return NextResponse.json(
                { success: false, error: `Action is '${action.status}', not pending` },
                { status: 400 }
            );
        }

        // Two-person rule: approver must be different from requester
        if (action.requestedByUserId === auth.actor.userId) {
            return NextResponse.json(
                { success: false, error: "Cannot approve your own action (two-person rule)" },
                { status: 403 }
            );
        }

        if (decision === "approve") {
            // Update action to approved
            const updated = await db.controlAction.update({
                where: { id },
                data: {
                    status: "approved",
                    approvedByUserId: auth.actor.userId,
                    approvedAt: new Date(),
                },
            });

            // Auto-execute simple actions
            const autoExecuteTypes = ["FREEZE_USER", "PAUSE_AUCTION", "BLOCK_IP", "FORCE_LOGOUT"];
            if (autoExecuteTypes.includes(action.type)) {
                await executeAction(id, action.type, action.scope as any);
            }

            // Audit
            const meta = getRequestMeta(request);
            await recordControlAudit({
                actorUserId: auth.actor.userId,
                actorRole: auth.actor.role,
                actionType: "ACTION.APPROVED",
                entityType: "ControlAction",
                entityId: id,
                requestId: meta.requestId,
                ip: meta.ip,
                userAgent: meta.userAgent,
                payload: { decision, type: action.type },
            });

            await emitControlEvent({
                sourceComponentKey: "auth",
                eventType: `ACTION.APPROVED.${action.type}`,
                severity: "warn",
                actorUserId: auth.actor.userId,
                entityType: "action",
                entityId: id,
                payload: { type: action.type, approvedBy: auth.actor.userId },
            });

            return NextResponse.json({ success: true, data: updated });
        } else {
            // Reject
            const updated = await db.controlAction.update({
                where: { id },
                data: {
                    status: "rejected",
                    result: { rejectedBy: auth.actor.userId, rejectionReason: reason || "No reason given" },
                },
            });

            const meta = getRequestMeta(request);
            await recordControlAudit({
                actorUserId: auth.actor.userId,
                actorRole: auth.actor.role,
                actionType: "ACTION.REJECTED",
                entityType: "ControlAction",
                entityId: id,
                requestId: meta.requestId,
                ip: meta.ip,
                userAgent: meta.userAgent,
                payload: { decision, reason },
            });

            return NextResponse.json({ success: true, data: updated });
        }
    } catch (error) {
        if (isKillSwitchError(error)) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        console.error("Action approve error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

// Auto-execute containment actions
async function executeAction(actionId: string, type: string, scope: any) {
    try {
        let result: any = {};

        switch (type) {
            case "FREEZE_USER":
                if (scope?.userId) {
                    await db.user.update({
                        where: { id: scope.userId },
                        data: { isActive: false },
                    });
                    result = { frozen: true, userId: scope.userId };
                }
                break;

            case "PAUSE_AUCTION":
                if (scope?.auctionId) {
                    await db.auction.update({
                        where: { id: scope.auctionId },
                        data: { status: "paused" },
                    });
                    result = { paused: true, auctionId: scope.auctionId };
                }
                break;

            case "BLOCK_IP":
                // IP blocking would be handled at WAF/reverse proxy level
                result = { blocked: true, ip: scope?.ip, note: "Requires WAF configuration" };
                break;

            case "FORCE_LOGOUT":
                // In a real implementation, invalidate sessions
                result = { loggedOut: true, userId: scope?.userId };
                break;
        }

        await db.controlAction.update({
            where: { id: actionId },
            data: {
                status: "executed",
                executedAt: new Date(),
                result,
            },
        });

        await emitControlEvent({
            sourceComponentKey: "auth",
            eventType: `ACTION.EXECUTED.${type}`,
            severity: "critical",
            entityType: "action",
            entityId: actionId,
            payload: { type, result },
        });
    } catch (error) {
        console.error(`Failed to execute action ${actionId}:`, error);
        await db.controlAction.update({
            where: { id: actionId },
            data: { status: "failed", result: { error: String(error) } },
        });
    }
}
