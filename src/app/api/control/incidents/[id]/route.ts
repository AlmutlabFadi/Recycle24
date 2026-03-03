import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Get incident details with linked alerts/events
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

// PATCH: Update incident status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, summary, userId } = body;

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
            by: userId,
        });

        const updated = await db.incident.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(summary && { summary }),
                timeline,
            },
        });

        await db.auditLog.create({
            data: {
                actorRole: "ADMIN",
                actorId: userId || "system",
                action: `INCIDENT.${status?.toUpperCase() || "UPDATED"}`,
                entityType: "Incident",
                entityId: id,
                afterJson: { status, summary },
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
