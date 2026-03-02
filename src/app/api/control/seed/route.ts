import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
    try {
        // 1. System Components
        const components = [
            { key: "auction", name: "نظام المزادات", criticality: "critical", status: "healthy" },
            { key: "ledger", name: "دفتر الأستاذ المالي", criticality: "critical", status: "healthy" },
            { key: "payments", name: "بوابة الدفع", criticality: "critical", status: "healthy" },
            { key: "waf", name: "جدار الحماية (WAF)", criticality: "high", status: "healthy" },
            { key: "logistics", name: "اللوجستيات والشحن", criticality: "high", status: "healthy" },
            { key: "auth", name: "المصادقة والتحقق", criticality: "critical", status: "healthy" },
            { key: "notifications", name: "نظام الإشعارات", criticality: "medium", status: "healthy" },
            { key: "storage", name: "التخزين والملفات", criticality: "medium", status: "healthy" },
        ];

        for (const comp of components) {
            await db.systemComponent.upsert({
                where: { key: comp.key },
                update: { name: comp.name, criticality: comp.criticality, status: comp.status, lastHeartbeatAt: new Date() },
                create: { ...comp, lastHeartbeatAt: new Date() },
            });
        }

        // 2. Kill Switches
        const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
        const adminId = admin?.id || "system";

        const killSwitches = [
            { key: "AUCTIONS_GLOBAL", name: "إيقاف المزادات عالمياً", description: "يوقف جميع المزادات في كل الأسواق فوراً", state: "off", reason: "تهيئة أولية" },
            { key: "PAYMENTS_GLOBAL", name: "إيقاف الدفع عالمياً", description: "يوقف جميع عمليات الدفع والسحب", state: "off", reason: "تهيئة أولية" },
            { key: "NEW_REGISTRATIONS", name: "إيقاف التسجيل الجديد", description: "يمنع أي تسجيل حسابات جديدة", state: "off", reason: "تهيئة أولية" },
            { key: "VERIFICATION_SUBMISSIONS", name: "إيقاف طلبات التوثيق", description: "يمنع تقديم طلبات توثيق جديدة", state: "off", reason: "تهيئة أولية" },
            { key: "LOGISTICS_GLOBAL", name: "إيقاف الشحن والتوصيل", description: "يوقف جميع عمليات الشحن والتوصيل", state: "off", reason: "تهيئة أولية" },
        ];

        for (const ks of killSwitches) {
            await db.killSwitch.upsert({
                where: { key: ks.key },
                update: { name: ks.name, description: ks.description },
                create: { ...ks, updatedByUserId: adminId },
            });
        }

        // 3. Sample Alerts
        const existingAlerts = await db.ctAlert.count();
        if (existingAlerts === 0) {
            await db.ctAlert.createMany({
                data: [
                    { status: "open", severity: "critical", ruleKey: "API_ABUSE_DETECTED", title: "نشاط مشبوه: طلبات مفرطة من IP واحد", description: "تم اكتشاف 847 طلب في الدقيقة الواحدة.", evidence: { ip: "185.220.101.45", requestsPerMinute: 847 } },
                    { status: "open", severity: "high", ruleKey: "BID_VELOCITY_ANOMALY", title: "سرعة مزايدة غير طبيعية في المزاد #2847", description: "3 حسابات رفعت السعر 12 مرة في أقل من دقيقة.", evidence: { auctionId: "2847", accounts: 3, bidsInWindow: 12 } },
                    { status: "ack", severity: "medium", ruleKey: "SETTLEMENT_DELAY", title: "تأخر في تسوية 5 معاملات مالية", description: "5 معاملات معلقة لأكثر من ساعتين.", evidence: { pendingCount: 5, oldestAge: "2h 14m" }, acknowledgedAt: new Date() },
                ],
            });
        }

        // 4. Sample Events
        const existingEvents = await db.controlEvent.count();
        if (existingEvents === 0) {
            await db.controlEvent.createMany({
                data: [
                    { sourceComponentKey: "auction", eventType: "AUCTION.CREATED", severity: "info", payload: { auctionId: "A-1001", title: "خردة حديد 500 كغ" } },
                    { sourceComponentKey: "auction", eventType: "AUCTION.BID_PLACED", severity: "info", payload: { auctionId: "A-1001", bidAmount: 175000 } },
                    { sourceComponentKey: "ledger", eventType: "LEDGER.DEPOSIT_HELD", severity: "info", payload: { amount: 50000, txnId: "TXN-5001" } },
                    { sourceComponentKey: "auth", eventType: "SECURITY.SUSPICIOUS_LOGIN", severity: "warn", payload: { ip: "192.168.1.100", reason: "new_device" } },
                    { sourceComponentKey: "waf", eventType: "SECURITY.IP_BLOCKED", severity: "critical", payload: { ip: "185.220.101.45", requestCount: 847 } },
                    { sourceComponentKey: "payments", eventType: "LEDGER.SETTLEMENT_FAILED", severity: "critical", payload: { settlementId: "STL-001", error: "gateway_timeout" } },
                    { sourceComponentKey: "logistics", eventType: "LOGISTICS.DELAY_REPORTED", severity: "warn", payload: { shipmentId: "SHP-201", delay: "3h" } },
                    { sourceComponentKey: "auction", eventType: "AUCTION.ENDED", severity: "info", payload: { auctionId: "A-999", finalPrice: 890000 } },
                ],
            });
        }

        return NextResponse.json({ success: true, message: "Control Tower data seeded successfully" });
    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
