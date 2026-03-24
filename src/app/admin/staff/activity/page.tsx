"use client";

import { useEffect, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

type StaffSummary = {
    userId: string;
    name: string;
    email: string;
    totalOnline: number;
    totalIdle: number;
    totalOffline: number;
    totalBreak: number;
    sessions: Array<{
        startTime: string;
        endTime: string | null;
        status: string;
        duration: number;
    }>;
};

type PeriodFilter = "today" | "week" | "month" | "custom";

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} ساعة ${m} دقيقة`;
    return `${m} دقيقة`;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    ONLINE: { label: "متصل", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: "🟢" },
    IDLE: { label: "خامل", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: "🟠" },
    OFFLINE: { label: "خارج النظام", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: "🔴" },
    BREAK: { label: "استراحة", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: "☕" },
};

export default function StaffActivityPage() {
    const { addToast } = useToast();
    const [summaries, setSummaries] = useState<StaffSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<PeriodFilter>("today");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const fetchSummaries = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ period });
            if (period === "custom") {
                if (customStart) params.set("startDate", customStart);
                if (customEnd) params.set("endDate", customEnd);
            }

            const res = await fetch(`/api/admin/staff/activity/summary?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setSummaries(data.summaries || []);
            }
        } catch (error) {
            addToast("تعذر تحميل سجل النشاط", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummaries();
    }, [period, customStart, customEnd]);

    const handlePrint = () => window.print();

    const periodTabs = [
        { key: "today" as PeriodFilter, label: "اليوم", icon: "today" },
        { key: "week" as PeriodFilter, label: "أسبوعي", icon: "date_range" },
        { key: "month" as PeriodFilter, label: "شهري", icon: "calendar_month" },
        { key: "custom" as PeriodFilter, label: "مخصص", icon: "tune" },
    ];

    const displayedSummaries = selectedUser
        ? summaries.filter(s => s.userId === selectedUser)
        : summaries;

    return (
        <div className="min-h-screen bg-bg-dark text-white font-display print:bg-white print:text-black">
            <div className="print:hidden">
                <HeaderWithBack title="سجل نشاط الموظفين والرقابة" />
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-6 pt-4">
                <h1 className="text-2xl font-black">تقرير نشاط الموظفين</h1>
                <p className="text-sm text-gray-500 mt-1">
                    الفترة: {period === "today" ? "اليوم" : period === "week" ? "آخر 7 أيام" : period === "month" ? "آخر 30 يوم" : `${customStart} — ${customEnd}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">تاريخ الإصدار: {new Date().toLocaleString("ar-EG")}</p>
            </div>

            <main className="p-4 max-w-7xl mx-auto space-y-6 pb-20">
                {/* Controls */}
                <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 print:hidden">
                    <div className="flex flex-col gap-4">
                        {/* Period Tabs */}
                        <div className="flex gap-2 flex-wrap">
                            {periodTabs.map(tab => (
                                <button key={tab.key} onClick={() => setPeriod(tab.key)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                        period === tab.key
                                            ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                                            : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600"
                                    }`}>
                                    <span className="material-symbols-outlined !text-[16px]">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Range */}
                        {period === "custom" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black">من تاريخ</label>
                                    <input type="date" title="من تاريخ"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                                        value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black">إلى تاريخ</label>
                                    <input type="date" title="إلى تاريخ"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                                        value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                                </div>
                            </div>
                        )}

                        {/* Staff Filter + PDF */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <select title="تصفية حسب الموظف"
                                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500 text-slate-400 min-w-[200px]"
                                    value={selectedUser || ""} onChange={(e) => setSelectedUser(e.target.value || null)}>
                                    <option value="">جميع الموظفين</option>
                                    {summaries.map(s => (
                                        <option key={s.userId} value={s.userId}>{s.name}</option>
                                    ))}
                                </select>
                                <span className="text-[10px] text-slate-500">{loading ? "جاري التحميل..." : `${displayedSummaries.length} موظف`}</span>
                            </div>
                            <button onClick={handlePrint}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all">
                                <span className="material-symbols-outlined !text-[16px]">picture_as_pdf</span>
                                تحميل تقرير PDF
                            </button>
                        </div>
                    </div>
                </section>

                {/* Per-Staff Summaries */}
                {displayedSummaries.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <span className="material-symbols-outlined !text-5xl text-slate-700 block mb-3">search_off</span>
                        <p className="text-slate-500 text-sm">لا توجد سجلات نشاط في هذه الفترة</p>
                    </div>
                )}

                {displayedSummaries.map(staff => {
                    const totalWork = staff.totalOnline + staff.totalIdle + staff.totalBreak + staff.totalOffline;
                    const efficiency = totalWork > 0 ? Math.round((staff.totalOnline / totalWork) * 100) : 0;

                    return (
                        <section key={staff.userId} className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden print:break-inside-avoid print:border-gray-200">
                            {/* Staff Header */}
                            <div className="p-6 border-b border-slate-800 bg-slate-900/50 print:bg-gray-50 print:border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-lg border border-slate-600">
                                            {staff.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black print:text-black">{staff.name}</h3>
                                            <p className="text-[10px] text-slate-500">{staff.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${efficiency >= 70 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : efficiency >= 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            كفاءة {efficiency}%
                                        </span>
                                    </div>
                                </div>

                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
                                        <div className="text-[9px] text-emerald-400 uppercase font-black mb-1">🟢 نشاط فعلي</div>
                                        <div className="text-sm font-black text-emerald-400">{formatDuration(staff.totalOnline)}</div>
                                    </div>
                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
                                        <div className="text-[9px] text-amber-400 uppercase font-black mb-1">🟠 خمول</div>
                                        <div className="text-sm font-black text-amber-400">{formatDuration(staff.totalIdle)}</div>
                                    </div>
                                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-center">
                                        <div className="text-[9px] text-red-400 uppercase font-black mb-1">🔴 خارج النظام</div>
                                        <div className="text-sm font-black text-red-400">{formatDuration(staff.totalOffline)}</div>
                                    </div>
                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-center">
                                        <div className="text-[9px] text-blue-400 uppercase font-black mb-1">☕ استراحة</div>
                                        <div className="text-sm font-black text-blue-400">{formatDuration(staff.totalBreak)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Session Timeline */}
                            <div className="p-4">
                                <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-3 px-2">سجل الفترات الزمنية</h4>
                                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                                    {staff.sessions.length === 0 && (
                                        <p className="text-xs text-slate-600 text-center py-4">لا توجد فترات مسجلة</p>
                                    )}
                                    {staff.sessions.map((session, idx) => {
                                        const cfg = statusConfig[session.status] || statusConfig.OFFLINE;
                                        return (
                                            <div key={idx} className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${cfg.bg} print:border-gray-200`}>
                                                <span className="text-sm">{cfg.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <span className={`text-[11px] font-bold ${cfg.color} print:text-black`}>{cfg.label}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono print:text-black">
                                                    {formatDate(session.startTime)} &nbsp;
                                                    {formatTime(session.startTime)}
                                                    {session.endTime && <> ← {formatTime(session.endTime)}</>}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-300 min-w-[80px] text-left print:text-black">
                                                    {formatDuration(session.duration)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    );
                })}
            </main>

            {/* Print Footer */}
            <footer className="hidden print:block fixed bottom-0 w-full text-center p-4 text-[8px] text-gray-400 border-t border-gray-100">
                تقرير آلي مستخرج من لوحة تحكم Metalix24 — {new Date().toLocaleString("ar-EG")}
            </footer>

            <style jsx global>{`
                @media print {
                    @page { margin: 15mm; }
                    body { -webkit-print-color-adjust: exact; background: white !important; color: black !important; }
                    .print-break-inside-avoid { page-break-inside: avoid; }
                }
            `}</style>
        </div>
    );
}
