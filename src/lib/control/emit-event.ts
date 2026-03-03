import { db } from "@/lib/db";

/**
 * Emit a Control Event to the event stream.
 * Call this from any API route / server action to log system activity.
 */
export async function emitControlEvent(params: {
    sourceComponentKey: string;
    eventType: string;
    severity?: "info" | "warn" | "critical";
    tenantCountry?: string;
    actorUserId?: string;
    entityType?: string;
    entityId?: string;
    traceId?: string;
    ip?: string;
    payload?: any;
}) {
    try {
        const event = await db.controlEvent.create({
            data: {
                sourceComponentKey: params.sourceComponentKey,
                eventType: params.eventType,
                severity: params.severity || "info",
                tenantCountry: params.tenantCountry,
                actorUserId: params.actorUserId,
                entityType: params.entityType,
                entityId: params.entityId,
                traceId: params.traceId,
                ip: params.ip,
                payload: params.payload || {},
            },
        });
        return event;
    } catch (error) {
        console.error("[ControlEvent] Failed to emit:", error);
        return null;
    }
}

/**
 * Helper to emit and create an alert based on a detection rule.
 */
export async function emitAlert(params: {
    severity: "low" | "medium" | "high" | "critical";
    ruleKey: string;
    title: string;
    description?: string;
    evidence?: any;
}) {
    try {
        const alert = await db.ctAlert.create({
            data: {
                status: "open",
                severity: params.severity,
                ruleKey: params.ruleKey,
                title: params.title,
                description: params.description,
                evidence: params.evidence || {},
            },
        });
        // Also emit a control event for the alert
        await emitControlEvent({
            sourceComponentKey: "waf",
            eventType: `ALERT.${params.ruleKey}`,
            severity: params.severity === "critical" ? "critical" : params.severity === "high" ? "warn" : "info",
            entityType: "alert",
            entityId: alert.id,
            payload: { ruleKey: params.ruleKey, title: params.title },
        });
        return alert;
    } catch (error) {
        console.error("[ControlAlert] Failed to emit:", error);
        return null;
    }
}
