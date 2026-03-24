"use client";

import { useEffect, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

type Log = {
    id: string;
    event: string;
    details: string | null;
    ip: string | null;
    createdAt: string;
    user: {
        name: string | null;
        email: string | null;
        role: string;
    } | null;
};

export default function StaffActivityPage() {
    const { addToast } = useToast();
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ startDate: "", endDate: "", userId: "" });

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams(filters);
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
    }, [filters]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-bg-dark text-white font-display print:bg-white print:text-black">
            <div className="print:hidden">
                <HeaderWithBack title="سجل نشاط الموظفين والرقابة" />
            </div>

            <main className="p-4 max-w-6xl mx-auto space-y-6 pb-20">
                {/* Control Panel - Hidden in Print */}
                <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 print:hidden">
                    <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 uppercase font-black">من تاريخ</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-emerald-500"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 uppercase font-black">إلى تاريخ</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-emerald-500"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handlePrint}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                            <span className="material-symbols-outlined !text-sm">picture_as_pdf</span>
                            تحميل تقرير PDF
                        </button>
                    </div>
                </section>

                {/* Activity Table */}
                <section className="bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden print:border-none print:shadow-none">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 print:bg-transparent print:border-black/10">
                        <h2 className="font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-400 print:hidden">history</span>
                            تفاصيل العمليات الإدارية
                        </h2>
                        <span className="text-[10px] text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">{logs.length} عملية</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800/50 print:text-black print:border-black">
                                    <th className="px-6 py-4 font-black">الموظف</th>
                                    <th className="px-6 py-4 font-black">الحدث</th>
                                    <th className="px-6 py-4 font-black">التفاصيل</th>
                                    <th className="px-6 py-4 font-black">التوقيت</th>
                                    <th className="px-6 py-4 font-black print:hidden">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30 print:divide-black/10">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors group print:text-black">
                                        <td className="px-6 py-4">
                                            <div className="text-[11px] font-bold">{log.user?.name || "نظام"}</div>
                                            <div className="text-[9px] text-slate-500">{log.user?.role}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono print:bg-transparent print:text-black print:border-black/20">
                                                {log.event}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed print:text-black">{log.details}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] text-slate-500 font-mono print:text-black">
                                                {new Date(log.createdAt).toLocaleString('ar-EG')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 print:hidden">
                                            <span className="text-[9px] text-slate-600">{log.ip}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {/* Print Footer */}
            <footer className="hidden print:block fixed bottom-0 w-full text-center p-8 text-[8px] text-gray-400 border-t border-gray-100">
                تقرير آلي مستخرج من لوحة تحكم Recycle24 - {new Date().toLocaleString('ar-EG')}
            </footer>

            <style jsx global>{`
                @media print {
                    @page { margin: 20mm; }
                    body { -webkit-print-color-adjust: exact; }
                    .print-break-inside-avoid { page-break-inside: avoid; }
                }
            `}</style>
        </div>
    );
}
