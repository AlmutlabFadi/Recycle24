import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch events with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");
        const severity = searchParams.get("severity");
        const source = searchParams.get("source");
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

        const where: any = {};
        if (type) where.eventType = { startsWith: type };
        if (severity) where.severity = severity;
        if (source) where.sourceComponentKey = source;

        const events = await db.controlEvent.findMany({
            where,
            take: limit,
            orderBy: { ts: "desc" },
        });

        return NextResponse.json({ success: true, data: events });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

// POST: Write a new event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sourceComponentKey, eventType, severity, tenantCountry, actorUserId, entityType, entityId, traceId, ip, payload } = body;

        if (!sourceComponentKey || !eventType) {
            return NextResponse.json({ success: false, error: "sourceComponentKey and eventType are required" }, { status: 400 });
        }

        const event = await db.controlEvent.create({
            data: {
                sourceComponentKey,
                eventType,
                severity: severity || "info",
                tenantCountry,
                actorUserId,
                entityType,
                entityId,
                traceId,
                ip,
                payload: payload || {},
            },
        });

        return NextResponse.json({ success: true, event: { id: event.id, ts: event.ts } });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
