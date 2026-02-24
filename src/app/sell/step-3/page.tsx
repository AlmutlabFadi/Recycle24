"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

// Mock buyers data
const mockBuyers = [
    {
        id: 1,
        name: "ساحة النور للسكراب",
        rating: 4.9,
        reviews: 128,
        distance: "2.3 كم",
        price: 48000,
        badge: "موثق",
        materials: ["حديد", "نحاس", "ألمنيوم"],
        features: ["دفع فوري", "نقل مجاني"],
        logo: "N",
    },
    {
        id: 2,
        name: "مؤسسة الأمل للتجارة",
        rating: 4.7,
        reviews: 85,
        distance: "3.5 كم",
        price: 46500,
        badge: "موثق",
        materials: ["حديد", "كرتون", "بلاستيك"],
        features: ["سعر ثابت"],
        logo: "A",
    },
    {
        id: 3,
        name: "مركز الشرق للتدوير",
        rating: 4.8,
        reviews: 203,
        distance: "5.1 كم",
        price: 49000,
        badge: "مميز",
        materials: ["جميع الأنواع"],
        features: ["دفع فوري", "نقل مجاني", "عقد رقمي"],
        logo: "E",
    },
    {
        id: 4,
        name: "شركة المستقبل للمعادن",
        rating: 4.5,
        reviews: 64,
        distance: "7.2 كم",
        price: 47500,
        badge: "جديد",
        materials: ["نحاس", "ألمنيوم", "فولاذ"],
        features: ["سعر تنافسي"],
        logo: "F",
    },
];

export default function SellStep3Page() {
    const [sortBy, setSortBy] = useState<"price" | "distance" | "rating">("price");
    const [selectedBuyer, setSelectedBuyer] = useState<number | null>(null);

    const sortedBuyers = [...mockBuyers].sort((a, b) => {
        if (sortBy === "price") return b.price - a.price;
        if (sortBy === "distance") return parseFloat(a.distance) - parseFloat(b.distance);
        if (sortBy === "rating") return b.rating - a.rating;
        return 0;
    });

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="بيع الخردة - الخطوة 3" />

            {/* Progress Bar */}
            <div className="px-4 py-4 bg-surface-dark border-b border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">الخطوة 3 من 3</span>
                    <span className="text-xs text-primary font-bold">اختيار المشتري</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-primary rounded-full transition-all duration-500"></div>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="bg-primary/10 border-b border-primary/20 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">recycling</span>
                        <span className="text-sm text-slate-300">حديد خردة - 500 كغ</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">location_on</span>
                        <span className="text-sm text-slate-300">دمشق</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 p-4 pb-32">
                {/* Sort Options */}
                <section className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-white">المشترين المتاحون</h2>
                        <span className="text-sm text-slate-400">{mockBuyers.length} مشتري</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {[
                            { id: "price", label: "السعر", icon: "payments" },
                            { id: "distance", label: "الأقرب", icon: "near_me" },
                            { id: "rating", label: "التقييم", icon: "star" },
                        ].map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setSortBy(option.id as typeof sortBy)}
                                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                    sortBy === option.id
                                        ? "bg-primary text-white"
                                        : "bg-surface-highlight text-slate-300 border border-slate-700"
                                }`}
                            >
                                <span className="material-symbols-outlined !text-[18px]">{option.icon}</span>
                                {option.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Buyers List */}
                <section className="space-y-3">
                    {sortedBuyers.map((buyer, index) => (
                        <div
                            key={buyer.id}
                            onClick={() => setSelectedBuyer(buyer.id)}
                            className={`relative bg-surface-highlight rounded-xl p-4 border-2 transition-all cursor-pointer ${
                                selectedBuyer === buyer.id
                                    ? "border-primary bg-primary/5"
                                    : "border-slate-700 hover:border-slate-600"
                            }`}
                        >
                            {/* Badge */}
                            <div className="absolute top-3 left-3">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                    buyer.badge === "موثق" ? "bg-green-500/20 text-green-400" :
                                    buyer.badge === "مميز" ? "bg-primary/20 text-primary" :
                                    "bg-slate-600/50 text-slate-300"
                                }`}>
                                    {buyer.badge}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                {/* Logo */}
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xl font-bold shrink-0">
                                    {buyer.logo}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white truncate">{buyer.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1 text-sm text-yellow-500">
                                            <span className="material-symbols-outlined !text-[16px]">star</span>
                                            {buyer.rating}
                                        </span>
                                        <span className="text-sm text-slate-400">({buyer.reviews} تقييم)</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="material-symbols-outlined !text-[16px] text-slate-500">near_me</span>
                                        <span className="text-sm text-slate-400">{buyer.distance}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Materials */}
                            <div className="flex flex-wrap gap-1 mt-3">
                                {buyer.materials.map((mat, i) => (
                                    <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                        {mat}
                                    </span>
                                ))}
                            </div>

                            {/* Features */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {buyer.features.map((feat, i) => (
                                    <span key={i} className="text-xs flex items-center gap-1 text-primary">
                                        <span className="material-symbols-outlined !text-[14px]">check_circle</span>
                                        {feat}
                                    </span>
                                ))}
                            </div>

                            {/* Price */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                                <span className="text-sm text-slate-400">السعر المقترح:</span>
                                <span className="text-xl font-bold text-primary">
                                    {buyer.price.toLocaleString()} <span className="text-sm">ل.س/كغ</span>
                                </span>
                            </div>

                            {/* Selection Indicator */}
                            {selectedBuyer === buyer.id && (
                                <div className="absolute top-3 right-3">
                                    <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                                </div>
                            )}
                        </div>
                    ))}
                </section>

                {/* Map Button */}
                <Link
                    href="/sell/buyers/map"
                    className="flex items-center justify-center gap-2 w-full mt-6 py-3 rounded-xl border-2 border-dashed border-slate-600 text-slate-400 hover:border-primary hover:text-primary transition-all"
                >
                    <span className="material-symbols-outlined">map</span>
                    عرض على الخريطة
                </Link>
            </main>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-surface-dark border-t border-slate-800 p-4 pb-safe">
                <div className="max-w-md mx-auto">
                    {selectedBuyer ? (
                        <div className="space-y-3">
                            <div className="bg-primary/10 rounded-xl p-3 text-center">
                                <span className="text-sm text-slate-300">السعر المتوقع:</span>
                                <span className="text-xl font-bold text-primary mr-2">
                                    {(48000 * 500).toLocaleString()} ل.س
                                </span>
                            </div>
                            <Link
                                href={`/sell/confirm?buyer=${selectedBuyer}`}
                                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg bg-primary text-white hover:bg-primary-dark active:scale-[0.98] transition-all"
                            >
                                <span>تأكيد البيع</span>
                                <span className="material-symbols-outlined">check_circle</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-slate-500">
                            اختر مشترياً للمتابعة
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
