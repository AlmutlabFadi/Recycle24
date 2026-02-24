"use client";

import { useState } from "react";

import HeaderWithBack from "@/components/HeaderWithBack";

const pointsData = {
    total: 12500,
    level: "ذهبي",
    nextLevel: "بلاتيني",
    pointsToNext: 37500,
    progress: 25,
    history: [
        { id: 1, action: "إتمام صفقة بيع", points: 500, date: "2026-02-18", type: "earn" },
        { id: 2, action: "الفوز بمزاد", points: 1000, date: "2026-02-15", type: "earn" },
        { id: 3, action: "استبدال قسيمة خصم", points: -2000, date: "2026-02-10", type: "redeem" },
        { id: 4, action: "توثيق الحساب", points: 2000, date: "2026-02-08", type: "earn" },
        { id: 5, action: "إحالة صديق", points: 500, date: "2026-02-05", type: "earn" },
    ],
};

const levels = [
    { name: "برونزي", min: 0, color: "text-orange-400", bg: "bg-orange-400/20" },
    { name: "فضي", min: 5000, color: "text-slate-300", bg: "bg-slate-300/20" },
    { name: "ذهبي", min: 10000, color: "text-yellow-400", bg: "bg-yellow-400/20" },
    { name: "بلاتيني", min: 50000, color: "text-cyan-400", bg: "bg-cyan-400/20" },
    { name: "ماسي", min: 100000, color: "text-purple-400", bg: "bg-purple-400/20" },
];

const rewards = [
    { id: 1, name: "قسيمة خصم 10%", points: 2000, icon: "local_offer", available: true },
    { id: 2, name: "شحن مجاني", points: 1500, icon: "local_shipping", available: true },
    { id: 3, name: "أولوية في الدعم", points: 3000, icon: "support_agent", available: false },
    { id: 4, name: "شارة VIP", points: 5000, icon: "verified", available: false },
];

export default function RewardsPointsPage() {
    const [activeTab, setActiveTab] = useState<"overview" | "history" | "redeem">("overview");

    const currentLevel = levels.find(l => l.name === pointsData.level);
    const nextLevelObj = levels.find(l => l.name === pointsData.nextLevel);

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="نقاط الولاء" />

            {/* Points Card */}
            <div className="bg-gradient-to-br from-primary to-primary-dark p-6 mx-4 mt-4 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-white/80">رصيد النقاط</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${currentLevel?.bg} ${currentLevel?.color}`}>
                        {pointsData.level}
                    </span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                    {pointsData.total.toLocaleString()}
                </div>
                <div className="text-sm text-white/70">
                    نقطة
                </div>

                {/* Progress to next level */}
                <div className="mt-4">
                    <div className="flex justify-between text-xs text-white/70 mb-2">
                        <span>{pointsData.level}</span>
                        <span>{pointsData.nextLevel}</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-yellow-400 rounded-full transition-all"
                            style={{ width: `${pointsData.progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-white/60 mt-2">
                        {pointsData.pointsToNext.toLocaleString()} نقطة للوصول إلى {pointsData.nextLevel}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 py-4">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {[
                        { id: "overview", label: "نظرة عامة", icon: "dashboard" },
                        { id: "history", label: "السجل", icon: "history" },
                        { id: "redeem", label: "استبدال", icon: "redeem" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                activeTab === tab.id
                                    ? "bg-primary text-white"
                                    : "bg-surface-highlight text-slate-300 border border-slate-700"
                            }`}
                        >
                            <span className="material-symbols-outlined !text-[18px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <main className="flex-1 px-4 pb-24">
                {activeTab === "overview" && (
                    <>
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
                                <span className="material-symbols-outlined text-primary text-2xl">shopping_bag</span>
                                <div className="text-2xl font-bold text-white mt-2">12</div>
                                <div className="text-xs text-slate-400">صفقة مكتملة</div>
                            </div>
                            <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
                                <span className="material-symbols-outlined text-primary text-2xl">gavel</span>
                                <div className="text-2xl font-bold text-white mt-2">5</div>
                                <div className="text-xs text-slate-400">مزاد فائز</div>
                            </div>
                        </div>

                        {/* Levels */}
                        <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700 mb-6">
                            <h3 className="font-bold text-white mb-4">مستويات الولاء</h3>
                            <div className="space-y-3">
                                {levels.map((level, index) => (
                                    <div 
                                        key={level.name}
                                        className={`flex items-center gap-3 p-3 rounded-xl ${
                                            level.name === pointsData.level
                                                ? "bg-primary/10 border border-primary"
                                                : "bg-slate-800"
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${level.bg}`}>
                                            <span className={`material-symbols-outlined ${level.color}`}>
                                                {index === levels.length - 1 ? "diamond" : "stars"}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-white">{level.name}</div>
                                            <div className="text-xs text-slate-400">
                                                {level.min.toLocaleString()} نقطة
                                            </div>
                                        </div>
                                        {level.name === pointsData.level && (
                                            <span className="text-primary text-sm font-bold">الحالي</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* How to earn */}
                        <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
                            <h3 className="font-bold text-white mb-4">كيف تكسب النقاط؟</h3>
                            <div className="space-y-3">
                                {[
                                    { action: "إتمام صفقة بيع", points: 500, icon: "sell" },
                                    { action: "الفوز بمزاد", points: 1000, icon: "gavel" },
                                    { action: "توثيق الحساب", points: 2000, icon: "verified" },
                                    { action: "إحالة صديق", points: 500, icon: "person_add" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400">{item.icon}</span>
                                        <div className="flex-1 text-slate-300">{item.action}</div>
                                        <span className="text-primary font-bold">+{item.points}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === "history" && (
                    <div className="space-y-3">
                        {pointsData.history.map((item) => (
                            <div 
                                key={item.id}
                                className="bg-surface-highlight rounded-xl p-4 border border-slate-700"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            item.type === "earn" ? "bg-green-500/20" : "bg-red-500/20"
                                        }`}>
                                            <span className={`material-symbols-outlined ${
                                                item.type === "earn" ? "text-green-400" : "text-red-400"
                                            }`}>
                                                {item.type === "earn" ? "add_circle" : "remove_circle"}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{item.action}</div>
                                            <div className="text-xs text-slate-400">{item.date}</div>
                                        </div>
                                    </div>
                                    <div className={`font-bold ${
                                        item.type === "earn" ? "text-green-400" : "text-red-400"
                                    }`}>
                                        {item.type === "earn" ? "+" : ""}{item.points.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "redeem" && (
                    <div className="space-y-3">
                        {rewards.map((reward) => (
                            <div 
                                key={reward.id}
                                className={`bg-surface-highlight rounded-xl p-4 border ${
                                    reward.available ? "border-slate-700" : "border-slate-800 opacity-60"
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary text-2xl">
                                            {reward.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white">{reward.name}</h3>
                                        <div className="flex items-center gap-1 text-sm text-slate-400">
                                            <span className="material-symbols-outlined !text-[16px]">stars</span>
                                            {reward.points.toLocaleString()} نقطة
                                        </div>
                                    </div>
                                    <button
                                        disabled={!reward.available || pointsData.total < reward.points}
                                        className={`px-4 py-2 rounded-xl font-bold text-sm ${
                                            reward.available && pointsData.total >= reward.points
                                                ? "bg-primary text-white hover:bg-primary-dark"
                                                : "bg-slate-700 text-slate-500 cursor-not-allowed"
                                        }`}
                                    >
                                        استبدال
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
