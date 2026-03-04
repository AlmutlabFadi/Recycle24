import { db } from "@/lib/db";
import { emitAlert, emitControlEvent } from "@/lib/control/emit-event";

/**
 * Detection Rules Engine — MVP
 * Run periodically (cron) or on specific triggers.
 */

/* ── Rule 1: API Abuse Detection ── */
export async function detectApiAbuse(): Promise<void> {
    try {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

        // Find IPs with >200 events in last 5 minutes
        const result = await db.controlEvent.groupBy({
            by: ["ip"],
            where: {
                ts: { gte: fiveMinAgo },
                ip: { not: null },
            },
            _count: true,
            having: {
                ip: { _count: { gt: 200 } },
            },
        });

        for (const row of result) {
            if (!row.ip) continue;

            // Check if we already have an open alert for this IP
            const existing = await db.ctAlert.findFirst({
                where: {
                    ruleKey: "API_ABUSE_DETECTED",
                    status: { in: ["open", "ack"] },
                    evidence: { path: ["ip"], equals: row.ip },
                },
            });

            if (!existing) {
                await emitAlert({
                    severity: "critical",
                    ruleKey: "API_ABUSE_DETECTED",
                    title: `نشاط مشبوه: ${row._count} طلب من ${row.ip}`,
                    description: `تم اكتشاف ${row._count} طلب في 5 دقائق من عنوان IP واحد.`,
                    evidence: { ip: row.ip, requestCount: row._count, window: "5m" },
                });
            }
        }
    } catch (error) {
        console.error("[Detection] API Abuse check failed:", error);
    }
}

/* ── Rule 2: Bid Velocity Anomaly ── */
export async function detectBidVelocity(): Promise<void> {
    try {
        const oneMinAgo = new Date(Date.now() - 60 * 1000);

        // Find auctions with >10 bids in last minute
        const result = await db.controlEvent.groupBy({
            by: ["entityId"],
            where: {
                ts: { gte: oneMinAgo },
                eventType: "AUCTION.BID_PLACED",
                entityType: "auction",
                entityId: { not: null },
            },
            _count: true,
            having: {
                entityId: { _count: { gt: 10 } },
            },
        });

        for (const row of result) {
            if (!row.entityId) continue;

            const existing = await db.ctAlert.findFirst({
                where: {
                    ruleKey: "BID_VELOCITY_ANOMALY",
                    status: { in: ["open", "ack"] },
                    evidence: { path: ["auctionId"], equals: row.entityId },
                },
            });

            if (!existing) {
                await emitAlert({
                    severity: "high",
                    ruleKey: "BID_VELOCITY_ANOMALY",
                    title: `سرعة مزايدة غير طبيعية في المزاد ${row.entityId}`,
                    description: `${row._count} مزايدة في أقل من دقيقة واحدة.`,
                    evidence: { auctionId: row.entityId, bidCount: row._count, window: "1m" },
                });
            }
        }
    } catch (error) {
        console.error("[Detection] Bid Velocity check failed:", error);
    }
}

/* ── Rule 3: Settlement Delay ── */
export async function detectSettlementDelay(): Promise<void> {
    try {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

        // Find failed settlement events in last 2 hours
        const failedSettlements = await db.controlEvent.count({
            where: {
                ts: { gte: twoHoursAgo },
                eventType: { in: ["LEDGER.SETTLEMENT_FAILED", "LEDGER.TRANSFER_FAILED"] },
            },
        });

        if (failedSettlements >= 3) {
            const existing = await db.ctAlert.findFirst({
                where: {
                    ruleKey: "SETTLEMENT_DELAY",
                    status: { in: ["open", "ack"] },
                    createdAt: { gte: twoHoursAgo },
                },
            });

            if (!existing) {
                await emitAlert({
                    severity: "high",
                    ruleKey: "SETTLEMENT_DELAY",
                    title: `تأخر في تسوية ${failedSettlements} معاملات مالية`,
                    description: `${failedSettlements} معاملات فشلت في آخر ساعتين.`,
                    evidence: { failedCount: failedSettlements, window: "2h" },
                });
            }
        }
    } catch (error) {
        console.error("[Detection] Settlement Delay check failed:", error);
    }
}

/* ── Run All Rules ── */
export async function runAllDetectionRules(): Promise<{ rulesRun: number; timestamp: string }> {
    await Promise.allSettled([
        detectApiAbuse(),
        detectBidVelocity(),
        detectSettlementDelay(),
    ]);

    await emitControlEvent({
        sourceComponentKey: "waf",
        eventType: "DETECTION.RULES_EXECUTED",
        severity: "info",
        payload: { rulesRun: 3, timestamp: new Date().toISOString() },
    });

    return { rulesRun: 3, timestamp: new Date().toISOString() };
}
