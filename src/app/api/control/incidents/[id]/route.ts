import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
    enforceControlKillSwitch,
    enforceControlNonce,
    enforceControlRateLimit,
    getRequestMeta,
    isKillSwitchError,
    recordControlAudit,
    requireControlAccess,
} from "@/lib/control/security";

// GET: Get incident details with linked alerts/events
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireControlAccess(request);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const { id } = await params;

        const incident = await db.incident.findUnique({ where: { id } });
        if (!incident) {
            return NextResponse.json({ success: false, error: "Incident not found" }, { status: 404 });
        }

        // Get linked alerts and events
        const links = await db.incidentLink.findMany({
            where: { incidentId: id },
        });

        const alertIds = links.filter(l => l.linkType === "alert").map(l => l.linkId);
        const eventIds = links.filter(l => l.linkType === "event").map(l => l.linkId);

        const linkedAlerts = alertIds.length > 0 ? await db.ctAlert.findMany({
            where: { id: { in: alertIds } },
        }) : [];

        const linkedEvents = eventIds.length > 0 ? await db.controlEvent.findMany({
            where: { id: { in: eventIds } },
        }) : [];

        // Related actions
        const actions = await db.controlAction.findMany({
            where: { incidentId: id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            success: true,
            data: {
                incident,
                linkedAlerts,
                linkedEvents,
                actions,
            },
        });
    } catch (error) {
        if (isKillSwitchError(error)) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

// PATCH: Update incident status
export async function PATCH(
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
            routeKey: "control:incidents:update",
            limit: 12,
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
        const { status, summary } = body;

        const incident = await db.incident.findUnique({ where: { id } });
        if (!incident) {
            return NextResponse.json({ success: false, error: "Incident not found" }, { status: 404 });
        }

        const validStatuses = ["open", "investigating", "contained", "closed"];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
        }

        const timeline = (incident.timeline as any[]) || [];
        timeline.push({
            ts: new Date().toISOString(),
            action: `status_changed_to_${status}`,
            by: auth.actor.userId,
        });

        const updated = await db.incident.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(summary && { summary }),
                timeline,
            },
        });

        const meta = getRequestMeta(request);
        await recordControlAudit({
            actorUserId: auth.actor.userId,
            actorRole: auth.actor.role,
            actionType: `INCIDENT.${status?.toUpperCase() || "UPDATED"}`,
            entityType: "Incident",
            entityId: id,
            requestId: meta.requestId,
            ip: meta.ip,
            userAgent: meta.userAgent,
            payload: { status, summary },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        if (isKillSwitchError(error)) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
