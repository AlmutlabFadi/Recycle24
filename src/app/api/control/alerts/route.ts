import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch alerts with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const severity = searchParams.get("severity");
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

        const where: any = {};
        if (status) where.status = status;
        if (severity) where.severity = severity;

        const alerts = await db.ctAlert.findMany({
            where,
            take: limit,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, data: alerts });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

// POST: Acknowledge an alert (pass alertId in body)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { alertId, action, userId, reason } = body;

        if (!alertId || !action) {
            return NextResponse.json({ success: false, error: "alertId and action required" }, { status: 400 });
        }

        const alert = await db.ctAlert.findUnique({ where: { id: alertId } });
        if (!alert) {
            return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 });
        }

        let updateData: any = {};

        switch (action) {
            case "ack":
                updateData = { status: "ack", acknowledgedByUserId: userId, acknowledgedAt: new Date() };
                break;
            case "resolve":
                updateData = { status: "resolved", resolvedByUserId: userId, resolvedAt: new Date() };
                break;
            case "false_positive":
                updateData = { status: "false_positive", resolvedByUserId: userId, resolvedAt: new Date() };
                break;
            case "snooze":
                updateData = { status: "snoozed" };
                break;
            default:
                return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }

        const updated = await db.ctAlert.update({
            where: { id: alertId },
            data: updateData,
        });

        // Audit log
        await db.auditLog.create({
            data: {
                actorRole: "ADMIN",
                actorId: userId || "system",
                action: `ALERT.${action.toUpperCase()}`,
                entityType: "CtAlert",
                entityId: alertId,
                afterJson: { action, reason },
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
