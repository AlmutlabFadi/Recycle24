"use client";

import { useState, useEffect } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Subscription {
    id: string;
    userId: string;
    plan: string;
    status: string;
    price: number;
    endDate: string | null;
    user: { name: string; phone: string; email: string };
}

interface Stat {
    plan: string;
    _count: { id: number };
    _sum: { price: number };
}

const planMap: Record<string, { label: string; color: string; bg: string }> = {
    FREE: { label: "مجاني", color: "text-slate-400", bg: "bg-slate-400/10" },
    SILVER: { label: "فضي", color: "text-slate-200", bg: "bg-slate-200/10" },
    GOLD: { label: "ذهبي", color: "text-amber-500", bg: "bg-amber-500/10" },
    PLATINUM: { label: "بلاتيني", color: "text-indigo-400", bg: "bg-indigo-400/10" },
};

export default function AdminSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [stats, setStats] = useState<Stat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
    const [newPlan, setNewPlan] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    async function fetchSubscriptions() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/subscriptions");
            const data = await res.json();
            if (data.success) {
                setSubscriptions(data.subscriptions);
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching subscriptions:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdatePlan() {
        if (!selectedSub || !newPlan || isUpdating) return;
        setIsUpdating(true);
        try {
            const res = await fetch("/api/admin/subscriptions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedSub.userId,
                    plan: newPlan,
                    // Simple logic: add 30 days if upgrading
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSelectedSub(null);
                fetchSubscriptions();
            }
        } catch (error) {
            console.error("Error updating plan:", error);
        } finally {
            setIsUpdating(false);
        }
    }

    const filteredSubs = subscriptions.filter(s => 
        (s.user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.user.phone || "").includes(searchQuery)
    );

    const totalRevenue = stats.reduce((acc, curr) => acc + (curr._sum.price || 0), 0);

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="إدارة الاشتراكات" />

            <main className="flex-1 p-4 lg:max-w-6xl lg:mx-auto w-full pb-20">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    <div className="bg-surface-highlight p-4 rounded-3xl border border-slate-800 col-span-2 md:col-span-1">
                        <p className="text-[10px] text-slate-500 mb-1">إجمالي الإيرادات</p>
                        <p className="text-xl font-bold text-emerald-500 font-english">{totalRevenue.toLocaleString()}</p>
                        <p className="text-[10px] text-emerald-500/60 mt-1">ل.س</p>
                    </div>
                    {["SILVER", "GOLD", "PLATINUM"].map(p => {
                        const s = stats.find(st => st.plan === p);
                        return (
                            <div key={p} className="bg-surface-highlight p-4 rounded-3xl border border-slate-800">
                                <p className="text-[10px] text-slate-500 mb-1">{planMap[p].label}</p>
                                <p className="text-xl font-bold text-white font-english">{s?._count.id || 0}</p>
                                <p className="text-[10px] text-slate-600 mt-1">مشترك</p>
                            </div>
                        );
                    })}
                </div>

                {/* Subscriptions List */}
                <div className="bg-surface-highlight rounded-[2.5rem] border border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="text-lg font-bold text-white">المشتركين النشطين</h2>
                        <div className="relative w-full md:w-64">
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                            <input
                                type="text"
                                placeholder="ابحث بالاسم أو الهاتف..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:border-primary outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-900/30">
                                    <th className="p-4 text-xs font-bold text-slate-500">المستخدم</th>
                                    <th className="p-4 text-xs font-bold text-slate-500">الباقة</th>
                                    <th className="p-4 text-xs font-bold text-slate-500">الحالة</th>
                                    <th className="p-4 text-xs font-bold text-slate-500">تنتهي في</th>
                                    <th className="p-4 text-xs font-bold text-slate-500">إجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div></td></tr>
                                ) : filteredSubs.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-800/20 transition">
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-white">{s.user.name}</p>
                                            <p className="text-[10px] text-slate-500 font-english">{s.user.phone}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${planMap[s.plan].bg} ${planMap[s.plan].color}`}>
                                                {planMap[s.plan].label}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold ${s.status === 'ACTIVE' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {s.status === 'ACTIVE' ? 'نشط' : 'متوقف'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-slate-400 font-english">
                                            {s.endDate ? new Date(s.endDate).toLocaleDateString("ar-SY") : "دائم"}
                                        </td>
                                        <td className="p-4">
                                            <button 
                                                onClick={() => { setSelectedSub(s); setNewPlan(s.plan); }}
                                                className="text-primary text-xs font-bold hover:underline"
                                            >
                                                تغيير الخطة
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Change Plan Modal */}
            {selectedSub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-bg-dark border border-slate-800 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-2">تعديل اشتراك المستخدم</h2>
                        <p className="text-sm text-slate-400 mb-6 font-english">{selectedSub.user.email || selectedSub.user.phone}</p>
                        
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">اختر الباقة الجديدة</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.keys(planMap).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setNewPlan(p)}
                                            className={`p-3 rounded-2xl border transition text-sm font-bold ${newPlan === p ? 'bg-primary border-primary text-white' : 'bg-surface-highlight border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                        >
                                            {planMap[p].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleUpdatePlan}
                                disabled={isUpdating}
                                className="flex-1 bg-primary text-white font-bold py-3 rounded-2xl hover:scale-105 transition disabled:opacity-50"
                            >
                                {isUpdating ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                            </button>
                            <button 
                                onClick={() => setSelectedSub(null)}
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
