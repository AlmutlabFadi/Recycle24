"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useState } from "react";
import Link from "next/link";

export default function MarketAnalyticsPage() {
    const [selectedMaterial, setSelectedMaterial] = useState("all");

    // Market analytics data
    const materials = [
        {
            id: "iron",
            name: "حديد HMS 1",
            icon: "construction",
            yourPrice: 3200,
            localAvg: 3150,
            globalPrice: 3300,
            rank: 2,
            totalBuyers: 45,
            trend: "up" as const,
            weeklyChange: +2.5,
            recommendations: [
                "سعرك أعلى من المتوسط المحلي بـ1.6% ⬆️",
                "قريب من السعر العالمي (-3%) ✓",
                "في المركز الثاني محلياً 🥈",
            ],
        },
        {
            id: "copper",
            name: "نحاس نظيف",
            icon: "electrical_services",
            yourPrice: 28500,
            localAvg: 28000,
            globalPrice: 29200,
            rank: 3,
            totalBuyers: 38,
            trend: "up" as const,
            weeklyChange: +1.8,
            recommendations: [
                "سعرك أعلى من المتوسط المحلي بـ1.8% ⬆️",
                "أقل من السعر العالمي بـ2.4% ⬇️",
                "يمكنك رفع السعر قليلاً لمطابقة السوق العالمي",
            ],
        },
        {
            id: "aluminum",
            name: "ألمنيوم نقي",
            icon: "recycling",
            yourPrice: 8400,
            localAvg: 8300,
            globalPrice: 8600,
            rank: 4,
            totalBuyers: 52,
            trend: "stable" as const,
            weeklyChange: +0.2,
            recommendations: [
                "سعرك قريب من المتوسط المحلي (+1.2%) ✓",
                "أقل من السعر العالمي بـ2.3% ⬇️",
                "السوق مستقر هذا الأسبوع",
            ],
        },
    ];

    const globalMarkets = [
        { exchange: "LME London", material: "نحاس", price: 11.0, change: +0.5 },
        { exchange: "LME London", material: "ألمنيوم", price: 3.23, change: -0.2 },
        { exchange: "COMEX NY", material: "حديد", price: 1.24, change: +0.8 },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="تحليلات السوق والتسعير" />

            <main className="flex-1 pb-24">
                {/* Summary Cards */}
                <div className="p-4 grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl p-3 border border-green-500/30">
                        <p className="text-xs text-green-400 mb-1">متوسط تنافسيتك</p>
                        <p className="text-2xl font-bold text-white font-english">87%</p>
                        <p className="text-[10px] text-green-400 mt-1">أعلى من 65% من المنافسين</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-xl p-3 border border-blue-500/30">
                        <p className="text-xs text-blue-400 mb-1">ترتيبك العام</p>
                        <p className="text-2xl font-bold text-white font-english">#3</p>
                        <p className="text-[10px] text-blue-400 mt-1">من بين 127 تاجر</p>
                    </div>
                </div>

                {/* Material Filter */}
                <div className="px-4 mb-4">
                    <select
                        value={selectedMaterial}
                        onChange={(e) => setSelectedMaterial(e.target.value)}
                        className="w-full bg-surface-highlight border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">جميع المواد (3)</option>
                        <option value="iron">حديد HMS 1</option>
                        <option value="copper">نحاس نظيف</option>
                        <option value="aluminum">ألمنيوم نقي</option>
                    </select>
                </div>

                {/* Material Analytics */}
                <div className="px-4 space-y-4">
                    {materials
                        .filter((m) => selectedMaterial === "all" || m.id === selectedMaterial)
                        .map((material) => (
                            <div
                                key={material.id}
                                className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50"
                            >
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 border border-primary/30">
                                        <span className="material-symbols-outlined text-primary !text-[24px]">
                                            {material.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white text-sm">{material.name}</h3>
                                        <p className="text-xs text-slate-500">
                                            تصنيفك: #{material.rank} من {material.totalBuyers}
                                        </p>
                                    </div>
                                    <div
                                        className={`px-2 py-1 rounded text-xs font-bold font-english ${material.weeklyChange > 0
                                                ? "bg-green-500/10 text-green-400"
                                                : "bg-red-500/10 text-red-400"
                                            }`}
                                    >
                                        {material.weeklyChange > 0 ? "+" : ""}
                                        {material.weeklyChange}%
                                    </div>
                                </div>

                                {/* Price Comparison Chart */}
                                <div className="space-y-3 mb-4">
                                    {/* Your Price */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-white font-bold">سعرك</span>
                                            <span className="text-sm font-bold text-white font-english">
                                                {material.yourPrice.toLocaleString()} ل.س
                                            </span>
                                        </div>
                                        <div className="h-2 bg-bg-dark rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-blue-500"
                                                style={{
                                                    width: `${(material.yourPrice / material.globalPrice) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Local Average */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-slate-400">متوسط السوق المحلي</span>
                                            <span className="text-sm text-slate-400 font-english">
                                                {material.localAvg.toLocaleString()} ل.س
                                            </span>
                                        </div>
                                        <div className="h-2 bg-bg-dark rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-slate-600"
                                                style={{
                                                    width: `${(material.localAvg / material.globalPrice) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Global Price */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-green-400">السعر العالمي</span>
                                            <span className="text-sm text-green-400 font-english">
                                                {material.globalPrice.toLocaleString()} ل.س
                                            </span>
                                        </div>
                                        <div className="h-2 bg-bg-dark rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500" style={{ width: "100%" }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendations */}
                                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                                    <h4 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[14px]">lightbulb</span>
                                        توصيات التسعير
                                    </h4>
                                    <ul className="space-y-1">
                                        {material.recommendations.map((rec, idx) => (
                                            <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                                <span className="text-blue-400 mt-0.5">•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                </div>

                {/* Global Markets */}
                <div className="p-4 mt-4">
                    <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined !text-[18px]">public</span>
                        أسعار البورصات العالمية (Live)
                    </h3>
                    <div className="space-y-2">
                        {globalMarkets.map((market, idx) => (
                            <div
                                key={idx}
                                className="bg-surface-highlight rounded-xl p-3 border border-slate-700/50 flex items-center justify-between"
                            >
                                <div>
                                    <p className="text-sm font-bold text-white">{market.material}</p>
                                    <p className="text-xs text-slate-500">{market.exchange}</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white font-english">
                                        ${market.price}/kg
                                    </p>
                                    <p
                                        className={`text-xs font-bold font-english ${market.change > 0 ? "text-green-500" : "text-red-500"
                                            }`}
                                    >
                                        {market.change > 0 ? "+" : ""}
                                        {market.change}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Action Button */}
                <div className="p-4">
                    <Link
                        href="/buyer/pricing-dashboard"
                        className="block w-full py-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-bold text-center hover:opacity-90 transition shadow-lg shadow-primary/20"
                    >
                        تحديث الأسعار الآن
                    </Link>
                </div>
            </main>
        </div>
    );
}
