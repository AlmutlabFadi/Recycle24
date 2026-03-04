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

// POST: Create a new incident (groups multiple alerts/events)
export async function POST(request: NextRequest) {
    try {
        await enforceControlKillSwitch();
        const auth = await requireControlAccess(request);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const rate = await enforceControlRateLimit({
            actorUserId: auth.actor.userId,
            routeKey: "control:incidents:create",
            limit: 10,
            windowMs: 60_000,
        });
        if (!rate.ok) {
            return NextResponse.json({ success: false, error: rate.error, retryAfter: rate.retryAfter }, { status: rate.status });
        }

        const nonce = await enforceControlNonce(request, auth.actor.userId);
        if (!nonce.ok) {
            return NextResponse.json({ success: false, error: nonce.error }, { status: nonce.status });
        }

        const body = await request.json();
        const { title, severity, summary, alertIds, eventIds, tags } = body;

        if (!title || !severity) {
            return NextResponse.json(
                { success: false, error: "title and severity are required" },
                { status: 400 }
            );
        }

        const incident = await db.incident.create({
            data: {
                status: "open",
                severity,
                title,
                summary: summary || "",
                ownerUserId: auth.actor.userId,
                tags: tags || [],
                timeline: [{ ts: new Date().toISOString(), action: "created", by: auth.actor.userId }],
            },
        });

        // Link alerts to incident
        if (alertIds && Array.isArray(alertIds)) {
            for (const alertId of alertIds) {
                await db.incidentLink.create({
                    data: { incidentId: incident.id, linkType: "alert", linkId: alertId },
                });
            }
        }

        // Link events to incident
        if (eventIds && Array.isArray(eventIds)) {
            for (const eventId of eventIds) {
                await db.incidentLink.create({
                    data: { incidentId: incident.id, linkType: "event", linkId: eventId },
                });
            }
        }

        // Audit + Event
        const meta = getRequestMeta(request);
        await recordControlAudit({
            actorUserId: auth.actor.userId,
            actorRole: auth.actor.role,
            actionType: "INCIDENT.CREATED",
            entityType: "Incident",
            entityId: incident.id,
            requestId: meta.requestId,
            ip: meta.ip,
            userAgent: meta.userAgent,
            payload: { title, severity, alertCount: alertIds?.length || 0 },
        });

        await emitControlEvent({
            sourceComponentKey: "auth",
            eventType: "INCIDENT.CREATED",
            severity: severity === "critical" ? "critical" : "warn",
            actorUserId: auth.actor.userId,
            entityType: "incident",
            entityId: incident.id,
            payload: { title, severity, linkedAlerts: alertIds?.length || 0 },
        });

        return NextResponse.json({ success: true, data: incident });
    } catch (error) {
        if (isKillSwitchError(error)) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        console.error("Incident create error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

// GET: List incidents
export async function GET(request: NextRequest) {
    try {
        const auth = await requireControlAccess(request);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

        const where: any = {};
        if (status) where.status = status;

        const incidents = await db.incident.findMany({
            where,
            take: limit,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, data: incidents });
    } catch (error) {
        if (isKillSwitchError(error)) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
