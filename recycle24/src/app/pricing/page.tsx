"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useState } from "react";

export default function PricingPage() {
    const [selectedRegion, setSelectedRegion] = useState("الكل");
    const [selectedMaterial, setSelectedMaterial] = useState("الكل");

    // Simulated pricing data
    const pricingData = [
        {
            material: "حديد خام (HMS)",
            category: "معادن حديدية",
            regions: {
                "دمشق": { price: 3200, trend: "up", lastUpdate: "منذ ساعتين" },
                "حلب": { price: 3150, trend: "stable", lastUpdate: "منذ 4 ساعات" },
                "حمص": { price: 3100, trend: "down", lastUpdate: "منذ 6 ساعات" }
            }
        },
        {
            material: "نحاس نقي (99%)",
            category: "معادن غير حديدية",
            regions: {
                "دمشق": { price: 35000, trend: "up", lastUpdate: "منذ ساعة" },
                "حلب": { price: 34500, trend: "up", lastUpdate: "منذ 3 ساعات" },
                "حمص": { price: 34000, trend: "stable", lastUpdate: "منذ 5 ساعات" }
            }
        },
        {
            material: "ألمنيوم خام",
            category: "معادن غير حديدية",
            regions: {
                "دمشق": { price: 12500, trend: "stable", lastUpdate: "منذ ساعتين" },
                "حلب": { price: 12300, trend: "down", lastUpdate: "منذ 4 ساعات" },
                "حمص": { price: 12400, trend: "stable", lastUpdate: "منذ 3 ساعات" }
            }
        },
        {
            material: "بلاستيك PET",
            category: "بلاستيك",
            regions: {
                "دمشق": { price: 850, trend: "up", lastUpdate: "منذ ساعة" },
                "حلب": { price: 820, trend: "stable", lastUpdate: "منذ 5 ساعات" },
                "حمص": { price: 800, trend: "down", lastUpdate: "منذ 7 ساعات" }
            }
        },
        {
            material: "كرتون مضغوط",
            category: "ورق وكرتون",
            regions: {
                "دمشق": { price: 450, trend: "stable", lastUpdate: "منذ 3 ساعات" },
                "حلب": { price: 430, trend: "stable", lastUpdate: "منذ 6 ساعات" },
                "حمص": { price: 420, trend: "down", lastUpdate: "منذ 4 ساعات" }
            }
        }
    ];

    const regions = ["الكل", "دمشق", "حلب", "حمص"];
    const materials = ["الكل", "معادن حديدية", "معادن غير حديدية", "بلاستيك", "ورق وكرتون"];

    const getTrendIcon = (trend: string) => {
        if (trend === "up") return { icon: "trending_up", color: "text-green-500" };
        if (trend === "down") return { icon: "trending_down", color: "text-red-500" };
        return { icon: "trending_flat", color: "text-slate-500" };
    };

    const filteredData = pricingData.filter(item => {
        if (selectedMaterial !== "الكل" && item.category !== selectedMaterial) return false;
        return true;
    });

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="قوائم الأسعار" />

            <main className="flex-1 p-4 pb-24">
                {/* Info Banner */}
                <div className="bg-blue-500/10 rounded-xl p-4 mb-4 border border-blue-500/30">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-400 !text-[24px]">info</span>
                        <div>
                            <h3 className="font-bold text-white text-sm mb-1">أسعار السوق المحلي</h3>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                الأسعار تحدّث بشكل دوري من السوق المحلي. جميع الأسعار بالليرة السورية لكل كيلو.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="space-y-3 mb-4">
                    {/* Region Filter */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 mb-2">المنطقة</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {regions.map((region) => (
                                <button
                                    key={region}
                                    onClick={() => setSelectedRegion(region)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${selectedRegion === region
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "bg-surface-highlight text-slate-400 border border-slate-700"
                                        }`}
                                >
                                    {region}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Material Filter */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 mb-2">نوع المادة</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {materials.map((material) => (
                                <button
                                    key={material}
                                    onClick={() => setSelectedMaterial(material)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${selectedMaterial === material
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                            : "bg-surface-highlight text-slate-400 border border-slate-700"
                                        }`}
                                >
                                    {material}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pricing Table */}
                <div className="space-y-3">
                    {filteredData.map((item, idx) => (
                        <div key={idx} className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-white text-base">{item.material}</h3>
                                    <p className="text-xs text-slate-500">{item.category}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {Object.entries(item.regions)
                                    .filter(([region]) => selectedRegion === "الكل" || region === selectedRegion)
                                    .map(([region, data]) => {
                                        const trend = getTrendIcon(data.trend);
                                        return (
                                            <div
                                                key={region}
                                                className="flex items-center justify-between p-3 bg-bg-dark rounded-lg border border-slate-800"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-white mb-0.5">{region}</p>
                                                    <p className="text-[10px] text-slate-500">{data.lastUpdate}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-left">
                                                        <p className="text-lg font-bold text-white font-english">
                                                            {data.price.toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500">ل.س / كغ</p>
                                                    </div>
                                                    <span className={`material-symbols-outlined ${trend.color} !text-[24px]`}>
                                                        {trend.icon}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-6 bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                    <h3 className="font-bold text-white text-sm mb-3">مؤشرات الاتجاه</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-green-500 !text-[20px]">trending_up</span>
                            <span className="text-xs text-slate-300">سعر صاعد (مقارنة بآخر تحديث)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-500 !text-[20px]">trending_flat</span>
                            <span className="text-xs text-slate-300">سعر ثابت (بدون تغيير)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500 !text-[20px]">trending_down</span>
                            <span className="text-xs text-slate-300">سعر نازل (مقارنة بآخر تحديث)</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
