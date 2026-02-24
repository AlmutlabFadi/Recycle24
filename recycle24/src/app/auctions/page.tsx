"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuctions } from "@/hooks/useAuctions";
import { useAuth } from "@/contexts/AuthContext";

const filters = [
    { id: "all", label: "الكل" },
    { id: "LIVE", label: "مباشرة" },
    { id: "SCHEDULED", label: "قادمة" },
    { id: "ENDED", label: "منتهية" },
];

const categoryLabels: Record<string, string> = {
    IRON: "حديد",
    COPPER: "نحاس",
    ALUMINUM: "ألمنيوم",
    PLASTIC: "بلاستيك",
    CARDBOARD: "كرتون",
    MIXED: "خلطة",
    BRASS: "نحاس أصفر",
    STEEL: "ستيل",
    ZINC: "زنك",
};

const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
        IRON: "bg-slate-500/20 text-slate-300",
        COPPER: "bg-orange-500/20 text-orange-400",
        ALUMINUM: "bg-gray-500/20 text-gray-300",
        PLASTIC: "bg-blue-500/20 text-blue-400",
        CARDBOARD: "bg-amber-500/20 text-amber-400",
        MIXED: "bg-green-500/20 text-green-400",
        BRASS: "bg-yellow-500/20 text-yellow-400",
        STEEL: "bg-zinc-500/20 text-zinc-300",
        ZINC: "bg-indigo-500/20 text-indigo-400",
    };
    return colors[category] || "bg-slate-500/20 text-slate-300";
};

