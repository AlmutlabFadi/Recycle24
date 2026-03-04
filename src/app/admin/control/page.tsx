"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

/* ──────────────── Type Definitions ──────────────── */
interface SystemComponent {
    id: string; key: string; name: string; criticality: string; status: string;
    lastHeartbeatAt: string | null; meta: any;
}
interface ControlEvent {
    id: string; ts: string; sourceComponentKey: string; eventType: string;
    severity: string; actorUserId?: string; entityType?: string; entityId?: string;
    payload: any;
}
interface CtAlert {
    id: string; createdAt: string; status: string; severity: string;
    ruleKey: string; title: string; description?: string; evidence: any;
}
interface KillSwitchData {
    id: string; key: string; name: string; description?: string;
    state: string; updatedAt: string; reason: string;
}
interface OverviewData {
    components: SystemComponent[];
    alertSummary: { critical: number; high: number; medium: number; low: number; total: number };
    latestEvents: ControlEvent[];
    killSwitches: KillSwitchData[];
    openAlerts: CtAlert[];
    pendingActions: any[];
    metrics: { eventsLast24h: number; criticalLastHour: number };
}

/* ──────────────── Severity Configs ──────────────── */
const severityConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
    critical: { label: "حرج", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: "error" },
    high:     { label: "مرتفع", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "warning" },
    medium:   { label: "متوسط", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "info" },
    low:      { label: "منخفض", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "arrow_downward" },
    info:     { label: "معلومة", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30", icon: "info" },
    warn:     { label: "تحذير", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "warning" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    healthy:     { label: "سليم", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: "check_circle" },
    degraded:    { label: "متراجع", color: "text-amber-400", bg: "bg-amber-500/10", icon: "speed" },
    down:        { label: "معطل", color: "text-red-400", bg: "bg-red-500/10", icon: "cancel" },
    maintenance: { label: "صيانة", color: "text-blue-400", bg: "bg-blue-500/10", icon: "build" },
};

const sourceIcons: Record<string, string> = {
    auction: "gavel", ledger: "receipt_long", payments: "payments",
    waf: "shield", logistics: "local_shipping", auth: "lock",
    notifications: "notifications", storage: "cloud",
};

/* ──────────────── Helper Functions ──────────────── */
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
}

