"use client";

import { useState, useEffect } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Ranking {
    id: string;
    userId: string;
    points: number;
    level: number;
    user: {
        name: string | null;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
    };
}

export default function AdminRewardsPage() {
    const [rankings, setRankings] = useState<Ranking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<Ranking | null>(null);
    const [pointAdjustment, setPointAdjustment] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchRankings();
    }, []);

    async function fetchRankings() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/rewards");
            const data = await res.json();
            if (data.success) {
                setRankings(data.rankings);
            }
        } catch (error) {
            console.error("Error fetching rankings:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAdjustPoints() {
        if (!selectedUser || pointAdjustment === 0 || isUpdating) return;
        setIsUpdating(true);
        try {
            const res = await fetch("/api/admin/rewards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedUser.userId,
                    points: pointAdjustment,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSelectedUser(null);
                setPointAdjustment(0);
                fetchRankings();
            }
        } catch (error) {
            console.error("Error adjusting points:", error);
        } finally {
            setIsUpdating(false);
        }
    }

    const filteredRankings = rankings.filter(r => 
        (r.user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.user.phone || "").includes(searchQuery)
    );

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="نظام الولاء والمكافآت" />

            <main className="flex-1 p-4 lg:max-w-6xl lg:mx-auto w-full pb-20">
                {/* Search & Actions */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="ابحث عن متسابق بالاسم أو الهاتف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface-highlight border border-slate-700 rounded-2xl py-3 pr-11 pl-4 text-white focus:border-primary outline-none"
                        />
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-surface-highlight rounded-[2.5rem] border border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white">المتصدرين</h2>
                        <span className="text-xs text-slate-500">{filteredRankings.length} مستخدم</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50">
                                    <th className="p-4 text-xs font-bold text-slate-500">الترتيب</th>
                                    <th className="p-4 text-xs font-bold text-slate-500">المستخدم</th>
                                    <th className="p-4 text-xs font-bold text-slate-500">المستوى</th>
                                    <th className="p-4 text-xs font-bold text-slate-500">النقاط</th>
                                    <th className="p-4 text-xs font-bold text-slate-500">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filteredRankings.map((r, index) => (
                                    <tr key={r.id} className="hover:bg-slate-800/30 transition">
                                        <td className="p-4 text-sm text-slate-400 font-english">#{index + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {(r.user.firstName?.[0] || r.user.name?.[0] || "?").toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{r.user.name || r.user.firstName}</p>
                                                    <p className="text-[10px] text-slate-500 font-english">{r.user.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">
                                                Level {r.level}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-emerald-500 font-english">{r.points.toLocaleString()}</td>
                                        <td className="p-4">
                                            <button 
                                                onClick={() => setSelectedUser(r)}
                                                className="text-primary text-xs font-bold hover:underline"
                                            >
                                                تعديل الرصيد
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Adjust Points Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-bg-dark border border-slate-800 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-2">تعديل نقاط المستخدم</h2>
                        <p className="text-sm text-slate-400 mb-6">أنت الآن تقوم بتعديل نقاط <span className="text-primary font-bold">{selectedUser.user.name}</span></p>
                        
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">عدد النقاط (استخدم رقماً سالباً للخصم)</label>
                                <input
                                    type="number"
                                    title="عدد النقاط المراد إضافتها أو خصمها"
                                    placeholder="0"
                                    value={pointAdjustment}
                                    onChange={(e) => setPointAdjustment(parseInt(e.target.value) || 0)}
                                    className="w-full bg-surface-highlight border border-slate-700 rounded-2xl py-3 px-4 text-white font-english outline-none focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleAdjustPoints}
                                disabled={isUpdating || pointAdjustment === 0}
                                className="flex-1 bg-primary text-white font-bold py-3 rounded-2xl hover:scale-105 transition disabled:opacity-50"
                            >
                                {isUpdating ? 'جاري الحفظ...' : 'تأكيد التعديل'}
                            </button>
                            <button 
                                onClick={() => { setSelectedUser(null); setPointAdjustment(0); }}
                                className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-2xl hover:bg-slate-700 transition"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
