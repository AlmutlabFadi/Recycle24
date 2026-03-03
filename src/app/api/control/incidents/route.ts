import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitControlEvent } from "@/lib/control/emit-event";

// POST: Create a new incident (groups multiple alerts/events)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, severity, summary, ownerUserId, alertIds, eventIds, tags } = body;

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
                ownerUserId: ownerUserId || null,
                tags: tags || [],
                timeline: [{ ts: new Date().toISOString(), action: "created", by: ownerUserId }],
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
        await db.auditLog.create({
            data: {
                actorRole: "ADMIN",
                actorId: ownerUserId || "system",
                action: "INCIDENT.CREATED",
                entityType: "Incident",
                entityId: incident.id,
                afterJson: { title, severity, alertCount: alertIds?.length || 0 },
            },
        });

        await emitControlEvent({
            sourceComponentKey: "auth",
            eventType: "INCIDENT.CREATED",
            severity: severity === "critical" ? "critical" : "warn",
            actorUserId: ownerUserId,
            entityType: "incident",
            entityId: incident.id,
            payload: { title, severity, linkedAlerts: alertIds?.length || 0 },
        });

        return NextResponse.json({ success: true, data: incident });
    } catch (error) {
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
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
