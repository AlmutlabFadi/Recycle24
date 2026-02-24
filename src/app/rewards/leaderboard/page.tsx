"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useState } from "react";

const rankings = [
    { rank: 1, name: "أبو العز للخردة", location: "دمشق، الميدان", points: 15400, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoYZZovVPYDRnfQljfYmeNIOd3CLblzn7gLqTRy_7sElxkOhND5F-ptxeSKYbtDJH7WW37Tmhs7RqGeLdr1tY5l0vQPCHYeVdhH8YMNOxJSeettxF3UQFGdqHVn2dVzBjq2CVpBKSItNGjcy5I-yjMZ0DwishJ7_dhXSCp7mcMbBVtMPvR-5L5oBxgFZ8T3ujcU18WDSmpnsJOyCislXs5huz-9qWMlzonwdL_QFmyVn1ijGXULc5HGYApCENt-Jy1pXp2Wwuk_EE", trend: "up" },
    { rank: 2, name: "شركة الأمانة", location: "ريف دمشق، حرستا", points: 12350, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNVajZNufWI6xpz_m_WhscRy-4QQycKYzFwDTYkhiECwtxbWFTosYEKa5dkdwuaRLbNnEQ2leqK5lyggZcssDopnYTXmWAQA_EitvT6zIcRwYzP55Dt-14OY-y6hu4oX8XvaYrnVnJdfjJ1GzBmEslLBqMSyVHrHla4fa7sxw9w0hUJnD1MX6ofUg7pbNFiyEsbXKIVyATwYUolOvnLhYw79YbcFf6YYv5wfN_eOOwqr-DIi2PcBpZumWZ-QsZ-8GiWULbWtHamGI", trend: "stable" },
    { rank: 3, name: "ماهر للمعادن", location: "حلب، الصناعة", points: 9800, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYzd3TP6a_5GIYhc85geaT78dV_acYhwesxgSRQTm93oN6eoTRBRKldJQfc-hLQVK_ka-_CIMCwhMlU_IrAPt-oBmVpgZtsUofjNc0fa2dp1tGheyoC5ObDXoo8ZMfJxLc7G0LHb31RyUHjLvKUgpaSArj8Cwo4NAUo2hmzDVtlDCp2Wwz0GeXF02LPmfNu3U6vVMD1W3pL-loxcPGQu9BnpijxAz8yz4u0CdRXpOCg7k3-9ONFB5X4bk0D7NbpJjoS8u3z2bDVzs", trend: "down" },
    { rank: 4, name: "مؤسسة النور", location: "اللاذقية", points: 8450, avatar: "", trend: "up" },
    { rank: 5, name: "سعيد للحديد", location: "حمص", points: 7200, avatar: "", trend: "up" },
    { rank: 6, name: "البركة للتجارة", location: "دمشق", points: 6100, avatar: "", trend: "down" },
    { rank: 7, name: "أحمد سكراب", location: "طرطوس", points: 5900, avatar: "", trend: "stable" },
];

export default function LeaderboardPage() {
    const [period, setPeriod] = useState<"weekly" | "monthly" | "all">("monthly");

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="لوحة المتصدرين" />

            {/* Period Filter */}
            <div className="sticky top-[60px] bg-bg-light dark:bg-bg-dark z-10 p-4 pb-2">
                <div className="bg-white dark:bg-surface-highlight p-1 rounded-xl flex shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <button
                        onClick={() => setPeriod("weekly")}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${period === "weekly" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                    >
                        أسبوعي
                    </button>
                    <button
                        onClick={() => setPeriod("monthly")}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${period === "monthly" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                    >
                        شهري
                    </button>
                    <button
                        onClick={() => setPeriod("all")}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${period === "all" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                    >
                        الكل
                    </button>
                </div>
            </div>

            <main className="flex-1 p-4 pt-2 flex flex-col gap-4">
                {/* Top 3 Podium */}
                <div className="flex items-end justify-center gap-4 py-6">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center">
                        <div className="size-16 rounded-full border-4 border-slate-300 relative mb-2">
                            <img src={rankings[1].avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-bg-light dark:border-bg-dark">2</div>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white text-center w-20 truncate">{rankings[1].name}</div>
                        <div className="text-xs font-bold text-slate-500">{rankings[1].points.toLocaleString()}</div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center -mt-6">
                        <div className="size-20 rounded-full border-4 border-yellow-400 relative mb-2 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl">👑</span>
                            <img src={rankings[0].avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full border-2 border-bg-light dark:border-bg-dark">1</div>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white text-center w-24 truncate">{rankings[0].name}</div>
                        <div className="text-xs font-bold text-yellow-500">{rankings[0].points.toLocaleString()}</div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                        <div className="size-16 rounded-full border-4 border-orange-700 relative mb-2">
                            <img src={rankings[2].avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-bg-light dark:border-bg-dark">3</div>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white text-center w-20 truncate">{rankings[2].name}</div>
                        <div className="text-xs font-bold text-slate-500">{rankings[2].points.toLocaleString()}</div>
                    </div>
                </div>

                {/* Rest of the list */}
                <div className="bg-white dark:bg-surface-highlight rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                    {rankings.slice(3).map((trader) => (
                        <div key={trader.rank} className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <div className="w-6 text-center text-sm font-bold text-slate-400">#{trader.rank}</div>
                            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                                <span className="material-symbols-outlined !text-[20px]">person</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{trader.name}</h4>
                                <p className="text-[10px] text-slate-400 truncate">{trader.location}</p>
                            </div>
                            <div className="text-end">
                                <div className="text-sm font-bold text-indigo-500">{trader.points.toLocaleString()}</div>
                                <div className={`text-[10px] flex items-center justify-end gap-0.5 ${trader.trend === 'up' ? 'text-green-500' :
                                        trader.trend === 'down' ? 'text-red-500' : 'text-slate-400'
                                    }`}>
                                    {trader.trend === 'up' && <span className="material-symbols-outlined !text-[12px]">arrow_upward</span>}
                                    {trader.trend === 'down' && <span className="material-symbols-outlined !text-[12px]">arrow_downward</span>}
                                    {trader.trend === 'stable' && <span className="material-symbols-outlined !text-[12px]">remove</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* User Rank Sticky */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-20 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-700 px-4 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-3">
                    <div className="w-6 text-center text-sm font-bold text-slate-900 dark:text-white">#42</div>
                    <div className="size-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 border-2 border-indigo-500">
                        <span className="material-symbols-outlined !text-[24px]">person</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">ترتيبك الحالي</h4>
                        <p className="text-[10px] text-slate-500">أمامك 150 نقطة للوصول للمرتبة #41</p>
                    </div>
                    <div className="text-end">
                        <div className="text-sm font-bold text-indigo-500">2,450</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