export default function AuctionsPage() {
    const [activeFilter, setActiveFilter] = useState("all");
    const { auctions, isLoading, error, refresh } = useAuctions();
    const { isAuthenticated } = useAuth();

    const filteredAuctions = activeFilter === "all"
        ? auctions
        : auctions.filter((a) => a.status === activeFilter);

    const liveAuctions = filteredAuctions.filter(a => a.status === "LIVE");
    const scheduledAuctions = filteredAuctions.filter(a => a.status === "SCHEDULED");
    const endedAuctions = filteredAuctions.filter(a => a.status === "ENDED");

    const formatTimeRemaining = (endsAt?: string) => {
        if (!endsAt) return "غير محدد";
        const now = new Date();
        const end = new Date(endsAt);
        const diff = end.getTime() - now.getTime();
        
        if (diff <= 0) return "انتهى";
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days} يوم`;
        }
        return `${hours}:${minutes.toString().padStart(2, "0")}`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark font-display">
                <HeaderWithBack title="المزادات" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <span className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin block mx-auto mb-4"></span>
                        <p className="text-slate-400">جاري تحميل المزادات...</p>
                    </div>
                </div>
                <BottomNavigation />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark font-display">
                <HeaderWithBack title="المزادات" />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
                        <h2 className="text-xl font-bold text-white mb-2">حدث خطأ</h2>
                        <p className="text-slate-400 mb-4">{error}</p>
                        <button
                            onClick={refresh}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                        >
                            إعادة المحاولة
                            <span className="material-symbols-outlined">refresh</span>
                        </button>
                    </div>
                </div>
                <BottomNavigation />
            </div>
        );
    }

    return (
        <>
            <HeaderWithBack title="المزادات" />

            {/* Filters */}
            <div className="px-4 py-3 bg-surface-dark border-b border-slate-800">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                activeFilter === filter.id
                                    ? "bg-primary text-white"
                                    : "bg-surface-highlight text-slate-300 border border-slate-700"
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-1 pb-24">
                {/* Live Auctions */}
                {(activeFilter === "all" || activeFilter === "LIVE") && liveAuctions.length > 0 && (
                    <section className="px-4 mt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <h2 className="text-lg font-bold text-white">مزادات مباشرة</h2>
                            <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                {liveAuctions.length}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {liveAuctions.map((auction) => (
                                <Link
                                    key={auction.id}
                                    href={`/auctions/${auction.id}`}
                                    className="block rounded-xl bg-surface-highlight border border-red-500/20 p-4 hover:border-red-500/40 transition group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(auction.category)}`}>
                                                    {categoryLabels[auction.category] || auction.category}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-white group-hover:text-primary transition">{auction.title}</h3>
                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined !text-[12px]">location_on</span>
                                                {auction.location}
                                            </p>
                                        </div>
                                        <div className="text-left">
                                            <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full mb-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                                مباشر
                                            </span>
                                            <p className="text-xs text-slate-500">ينتهي خلال</p>
                                            <p className="text-sm font-bold text-red-400">{formatTimeRemaining(auction.endsAt)}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700/50">
                                        <div>
                                            <p className="text-xs text-slate-400">أعلى مزايدة</p>
                                            <p className="text-lg font-bold text-white font-english dir-ltr">
                                                {(auction.currentBid || auction.startingBid)?.toLocaleString()} <span className="text-xs text-primary">ل.س</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-xs text-slate-500">الوزن</p>
                                                <p className="text-sm font-bold text-white">{auction.weight} {auction.weightUnit}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-slate-500">مزايدات</p>
                                                <p className="text-sm font-bold text-white font-english">{auction.bidsCount || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Scheduled Auctions */}
                {(activeFilter === "all" || activeFilter === "SCHEDULED") && scheduledAuctions.length > 0 && (
                    <section className="px-4 mt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary !text-[20px]">schedule</span>
                            <h2 className="text-lg font-bold text-white">مزادات قادمة</h2>
                            <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                {scheduledAuctions.length}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {scheduledAuctions.map((auction) => (
                                <Link
                                    key={auction.id}
                                    href={`/auctions/${auction.id}`}
                                    className="block rounded-xl bg-surface-dark border border-slate-700 p-4 hover:border-primary/30 transition"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(auction.category)}`}>
                                                    {categoryLabels[auction.category] || auction.category}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-white text-sm">{auction.title}</h3>
                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined !text-[12px]">location_on</span>
                                                {auction.location}
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                                            {auction.scheduledAt ? new Date(auction.scheduledAt).toLocaleDateString("ar-SA") : "قريباً"}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700/50">
                                        <div>
                                            <p className="text-xs text-slate-400">سعر البدء</p>
                                            <p className="text-base font-bold text-white font-english dir-ltr">
                                                {auction.startingBid?.toLocaleString()} <span className="text-xs text-primary">ل.س</span>
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500">الوزن</p>
                                            <p className="text-sm font-bold text-white">{auction.weight} {auction.weightUnit}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Ended Auctions */}
                {(activeFilter === "all" || activeFilter === "ENDED") && endedAuctions.length > 0 && (
                    <section className="px-4 mt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-slate-500 !text-[20px]">check_circle</span>
                            <h2 className="text-lg font-bold text-white">مزادات منتهية</h2>
                            <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                {endedAuctions.length}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {endedAuctions.map((auction) => (
                                <Link
                                    key={auction.id}
                                    href={`/auctions/${auction.id}`}
                                    className="block rounded-xl bg-surface-dark border border-slate-700/50 p-4 opacity-75 hover:opacity-100 transition"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-300 text-sm">{auction.title}</h3>
                                            <p className="text-xs text-slate-500 mt-1">{auction.location}</p>
                                        </div>
                                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
                                            منتهي
                                        </span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-slate-800">
                                        <p className="text-xs text-slate-500">السعر النهائي</p>
                                        <p className="text-sm font-bold text-slate-300">{(auction.finalPrice || auction.currentBid)?.toLocaleString()} ل.س</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {filteredAuctions.length === 0 && (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">gavel</span>
                        <h3 className="text-lg font-bold text-white mb-2">لا توجد مزادات</h3>
                        <p className="text-slate-400 mb-6">لم يتم العثور على مزادات مطابقة</p>
                        {isAuthenticated && (
                            <Link
                                href="/auctions/create"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                            >
                                <span className="material-symbols-outlined">add</span>
                                إنشاء مزاد جديد
                            </Link>
                        )}
                    </div>
                )}

                {/* Create Auction CTA */}
                {isAuthenticated && filteredAuctions.length > 0 && (
                    <section className="px-4 mt-6">
                        <Link
                            href="/auctions/create"
                            className="block rounded-xl bg-gradient-to-l from-secondary to-orange-600 p-5 relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold text-white mb-1">عندك كمية كبيرة؟</h3>
                                <p className="text-sm text-orange-100">أنشئ مزادك الخاص واحصل على أفضل عروض الأسعار</p>
                                <div className="mt-3 h-10 px-6 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold text-white flex items-center gap-1 transition inline-flex">
                                    <span className="material-symbols-outlined !text-[18px]">add_circle</span>
                                    إنشاء مزاد جديد
                                </div>
                            </div>
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined !text-[80px] text-white/10">gavel</span>
                        </Link>
                    </section>
                )}
            </main>

            <BottomNavigation />
        </>
    );
}
