"use client";

import { useEffect, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

type LeaderboardEntry = {
    userId: string;
    name: string;
    email: string;
    role: string;
    score: number;
    status: string;
};

export default function LeaderboardPage() {
    const { addToast } = useToast();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/staff/leaderboard");
            if (res.ok) {
                const data = await res.json();
                setEntries(data.leaderboard || []);
            }
        } catch (error) {
            addToast("تعذر تحميل قائمة المتصدرين", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="min-h-screen bg-bg-dark flex items-center justify-center text-white text-xs">جاري تحليل البيانات...</div>;

    return (
        <div className="min-h-screen bg-bg-dark text-white font-display print:bg-white print:text-black">
            <div className="print:hidden">
                <HeaderWithBack title="قائمة المتصدرين والكفاءة" />
            </div>

            <main className="p-4 max-w-5xl mx-auto space-y-8 pb-20">
                {/* Header Section */}
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h2 className="text-xl font-black text-emerald-400">نخبة الموظفين</h2>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">تحليل النشاط خلال آخر 30 يوم عمل</p>
                    </div>
                    <button 
                        onClick={handlePrint}
                        className="bg-slate-900 border border-slate-800 text-white px-6 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 hover:border-slate-700 transition-all"
                    >
                        <span className="material-symbols-outlined !text-sm">print</span>
                        طباعة السجل
                    </button>
                </div>

                {/* Top 3 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    {entries.slice(0, 3).map((entry, idx) => (
                        <div key={entry.userId} className={`relative overflow-hidden group p-6 rounded-[2.5rem] border transition-all duration-500
                            ${idx === 0 ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 scale-105 z-10' : 
                              idx === 1 ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/20' : 
                              'bg-slate-900/40 border-slate-800'}`}
                        >
                            <div className="absolute top-4 right-6 text-4xl font-black text-emerald-500/10 italic">#{idx + 1}</div>
                            <div className="space-y-4">
                                <div className="size-16 rounded-[1.5rem] bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 group-hover:border-emerald-500 transition-colors">
                                    <span className="material-symbols-outlined !text-3xl">person</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-lg truncate">{entry.name}</h3>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">{entry.role}</p>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <div className="text-[9px] text-slate-500 uppercase font-black mb-1">نقاط النشاط</div>
                                        <div className="text-2xl font-black text-white">{entry.score}</div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-bold border ${entry.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                        {entry.status === 'ONLINE' ? 'متصل الآن' : 'غير متصل'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Full List Table */}
                <div className="bg-slate-900/20 border border-slate-800 rounded-[2rem] overflow-hidden mt-8">
                    <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-900/40 text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between items-center">
                        <span>الترتيب العام للمنظومة</span>
                        <span>مجموع الكادر: {entries.length}</span>
                    </div>
                    <div className="divide-y divide-slate-800/30">
                        {entries.slice(3).map((entry, idx) => (
                            <div key={entry.userId} className="p-4 px-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-600 font-mono text-[10px] w-4">#{idx + 4}</span>
                                    <div className="size-8 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-500 group-hover:border-emerald-500/40 transition-colors">
                                        <span className="material-symbols-outlined !text-sm">person</span>
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-bold">{entry.name}</div>
                                        <div className="text-[9px] text-slate-500 uppercase">{entry.role}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <div className="text-[12px] font-black">{entry.score}</div>
                                        <div className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">نشاط إداري</div>
                                    </div>
                                    <div className={`size-1.5 rounded-full ${entry.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Efficiency Logic Note */}
                <p className="text-center text-[9px] text-slate-600 uppercase tracking-tighter font-medium px-12">
                     * يتم احتساب الكفاءة تلقائياً بناءً على حجم وتنوع العمليات والنشاطات المسجلة في السجل الأمني ونظام الإدارة خلال آخر ٣٠ يوماً من العمل الفعلي في المنظومة
                </p>
            </main>

            <style jsx global>{`
                @media print {
                    @page { margin: 15mm; }
                    body { -webkit-print-color-adjust: exact; background: white !important; }
                    .print-hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}
