"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";

interface DashboardStats {
    totalSales: number;
    activeAuctions: number;
    activeDeals: number;
    walletBalance: number;
    loyaltyPoints: number;
    monthlyRevenue: number;
}

interface ActiveAuction {
    id: string;
    title: string;
    currentBid: number;
    bidders: number;
    timeLeft: string;
    status: string;
}

interface RecentDeal {
    id: string;
    buyer: { id: string; name: string | null };
    material: string;
    amount: number;
    status: string;
}

function formatNumber(num: number): string {
    return new Intl.NumberFormat("ar-SY").format(num);
}

export default function TraderDashboardPage() {
    const { user, isAuthenticated } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activeAuctions, setActiveAuctions] = useState<ActiveAuction[]>([]);
    const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboard() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/dashboard?userId=${user.id}`);
                const data = await response.json();

                if (data.success) {
                    setStats(data.stats);
                    setActiveAuctions(data.activeAuctions);
                    setRecentDeals(data.recentDeals);
                }
            } catch (error) {
                console.error("Error fetching dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchDashboard();
    }, [user?.id]);

    if (!isAuthenticated) {
        return (
            <>
                <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
                    <div className="flex items-center justify-between p-4">
                        <h1 className="text-lg font-bold text-white">لوحة التحكم</h1>
                    </div>
                </header>
                <main className="flex-1 pb-24 p-4 flex items-center justify-center">
                    <div className="text-center">
                        <span className="material-symbols-outlined !text-6xl text-slate-600 mb-4">lock</span>
                        <p className="text-slate-400 mb-4">يرجى تسجيل الدخول للوصول إلى لوحة التحكم</p>
                        <Link href="/login" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold">
                            تسجيل الدخول
                        </Link>
                    </div>
                </main>
                <BottomNavigation />
            </>
        );
    }

    if (isLoading) {
        return (
            <>
                <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
                    <div className="flex items-center justify-between p-4">
                        <h1 className="text-lg font-bold text-white">لوحة التحكم</h1>
                    </div>
                </header>
                <main className="flex-1 pb-24 p-4 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </main>
                <BottomNavigation />
            </>
        );
    }

    return (
        <>
            <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
                <div className="flex items-center justify-between p-4">
                    <h1 className="text-lg font-bold text-white">لوحة التحكم</h1>
                    <Link href="/dashboard/analytics" className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition">
                        <span className="material-symbols-outlined text-white">analytics</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 pb-24 p-4">
                {stats && (
                    <>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl p-4 border border-green-500/30">
                                <p className="text-xs text-green-400 mb-1">إجمالي المبيعات</p>
                                <p className="text-2xl font-bold text-white font-english">{formatNumber(stats.totalSales)}</p>
                                <p className="text-xs text-green-400 mt-1">ل.س</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-2xl p-4 border border-blue-500/30">
                                <p className="text-xs text-blue-400 mb-1">الرصيد</p>
                                <p className="text-2xl font-bold text-white font-english">{formatNumber(stats.walletBalance)}</p>
                                <p className="text-xs text-blue-400 mt-1">ل.س</p>
                            </div>
                            <div className="bg-surface-highlight rounded-2xl p-4 border border-slate-700/50">
                                <p className="text-xs text-slate-500 mb-1">المزادات النشطة</p>
                                <p className="text-2xl font-bold text-white font-english">{stats.activeAuctions}</p>
                            </div>
                            <div className="bg-surface-highlight rounded-2xl p-4 border border-slate-700/50">
                                <p className="text-xs text-slate-500 mb-1">الصفقات الجارية</p>
                                <p className="text-2xl font-bold text-white font-english">{stats.activeDeals}</p>
                            </div>
                        </div>
                    </>
                )}

                <div className="mb-6">
                    <h2 className="text-sm font-bold text-white mb-3">إجراءات سريعة</h2>
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { icon: "add_circle", label: "مزاد جديد", href: "/auctions/create", color: "text-primary" },
                            { icon: "inventory", label: "إعلان جديد", href: "/offers/create", color: "text-green-500" },
                            { icon: "analytics", label: "التقارير", href: "/dashboard/analytics", color: "text-blue-500" },
                            { icon: "tune", label: "تعديل الأسعار", href: "/dashboard/pricing", color: "text-orange-500" },
                        ].map((action, i) => (
                            <Link
                                key={i}
                                href={action.href}
                                className="flex flex-col items-center gap-2 p-3 bg-surface-highlight rounded-xl border border-slate-700/50 hover:border-primary/50 transition group"
                            >
                                <span className={`material-symbols-outlined !text-[28px] ${action.color} group-hover:scale-110 transition`}>
                                    {action.icon}
                                </span>
                                <span className="text-[10px] text-slate-400 text-center leading-tight">{action.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {activeAuctions.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-white">مزاداتي النشطة</h2>
                            <Link href="/auctions" className="text-xs text-primary font-bold">
                                عرض الكل
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {activeAuctions.map((auction) => (
                                <Link
                                    key={auction.id}
                                    href={`/auctions/${auction.id}`}
                                    className="block bg-surface-highlight rounded-xl p-3 border border-slate-700/50 hover:border-primary/50 transition"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-white text-sm">{auction.title}</h3>
                                        <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                                            نشط
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <div>
                                            <p className="text-slate-500 mb-0.5">أعلى عطاء</p>
                                            <p className="font-bold text-white font-english">{formatNumber(auction.currentBid)} ل.س</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-slate-500 mb-0.5">المزايدون</p>
                                            <p className="font-bold text-primary font-english">{auction.bidders}</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-slate-500 mb-0.5">الوقت المتبقي</p>
                                            <p className="font-bold text-white">{auction.timeLeft}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {recentDeals.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-white">الصفقات الأخيرة</h2>
                            <Link href="/deals" className="text-xs text-primary font-bold">
                                عرض الكل
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recentDeals.map((deal) => (
                                <Link
                                    key={deal.id}
                                    href={`/deals/${deal.id}`}
                                    className="block bg-surface-highlight rounded-xl p-3 border border-slate-700/50 hover:border-primary/50 transition"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="text-xs text-slate-500">#{deal.id}</p>
                                            <p className="font-bold text-white text-sm">{deal.buyer.name || "غير معروف"}</p>
                                        </div>
                                        <span
                                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                deal.status === "COMPLETED" 
                                                    ? "text-green-500 bg-green-500/10" 
                                                    : "text-blue-500 bg-blue-500/10"
                                            }`}
                                        >
                                            {deal.status === "COMPLETED" ? "مكتمل" : "قيد التنفيذ"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400">{deal.material}</span>
                                        <span className="font-bold text-white font-english">{formatNumber(deal.amount)} ل.س</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {activeAuctions.length === 0 && recentDeals.length === 0 && (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined !text-6xl text-slate-600 mb-4">inventory_2</span>
                        <p className="text-slate-400 mb-4">لا توجد مزادات أو صفقات بعد</p>
                        <Link href="/auctions/create" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold">
                            <span className="material-symbols-outlined !text-xl">add</span>
                            إنشاء مزاد جديد
                        </Link>
                    </div>
                )}
            </main>

            <BottomNavigation />
        </>
    );
}
