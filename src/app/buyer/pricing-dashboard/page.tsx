"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { allMaterials, Material } from "@/data/materials";

const governorates = [
    "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "الل اذقية", "طرطوس",
    "إدلب", "الحسكة", "دير الزور", "الرقة", "درعا", "السويداء", "القنيطرة"
];

interface MaterialPrice extends Material {
    enabled: boolean;
    currentPrice: string;
    trend: "up" | "down" | "stable";
}

// Helper to generate random trend
const generateTrend = (): "up" | "down" | "stable" => {
    const rand = Math.random();
    if (rand > 0.66) return "up";
    if (rand > 0.33) return "down";
    return "stable";
};

// Initialize materials with data
const initializeMaterials = (): MaterialPrice[] => {
    return allMaterials.map(m => ({
        ...m,
        enabled: true,
        currentPrice: m.basePrice?.toString() || "",
        trend: generateTrend()
    }));
};

export default function BuyerPricingDashboard() {
    const [selectedGovernorate, setSelectedGovernorate] = useState("دمشق");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [materials, setMaterials] = useState<MaterialPrice[]>(initializeMaterials);

    const categories = [
        { id: "all", name: "الكل" },
        { id: "iron", name: "حديد" },
        { id: "copper", name: "نحاس" },
        { id: "aluminum", name: "ألمنيوم" },
        { id: "stainless", name: "فولاذ" },
        { id: "electronics", name: "إلكترونيات" },
        { id: "plastic", name: "بلاستيك" },
        { id: "paper", name: "ورق/كرتون" },
    ];

    const filteredMaterials = useMemo(() => {
        let filtered = materials;

        if (selectedCategory !== "all") {
            filtered = filtered.filter(m => m.category === selectedCategory);
        }

        if (searchQuery) {
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }, [materials, selectedCategory, searchQuery]);

    const toggleMaterial = (id: string) => {
        setMaterials(materials.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
    };

    const updatePrice = (id: string, price: string) => {
        setMaterials(materials.map(m => m.id === id ? { ...m, currentPrice: price } : m));
    };

    const getIconColor = (category: string) => {
        const colors: Record<string, string> = {
            iron: "text-slate-600 dark:text-slate-400",
            copper: "text-orange-600",
            aluminum: "text-blue-500",
            stainless: "text-indigo-600",
            electronics: "text-purple-600",
            plastic: "text-teal-600",
            paper: "text-amber-600",
        };
        return colors[category] || "text-slate-600";
    };

    const getBgColor = (category: string) => {
        const colors: Record<string, string> = {
            iron: "bg-slate-100 dark:bg-slate-800",
            copper: "bg-orange-100 dark:bg-orange-900/20",
            aluminum: "bg-blue-100 dark:bg-blue-900/20",
            stainless: "bg-indigo-100 dark:bg-indigo-900/20",
            electronics: "bg-purple-100 dark:bg-purple-900/20",
            plastic: "bg-teal-100 dark:bg-teal-900/20",
            paper: "bg-amber-100 dark:bg-amber-900/20",
        };
        return colors[category] || "bg-slate-100 dark:bg-slate-800";
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display flex flex-col">
            {/* iOS Status Bar */}
            <div className="h-12 w-full flex items-center justify-between px-6 sticky top-0 bg-background-light dark:bg-background-dark z-50">
                <span className="text-sm font-semibold">9:41</span>
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">signal_cellular_alt</span>
                    <span className="material-symbols-outlined text-xs">wifi</span>
                    <span className="material-symbols-outlined text-xs rotate-90">battery_full</span>
                </div>
            </div>

            {/* Header */}
            <header className="px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">person</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">لوحة التحكم بالأسعار</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">مرحباً، شركة المعادن المتحدة</p>
                        </div>
                    </div>
                    <button className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">notifications_none</span>
                    </button>
                </div>

                {/* Governorate Selector */}
                <div className="relative">
                    <select
                        value={selectedGovernorate}
                        onChange={(e) => setSelectedGovernorate(e.target.value)}
                        className="w-full bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm font-medium appearance-none cursor-pointer"
                    >
                        {governorates.map(gov => (
                            <option key={gov} value={gov}>{gov}</option>
                        ))}
                    </select>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm pointer-events-none">
                        expand_more
                    </span>
                </div>
            </header>

            <main className="flex-1 px-5 pb-32 overflow-y-auto hide-scrollbar">
                {/* Status Card */}
                <div className="p-5 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold mb-1">تحديث أسعار اليوم</h2>
                                <p className="text-white/80 text-sm">
                                    الحالة: <span className="bg-white/20 px-2 py-0.5 rounded text-xs">بانتظار التحديث</span>
                                </p>
                            </div>
                            <span className="material-symbols-outlined text-4xl opacity-40">update</span>
                        </div>
                        <div className="mt-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            <p className="text-sm font-medium">
                                تنتهي الصلاحية خلال: <span className="font-mono">04:20:00</span>
                            </p>
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                {/* Search and Filter */}
                <div className="mt-6 space-y-3">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن مادة..."
                        className="w-full bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm"
                    />

                    {/* Category Dropdown */}
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full h-12 appearance-none rounded-lg bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold px-4 pl-10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                            <span className="material-symbols-outlined !text-[20px]">expand_more</span>
                        </div>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                            <span className="material-symbols-outlined !text-[20px]">category</span>
                        </div>
                    </div>
                </div>

                {/* Materials Count */}
                <div className="mt-6 flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">
                        قائمة المواد ({filteredMaterials.length})
                    </h3>
                    <Link href="/buyer/market-analytics" className="text-xs text-primary font-medium">
                        عرض أسعار السوق
                    </Link>
                </div>

                {/* Material List - Scrollable */}
                <div className="space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent">
                    {filteredMaterials.map((material) => (
                        <div
                            key={material.id}
                            className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg ${getBgColor(material.category)} flex items-center justify-center`}>
                                        <span className={`material-symbols-outlined ${getIconColor(material.category)}`}>
                                            {material.icon}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">{material.name}</h4>
                                        <div className="flex items-center gap-1">
                                            <span
                                                className={`material-symbols-outlined text-[10px] ${material.trend === "up"
                                                    ? "text-green-500"
                                                    : material.trend === "down"
                                                        ? "text-red-500"
                                                        : "text-slate-400"
                                                    }`}
                                            >
                                                {material.trend === "up"
                                                    ? "trending_up"
                                                    : material.trend === "down"
                                                        ? "trending_down"
                                                        : "remove"}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {material.category === "copper" && "سعر النحاس"}
                                                {material.category === "iron" && "سعر الحديد"}
                                                {material.category === "aluminum" && "سعر الألمنيوم"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={material.enabled}
                                        onChange={() => toggleMaterial(material.id)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div className={`flex items-center gap-3 ${!material.enabled && "opacity-50"}`}>
                                <div className="flex-1 relative">
                                    <input
                                        type="number"
                                        disabled={!material.enabled}
                                        value={material.currentPrice}
                                        onChange={(e) => updatePrice(material.id, e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg py-3 px-4 text-left font-mono font-bold focus:ring-2 focus:ring-primary disabled:opacity-50"
                                        placeholder={material.enabled ? "0.00" : "غير متاح"}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                                        ل.س / {material.unit === "kg" ? "كغ" : material.unit === "ton" ? "طن" : "قطعة"}
                                    </span>
                                </div>
                                <div className="text-center px-2">
                                    <p className="text-[10px] text-slate-400 uppercase">السوق</p>
                                    <p className="text-xs font-bold text-slate-500">
                                        {material.basePrice?.toLocaleString() || "-"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Bottom Actions & Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
                {/* Floating Publish Button */}
                <div className="px-5 mb-4">
                    <button className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform">
                        <span className="material-symbols-outlined">publish</span>
                        نشر الأسعار المحدثة
                    </button>
                </div>

                {/* iOS Bottom Tab Bar */}
                <nav className="bg-white/80 dark:bg-card-dark/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between pb-8">
                    <button className="flex flex-col items-center gap-1 text-primary">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-[10px] font-medium">الأسعار</span>
                    </button>
                    <Link href="/buyer/market-analytics" className="flex flex-col items-center gap-1 text-slate-400">
                        <span className="material-symbols-outlined">bar_chart</span>
                        <span className="text-[10px] font-medium">السوق</span>
                    </Link>
                    <Link href="/buyer/material-variants" className="flex flex-col items-center gap-1 text-slate-400">
                        <span className="material-symbols-outlined">category</span>
                        <span className="text-[10px] font-medium">الأصناف</span>
                    </Link>
                    <Link href="/profile" className="flex flex-col items-center gap-1 text-slate-400">
                        <span className="material-symbols-outlined">person</span>
                        <span className="text-[10px] font-medium">حسابي</span>
                    </Link>
                </nav>
            </div>

            {/* Background Pattern */}
            <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            <style jsx global>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