/* ──────────────── Main Page Component ──────────────── */
export default function ControlTowerPage() {
    const { user } = useAuth();
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [killSwitchReason, setKillSwitchReason] = useState("");
    const [togglingSwitch, setTogglingSwitch] = useState<string | null>(null);
    const [ackingAlert, setAckingAlert] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"events" | "alerts" | "actions">("events");

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/control/overview");
            const json = await res.json();
            if (json.success) {
                setData(json.data);
                setLastRefresh(new Date());
            }
        } catch (e) {
            console.error("Control Tower fetch error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // Auto-refresh every 15s
        return () => clearInterval(interval);
    }, [fetchData]);

    /* ── Kill Switch Toggle ── */
    async function toggleKillSwitch(key: string, currentState: string) {
        if (!killSwitchReason.trim()) {
            alert("يجب إدخال سبب التغيير");
            return;
        }
        setTogglingSwitch(key);
        try {
            const res = await fetch("/api/control/killswitch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    key,
                    state: currentState === "on" ? "off" : "on",
                    reason: killSwitchReason,
                    userId: user?.id,
                }),
            });
            const json = await res.json();
            if (json.success) {
                setKillSwitchReason("");
                fetchData();
            } else {
                alert(json.error || "فشل تحديث المفتاح");
            }
        } catch {
            alert("خطأ في الاتصال");
        } finally {
            setTogglingSwitch(null);
        }
    }

    /* ── Alert Acknowledge ── */
    async function acknowledgeAlert(alertId: string) {
        setAckingAlert(alertId);
        try {
            await fetch("/api/control/alerts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ alertId, action: "ack", userId: user?.id }),
            });
            fetchData();
        } catch {
            alert("فشل إقرار التنبيه");
        } finally {
            setAckingAlert(null);
        }
    }

    async function resolveAlert(alertId: string) {
        try {
            await fetch("/api/control/alerts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ alertId, action: "resolve", userId: user?.id }),
            });
            fetchData();
        } catch {
            alert("فشل حل التنبيه");
        }
    }

    /* ──────────────── Loading State ──────────────── */
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative mb-6">
                    <div className="size-20 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <span className="material-symbols-outlined !text-4xl text-primary animate-pulse">cell_tower</span>
                    </div>
                    <div className="absolute inset-0 size-20 border-2 border-primary/40 border-t-transparent rounded-3xl animate-spin"></div>
                </div>
                <h2 className="text-lg font-bold text-white mb-1">جاري تحميل برج المراقبة...</h2>
                <p className="text-xs text-slate-500">يتم جلب بيانات الوقت الفعلي من كافة الأنظمة</p>
            </div>
        );
    }

    if (!data) return null;

    const activeKillSwitches = data.killSwitches.filter(ks => ks.state === "on");
    const downComponents = data.components.filter(c => c.status === "down");

    /* ──────────────── RENDER ──────────────── */
    return (
        <div className="space-y-5 max-w-[1400px] mx-auto">

            {/* ═══════════ CRITICAL STRIP ═══════════ */}
            {(data.alertSummary.critical > 0 || downComponents.length > 0 || activeKillSwitches.length > 0) && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-red-400">
                        <span className="material-symbols-outlined animate-pulse">crisis_alert</span>
                        <span className="text-sm font-black">تحذيرات حرجة</span>
                    </div>
                    {data.alertSummary.critical > 0 && (
                        <div className="flex items-center gap-1.5 bg-red-500/15 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 border border-red-500/20">
                            <span className="material-symbols-outlined !text-sm">error</span>
                            {data.alertSummary.critical} تنبيه حرج
                        </div>
                    )}
                    {downComponents.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-red-500/15 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 border border-red-500/20">
                            <span className="material-symbols-outlined !text-sm">cloud_off</span>
                            {downComponents.length} أنظمة معطلة
                        </div>
                    )}
                    {activeKillSwitches.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-500/15 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 border border-amber-500/20">
                            <span className="material-symbols-outlined !text-sm">block</span>
                            {activeKillSwitches.length} مفتاح إيقاف مفعّل
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ METRICS ROW ═══════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "أحداث (24 ساعة)", value: data.metrics.eventsLast24h, icon: "timeline", color: "text-blue-400", bg: "from-blue-500/10 to-blue-600/5" },
                    { label: "تنبيهات مفتوحة", value: data.alertSummary.total, icon: "notifications_active", color: "text-amber-400", bg: "from-amber-500/10 to-amber-600/5" },
                    { label: "أحداث حرجة (ساعة)", value: data.metrics.criticalLastHour, icon: "local_fire_department", color: "text-red-400", bg: "from-red-500/10 to-red-600/5" },
                    { label: "إجراءات معلقة", value: data.pendingActions.length, icon: "pending_actions", color: "text-purple-400", bg: "from-purple-500/10 to-purple-600/5" },
                ].map((m, i) => (
                    <div key={i} className={`bg-gradient-to-br ${m.bg} border border-slate-800/60 rounded-2xl p-4 flex items-center gap-3`}>
                        <div className={`size-10 rounded-xl ${m.color} bg-white/5 flex items-center justify-center`}>
                            <span className="material-symbols-outlined !text-xl">{m.icon}</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white font-english">{m.value}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{m.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ═══════════ SYSTEM HEALTH ═══════════ */}
            <div className="bg-[#0c1120] border border-slate-800/50 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/40">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400 !text-lg">monitor_heart</span>
                        <h3 className="text-sm font-bold text-white">صحة الأنظمة</h3>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        آخر تحديث: {lastRefresh.toLocaleTimeString("ar-SY")}
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800/30">
                    {data.components.map((comp) => {
                        const st = statusConfig[comp.status] || statusConfig.healthy;
                        return (
                            <div key={comp.id} className="bg-[#0c1120] p-4 flex items-center gap-3 group">
                                <div className={`size-9 rounded-xl ${st.bg} flex items-center justify-center`}>
                                    <span className={`material-symbols-outlined !text-lg ${st.color}`}>
                                        {sourceIcons[comp.key] || "dns"}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{comp.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`material-symbols-outlined !text-[12px] ${st.color}`}>{st.icon}</span>
                                        <span className={`text-[10px] font-medium ${st.color}`}>{st.label}</span>
                                    </div>
                                </div>
                                <div className={`size-2.5 rounded-full ${comp.status === "healthy" ? "bg-emerald-500" : comp.status === "degraded" ? "bg-amber-500 animate-pulse" : "bg-red-500 animate-pulse"}`}></div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ═══════════ MAIN CONTENT GRID ═══════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* LEFT: Events / Alerts Tab Panel (2 cols) */}
                <div className="lg:col-span-2 bg-[#0c1120] border border-slate-800/50 rounded-2xl overflow-hidden">
                    <div className="flex items-center border-b border-slate-800/40">
                        {[
                            { key: "events" as const, label: "تيار الأحداث", icon: "stream", count: data.latestEvents.length },
                            { key: "alerts" as const, label: "التنبيهات", icon: "notifications", count: data.alertSummary.total },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition border-b-2 ${
                                    activeTab === tab.key
                                        ? "text-primary border-primary bg-primary/5"
                                        : "text-slate-500 border-transparent hover:text-slate-300"
                                }`}
                            >
                                <span className="material-symbols-outlined !text-lg">{tab.icon}</span>
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-bold flex items-center justify-center ${
                                        activeTab === tab.key ? "bg-primary text-white" : "bg-white/10 text-slate-400"
                                    }`}>{tab.count}</span>
                                )}
                            </button>
                        ))}
                        <div className="flex-1"></div>
                        <button onClick={fetchData} className="px-4 py-2 text-slate-500 hover:text-white transition" title="تحديث">
                            <span className="material-symbols-outlined !text-lg">refresh</span>
                        </button>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto">
                        {activeTab === "events" && (
                            <div className="divide-y divide-slate-800/40">
                                {data.latestEvents.length === 0 && (
                                    <div className="p-10 text-center text-slate-500 text-sm">لا توجد أحداث مسجلة</div>
                                )}
                                {data.latestEvents.map((evt) => {
                                    const sev = severityConfig[evt.severity] || severityConfig.info;
                                    return (
                                        <div key={evt.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition">
                                            <div className={`size-8 rounded-lg ${sev.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                                <span className={`material-symbols-outlined !text-sm ${sev.color}`}>
                                                    {sourceIcons[evt.sourceComponentKey] || "circle"}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-xs font-bold text-white font-english">{evt.eventType}</span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${sev.bg} ${sev.color} font-bold`}>{sev.label}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 truncate">
                                                    {typeof evt.payload === "object" ? JSON.stringify(evt.payload).substring(0, 90) + "..." : String(evt.payload)}
                                                </p>
                                            </div>
                                            <span className="text-[10px] text-slate-600 font-english whitespace-nowrap shrink-0">
                                                {timeAgo(evt.ts)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === "alerts" && (
                            <div className="divide-y divide-slate-800/40">
                                {data.openAlerts.length === 0 && (
                                    <div className="p-10 text-center text-emerald-500 text-sm">
                                        <span className="material-symbols-outlined !text-4xl block mb-2">verified</span>
                                        لا توجد تنبيهات مفتوحة
                                    </div>
                                )}
                                {data.openAlerts.map((alert) => {
                                    const sev = severityConfig[alert.severity] || severityConfig.medium;
                                    return (
                                        <div key={alert.id} className={`px-4 py-3 hover:bg-white/[0.02] transition border-r-2 ${sev.border}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`size-8 rounded-lg ${sev.bg} flex items-center justify-center shrink-0`}>
                                                    <span className={`material-symbols-outlined !text-sm ${sev.color}`}>{sev.icon}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-xs font-bold text-white">{alert.title}</span>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${sev.bg} ${sev.color} font-bold`}>{sev.label}</span>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                                                            alert.status === "open" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                                                        }`}>{alert.status === "open" ? "مفتوح" : "مُقَر"}</span>
                                                    </div>
                                                    {alert.description && (
                                                        <p className="text-[11px] text-slate-500 mb-2">{alert.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-600 font-english">{timeAgo(alert.createdAt)}</span>
                                                        <span className="text-[10px] text-slate-600 font-english">#{alert.ruleKey}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5 shrink-0">
                                                    {alert.status === "open" && (
                                                        <button
                                                            onClick={() => acknowledgeAlert(alert.id)}
                                                            disabled={ackingAlert === alert.id}
                                                            className="px-3 py-1.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition disabled:opacity-50"
                                                        >
                                                            {ackingAlert === alert.id ? "..." : "إقرار"}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => resolveAlert(alert.id)}
                                                        className="px-3 py-1.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                                                    >
                                                        حل
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Kill Switches (1 col) */}
                <div className="bg-[#0c1120] border border-slate-800/50 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800/40">
                        <span className="material-symbols-outlined text-red-400 !text-lg">emergency_home</span>
                        <h3 className="text-sm font-bold text-white">مفاتيح الإيقاف الطارئ</h3>
                    </div>

                    {/* Reason Input */}
                    <div className="px-4 py-3 border-b border-slate-800/30">
                        <input
                            type="text"
                            value={killSwitchReason}
                            onChange={(e) => setKillSwitchReason(e.target.value)}
                            placeholder="سبب التغيير (إلزامي)..."
                            className="w-full bg-white/[0.03] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-primary outline-none transition"
                        />
                    </div>

                    <div className="divide-y divide-slate-800/30">
                        {data.killSwitches.map((ks) => (
                            <div key={ks.id} className="px-4 py-3">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{ks.name}</p>
                                        {ks.description && (
                                            <p className="text-[10px] text-slate-600 truncate">{ks.description}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => toggleKillSwitch(ks.key, ks.state)}
                                        disabled={togglingSwitch === ks.key || !killSwitchReason.trim()}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${
                                            ks.state === "on" ? "bg-red-500" : "bg-slate-700"
                                        } disabled:opacity-50`}
                                    >
                                        <div className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
                                            ks.state === "on" ? "left-0.5" : "left-[22px]"
                                        }`}></div>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 text-[9px]">
                                    <span className={`font-bold ${ks.state === "on" ? "text-red-400" : "text-emerald-500"}`}>
                                        {ks.state === "on" ? "⛔ مفعّل (معطل)" : "✅ إيقاف (يعمل)"}
                                    </span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-slate-600 truncate">{ks.reason}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
