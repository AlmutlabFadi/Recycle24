import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        // 1. System Components
        const components = await db.systemComponent.findMany({
            orderBy: { criticality: "desc" },
        });

        // 2. Alert counts by severity (open only)
        const alertCounts = await db.ctAlert.groupBy({
            by: ["severity"],
            where: { status: { in: ["open", "ack"] } },
            _count: true,
        });

        const alertSummary = {
            critical: 0, high: 0, medium: 0, low: 0, total: 0,
        };
        for (const ac of alertCounts) {
            const sev = ac.severity as keyof typeof alertSummary;
            if (sev in alertSummary) alertSummary[sev] = ac._count;
            alertSummary.total += ac._count;
        }

        // 3. Latest events (last 50)
        const latestEvents = await db.controlEvent.findMany({
            take: 50,
            orderBy: { ts: "desc" },
        });

        // 4. Kill switches
        const killSwitches = await db.killSwitch.findMany({
            orderBy: { key: "asc" },
        });

        // 5. Active incidents
        const activeIncidents = await db.incident.findMany({
            where: { status: { in: ["open", "investigating"] } },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        // 6. Pending actions
        const pendingActions = await db.controlAction.findMany({
            where: { status: "pending" },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        // 7. Open alerts (latest 20)
        const openAlerts = await db.ctAlert.findMany({
            where: { status: { in: ["open", "ack"] } },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        // 8. Event counts for last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const eventCountLast24h = await db.controlEvent.count({
            where: { ts: { gte: oneDayAgo } },
        });

        // 9. Critical events last 1h
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const criticalEventsLastHour = await db.controlEvent.count({
            where: { ts: { gte: oneHourAgo }, severity: "critical" },
        });

        return NextResponse.json({
            success: true,
            data: {
                components,
                alertSummary,
                latestEvents,
                killSwitches,
                activeIncidents,
                pendingActions,
                openAlerts,
                metrics: {
                    eventsLast24h: eventCountLast24h,
                    criticalLastHour: criticalEventsLastHour,
                },
            },
        });
    } catch (error) {
        console.error("Control overview error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
