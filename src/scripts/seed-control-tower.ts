// Seed script for Control Tower initial data
// Run with: npx ts-node src/scripts/seed-control-tower.ts

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    console.log("🏗️  Seeding Control Tower data...\n");

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
        console.log(`  ✅ Component: ${comp.key} (${comp.name})`);
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
        console.log(`  🔑 KillSwitch: ${ks.key} (${ks.state})`);
    }

    // 3. Sample Alerts (for demo)
    const existingAlerts = await db.ctAlert.count();
    if (existingAlerts === 0) {
        const sampleAlerts = [
            {
                status: "open",
                severity: "critical",
                ruleKey: "API_ABUSE_DETECTED",
                title: "نشاط مشبوه: طلبات مفرطة من IP واحد",
                description: "تم اكتشاف 847 طلب في الدقيقة الواحدة من عنوان IP 185.220.101.xx — يتجاوز الحد الآمن (500/min).",
                evidence: { ip: "185.220.101.45", requestsPerMinute: 847, endpoints: ["/api/auctions", "/api/bids"], timeWindow: "60s" },
            },
            {
                status: "open",
                severity: "high",
                ruleKey: "BID_VELOCITY_ANOMALY",
                title: "سرعة مزايدة غير طبيعية في المزاد #2847",
                description: "3 حسابات رفعت السعر 12 مرة في أقل من دقيقة. احتمال تلاعب.",
                evidence: { auctionId: "2847", accounts: 3, bidsInWindow: 12, windowSeconds: 58 },
            },
            {
                status: "ack",
                severity: "medium",
                ruleKey: "SETTLEMENT_DELAY",
                title: "تأخر في تسوية 5 معاملات مالية",
                description: "5 معاملات معلقة لأكثر من ساعتين بدون تسوية.",
                evidence: { pendingCount: 5, oldestAge: "2h 14m" },
                acknowledgedByUserId: adminId,
                acknowledgedAt: new Date(),
            },
        ];

        for (const alert of sampleAlerts) {
            await db.ctAlert.create({ data: alert });
        }
        console.log(`  🚨 Created ${sampleAlerts.length} sample alerts`);
    }

    // 4. Sample Control Events
    const existingEvents = await db.controlEvent.count();
    if (existingEvents === 0) {
        const sampleEvents = [
            { sourceComponentKey: "auction", eventType: "AUCTION.CREATED", severity: "info", payload: { auctionId: "A-1001", title: "خردة حديد 500 كغ", startPrice: 150000 } },
            { sourceComponentKey: "auction", eventType: "AUCTION.BID_PLACED", severity: "info", payload: { auctionId: "A-1001", bidAmount: 175000, bidderId: "user-001" } },
            { sourceComponentKey: "ledger", eventType: "LEDGER.DEPOSIT_HELD", severity: "info", payload: { amount: 50000, userId: "user-002", txnId: "TXN-5001" } },
            { sourceComponentKey: "auth", eventType: "SECURITY.SUSPICIOUS_LOGIN", severity: "warn", payload: { userId: "user-003", ip: "192.168.1.100", reason: "new_device" } },
            { sourceComponentKey: "waf", eventType: "SECURITY.IP_BLOCKED", severity: "critical", payload: { ip: "185.220.101.45", reason: "rate_limit_exceeded", requestCount: 847 } },
            { sourceComponentKey: "payments", eventType: "LEDGER.SETTLEMENT_FAILED", severity: "critical", payload: { settlementId: "STL-001", error: "gateway_timeout", amount: 320000 } },
            { sourceComponentKey: "logistics", eventType: "LOGISTICS.DELAY_REPORTED", severity: "warn", payload: { shipmentId: "SHP-201", delay: "3h", reason: "traffic" } },
            { sourceComponentKey: "auction", eventType: "AUCTION.ENDED", severity: "info", payload: { auctionId: "A-999", winner: "user-005", finalPrice: 890000 } },
        ];

        for (const evt of sampleEvents) {
            await db.controlEvent.create({ data: evt });
        }
        console.log(`  📡 Created ${sampleEvents.length} sample events`);
    }

    console.log("\n✅ Control Tower seed complete!");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => db.$disconnect());
