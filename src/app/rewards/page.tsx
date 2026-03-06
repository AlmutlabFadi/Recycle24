"use client";

import { useState, useEffect } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import Link from "next/link";

const rewardsList = [
    {
        id: 1,
        title: "رصيد محفظة 50K",
        cost: 5000,
        icon: "account_balance_wallet",
        color: "bg-green-500",
        description: "إضافة رصيد فوري لمحفظتك"
    },
    {
        id: 2,
        title: "اشتراك Metalix24",
        cost: 3000,
        icon: "analytics",
        color: "bg-blue-500",
        description: "اشتراك شهري في باقة التحليل المتقدم"
    },
    {
        id: 3,
        title: "ميزان إلكتروني محمول",
        cost: 12000,
        icon: "scale",
        color: "bg-orange-500",
        description: "ميزان دقيق حتى 50 كغ"
    },
    {
        id: 4,
        title: "قفازات حماية احترافية",
        cost: 1500,
        icon: "masks",
        color: "bg-slate-500",
        description: "مقاومة للقطع والحرارة"
    }
];

type Leader = {
    name: string;
    points: number;
};

export default function RewardsPage() {
    const [points, setPoints] = useState<number>(0);
    const [leaders, setLeaders] = useState<Leader[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRewardsData = async () => {
            try {
                const res = await fetch("/api/rewards");
                const data = await res.json();
                if (data.success) {
                    setPoints(data.points);
                    setLeaders(Array.isArray(data.leaders) ? (data.leaders as Leader[]) : []);
                }
            } catch (err) {
                console.error("Error fetching rewards:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRewardsData();
    }, []);

    const getLevel = (pts: number) => {
        if (pts > 10000) return "مستوى ذهبي";
        if (pts > 5000) return "مستوى فضي";
        return "مستوى برونزي";
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="نقاط ريسايكل" />

            <main className="flex-1 flex flex-col gap-6 p-4">
                {/* Points Balance Card */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-indigo-900 p-8 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 size-48 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 size-48 rounded-full bg-black/20 blur-3xl"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-xs font-bold text-white/60 mb-2 uppercase tracking-widest">رصيدك الحالي</span>
                        <h2 className="text-5xl font-black mb-4 flex items-baseline gap-2">
                            {loading ? "..." : points.toLocaleString()}
                            <span className="text-lg font-bold">نقطة</span>
                        </h2>
                        <div className="flex gap-2">
                            <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold border border-white/10">{getLevel(points)}</span>
                            <span className="bg-emerald-500/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                                <span className="material-symbols-outlined !text-[12px]">verified</span>
                                حساب نشط
                            </span>
                        </div>
                    </div>
                </div>

                {/* Referral Action */}
                <section className="bg-surface-highlight rounded-3xl p-6 border border-slate-800 shadow-xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-400 !text-xl">campaign</span>
                                نظام الإحالات
                            </h3>
                            <p className="text-[10px] text-slate-400 max-w-[200px]">ادعُ أصدقاءك وانضموا لمجتمع ريسايكل24 واكسب 500 نقطة لكل صديق.</p>
                        </div>
                        <button 
                            className="bg-primary hover:bg-primary-dark text-white text-[10px] font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition active:scale-95 shadow-lg shadow-primary/20"
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/register?ref=${points}`); // Mocking ref link for now
                                alert("تم نسخ رابط الإحالة الخاص بك");
                            }}
                        >
                            <span className="material-symbols-outlined !text-sm">share</span>
                            شارك الرابط
                        </button>
                    </div>
                </section>

                {/* Leaderboard Teaser */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-500 !text-[20px]">leaderboard</span>
                            أفضل المساهمين
                        </h3>
                        {leaders.length > 5 && <Link href="/rewards/leaderboard" className="text-primary text-[10px] font-bold hover:underline">عرض الكل ({leaders.length})</Link>}
                    </div>

                    <div className="bg-surface-highlight rounded-[2rem] border border-slate-800 overflow-hidden divide-y divide-slate-800 shadow-xl">
                        {loading ? (
                            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>
                        ) : leaders.length === 0 ? (
                            <div className="p-10 text-center text-xs text-slate-500 italic">لا يوجد متصدرون حالياً</div>
                        ) : leaders.map((leader, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/5 transition">
                                <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-700' : 'bg-slate-800'
                                }`}>
                                    {i + 1}
                                </div>
                                <div className="size-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-slate-400">person</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-white truncate">{leader.name}</h4>
                                    <p className="text-[10px] text-slate-500">مساهم نشط</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-primary font-english">{leader.points.toLocaleString()}</span>
                                    <p className="text-[8px] text-slate-600 uppercase font-bold">PTS</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Rewards Store */}
                <section>
                    <h3 className="font-bold text-white mb-4 px-2">استبدال النقاط</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {rewardsList.map((reward) => (
                            <div key={reward.id} className="bg-surface-highlight rounded-[2rem] p-4 border border-slate-800 flex flex-col gap-4 shadow-xl hover:border-primary/50 transition cursor-pointer group">
                                <div className={`w-full aspect-square rounded-2xl ${reward.color}/10 flex items-center justify-center text-4xl group-hover:scale-105 transition`}>
                                    <span className={`material-symbols-outlined ${reward.color.replace('bg-', 'text-')}`}>{reward.icon}</span>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">{reward.title}</h4>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-black font-english ${points >= reward.cost ? 'text-primary' : 'text-slate-500'}`}>{reward.cost.toLocaleString()} <span className="text-[8px]">PTS</span></span>
                                        <button className={`size-7 rounded-xl flex items-center justify-center transition ${points >= reward.cost ? 'bg-primary text-white' : 'bg-slate-800 text-slate-600'}`}>
                                            <span className="material-symbols-outlined !text-[16px]">shopping_basket</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
