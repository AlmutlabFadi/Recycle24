"use client";

import { useEffect, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

type Log = {
    id: string;
    event: string;
    details: string | null;
    ip: string | null;
    level: string | null;
    createdAt: string;
    user: {
        name: string | null;
        email: string | null;
        role: string;
    } | null;
};

type PeriodFilter = "today" | "week" | "month" | "custom";

export default function StaffActivityPage() {
    const { addToast } = useToast();
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<PeriodFilter>("today");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");

    const getDateRange = () => {
        const now = new Date();
        let startDate = "";
        let endDate = now.toISOString();

        if (period === "today") {
            const d = new Date(now);
            d.setHours(0, 0, 0, 0);
            startDate = d.toISOString();
        } else if (period === "week") {
            const d = new Date(now);
            d.setDate(d.getDate() - 7);
            startDate = d.toISOString();
        } else if (period === "month") {
            const d = new Date(now);
            d.setMonth(d.getMonth() - 1);
            startDate = d.toISOString();
        } else if (period === "custom") {
            startDate = customStart ? new Date(customStart).toISOString() : "";
            endDate = customEnd ? new Date(customEnd).toISOString() : now.toISOString();
        }

        return { startDate, endDate };
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getDateRange();
            const params = new URLSearchParams();
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);

            const res = await fetch(`/api/admin/staff/activity?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
            }
        } catch (error) {
            addToast("تعذر تحميل سجل النشاط", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [period, customStart, customEnd]);

    const handlePrint = () => {
        window.print();
    };

    const getEventLabel = (event: string) => {
        const labels: Record<string, string> = {
            "STAFF_WARNING": "تحذير إداري",
            "REMOVE_TEAM_MEMBER": "إزالة موظف",
            "BLOCK_STAFF_ACCOUNT": "حظر حساب",
            "UPDATE_ROLE_SPECIALIZATION": "تعديل تخصص",
            "HEARTBEAT": "نبضة قلب",
            "LEDGER_POST": "عملية مالية",
            "P2P_TRANSFER": "تحويل",
            "WALLET_WITHDRAWAL": "سحب رصيد",
        };
        return labels[event] || event;
    };

    const getEventColor = (event: string) => {
        if (event.includes("WARNING")) return "bg-amber-500/20 text-amber-400 border-amber-500/20";
        if (event.includes("REMOVE") || event.includes("BLOCK")) return "bg-red-500/20 text-red-400 border-red-500/20";
        if (event.includes("LEDGER") || event.includes("TRANSFER") || event.includes("WITHDRAWAL")) return "bg-blue-500/20 text-blue-400 border-blue-500/20";
        return "bg-slate-800 text-slate-300 border-slate-700";
    };

    const periodTabs = [
        { key: "today" as PeriodFilter, label: "اليوم", icon: "today" },
        { key: "week" as PeriodFilter, label: "أسبوعي", icon: "date_range" },
        { key: "month" as PeriodFilter, label: "شهري", icon: "calendar_month" },
        { key: "custom" as PeriodFilter, label: "مخصص", icon: "tune" },
    ];

    return (
        <div className="min-h-screen bg-bg-dark text-white font-display print:bg-white print:text-black">
            <div className="print:hidden">
                <HeaderWithBack title="سجل نشاط الموظفين والرقابة" />
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-8 pt-4">
                <h1 className="text-2xl font-black">تقرير نشاط الموظفين</h1>
                <p className="text-sm text-gray-500 mt-1">
                    الفترة: {period === "today" ? "اليوم" : period === "week" ? "آخر 7 أيام" : period === "month" ? "آخر 30 يوم" : `${customStart} — ${customEnd}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">تاريخ الإصدار: {new Date().toLocaleString('ar-EG')}</p>
            </div>

            <main className="p-4 max-w-6xl mx-auto space-y-6 pb-20">
                {/* Period Filter Tabs */}
                <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 print:hidden">
                    <div className="flex flex-col gap-4">
                        {/* Tab Buttons */}
                        <div className="flex gap-2 flex-wrap">
                            {periodTabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setPeriod(tab.key)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                        period === tab.key
                                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                                    }`}
                                >
                                    <span className="material-symbols-outlined !text-[16px]">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Range */}
                        {period === "custom" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black">من تاريخ</label>
                                    <input
                                        type="date"
                                        title="من تاريخ"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black">إلى تاريخ</label>
                                    <input
                                        type="date"
                                        title="إلى تاريخ"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Actions Row */}
                        <div className="flex items-center justify-between">
                            <div className="text-[10px] text-slate-500">
                                {loading ? "جاري التحميل..." : `${logs.length} عملية مسجلة`}
                            </div>
                            <button
                                onClick={handlePrint}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                            >
                                <span className="material-symbols-outlined !text-[16px]">picture_as_pdf</span>
                                تحميل تقرير PDF
                            </button>
                        </div>
                    </div>
                </section>

                {/* Activity Table */}
                <section className="bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden print:border-gray-200 print:shadow-sm">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 print:bg-gray-50 print:border-gray-200">
                        <h2 className="font-bold flex items-center gap-2 print:text-black">
                            <span className="material-symbols-outlined text-emerald-400 print:hidden">history</span>
                            تفاصيل العمليات الإدارية
                        </h2>
                        <span className="text-[10px] text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full print:bg-gray-200 print:text-black">{logs.length} عملية</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800/50 print:text-black print:border-gray-300">
                                    <th className="px-6 py-4 font-black">الموظف</th>
                                    <th className="px-6 py-4 font-black">الحدث</th>
                                    <th className="px-6 py-4 font-black">التفاصيل</th>
                                    <th className="px-6 py-4 font-black">التوقيت</th>
                                    <th className="px-6 py-4 font-black print:hidden">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30 print:divide-gray-200">
                                {logs.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-slate-500 text-xs">
                                            <span className="material-symbols-outlined !text-4xl mb-2 block text-slate-700">search_off</span>
                                            لا توجد سجلات في هذه الفترة
                                        </td>
                                    </tr>
                                )}
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors print:text-black">
                                        <td className="px-6 py-4">
                                            <div className="text-[12px] font-bold">{log.user?.name || "نظام"}</div>
                                            <div className="text-[9px] text-slate-500 print:text-gray-500">{log.user?.email || log.user?.role}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold ${getEventColor(log.event)} print:bg-transparent print:text-black print:border-gray-300`}>
                                                {getEventLabel(log.event)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed print:text-black">{log.details}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] text-slate-500 font-mono print:text-black">
                                                {new Date(log.createdAt).toLocaleString('ar-EG')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 print:hidden">
                                            <span className="text-[9px] text-slate-600 font-mono">{log.ip}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {/* Print Footer */}
            <footer className="hidden print:block fixed bottom-0 w-full text-center p-4 text-[8px] text-gray-400 border-t border-gray-100">
                تقرير آلي مستخرج من لوحة تحكم Metalix24 — {new Date().toLocaleString('ar-EG')}
            </footer>

            <style jsx global>{`
                @media print {
                    @page { margin: 15mm; }
                    body { -webkit-print-color-adjust: exact; background: white !important; color: black !important; }
                }
            `}</style>
        </div>
    );
}
