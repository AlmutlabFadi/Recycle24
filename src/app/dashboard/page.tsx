"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

interface DriverOffer {
    id: string;
    status: string;
    offeredPrice: number | null;
    offeredAt: string;
    expiresAt: string;
    order: {
        id: string;
        pickupAddress: string;
        dropoffAddress: string;
        recipientName: string | null;
        recipientPhone: string | null;
        status: string;
    };
}

interface DriverDelivery {
    id: string;
    status: string;
    createdAt: string;
    order: {
        id: string;
        pickupAddress: string;
        dropoffAddress: string;
        recipientName: string | null;
        recipientPhone: string | null;
        status: string;
    };
}

interface DriverProfileSummary {
    fullName: string;
    phone: string;
    city: string | null;
    status: string;
    ratingAvg: number;
    ratingCount: number;
}

function formatNumber(num: number): string {
    return new Intl.NumberFormat("ar-SY").format(num);
}

export default function UnifiedDashboardPage() {
    const { user, isAuthenticated, activeRole, switchRole } = useAuth();
    const router = useRouter();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activeAuctions, setActiveAuctions] = useState<ActiveAuction[]>([]);
    const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([]);
    const [isLoading, setIsLoading] = useState(true);    const [driverOffers, setDriverOffers] = useState<DriverOffer[]>([]);
    const [driverDeliveries, setDriverDeliveries] = useState<DriverDelivery[]>([]);
    const [driverProfile, setDriverProfile] = useState<DriverProfileSummary | null>(null);
    const [driverLoading, setDriverLoading] = useState(false);

    const safeStats: DashboardStats = stats ?? {
        totalSales: 0,
        activeAuctions: 0,
        activeDeals: 0,
        walletBalance: 0,
        loyaltyPoints: 0,
        monthlyRevenue: 0,
    };

    const isAdmin = activeRole === "ADMIN";
    const canManageContent = permissions.includes("MANAGE_KNOWLEDGE");
    const canManageAccess = permissions.includes("MANAGE_ACCESS");
    const canManageSafety = permissions.includes("MANAGE_SAFETY");

    useEffect(() => {
        async function fetchDashboard() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            if (activeRole === "DRIVER") {
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
    }, [user?.id, activeRole]);

    useEffect(() => {
        const fetchDriverDashboard = async () => {
            if (!isAuthenticated || activeRole !== "DRIVER") return;
            setDriverLoading(true);
            try {
                const [offersRes, deliveriesRes, profileRes] = await Promise.all([
                    fetch("/api/driver/offers?status=OFFERED", { cache: "no-store" }),
                    fetch("/api/driver/deliveries", { cache: "no-store" }),
                    fetch("/api/driver/me", { cache: "no-store" }),
                ]);

                const offersData = await offersRes.json();
                const deliveriesData = await deliveriesRes.json();
                const profileData = await profileRes.json();

                if (offersRes.ok) setDriverOffers(offersData.offers || []);
                if (deliveriesRes.ok) setDriverDeliveries(deliveriesData.deliveries || []);
                if (profileRes.ok && profileData.driver) {
                    setDriverProfile({
                        fullName: profileData.driver.fullName,
                        phone: profileData.driver.phone,
                        city: profileData.driver.city,
                        status: profileData.driver.status,
                        ratingAvg: profileData.driver.ratingAvg || 0,
                        ratingCount: profileData.driver.ratingCount || 0,
                    });
                }
            } catch (error) {
                console.error("Error fetching driver dashboard:", error);
            } finally {
                setDriverLoading(false);
            }
        };

        fetchDriverDashboard();
    }, [isAuthenticated, activeRole]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchPermissions = async () => {
            try {
                const response = await fetch("/api/admin/access/me", { cache: "no-store" });
                const data = await response.json();
                if (response.ok) {
                    setPermissions(data.permissions || []);
                }
            } catch (error) {
                console.error("Error fetching permissions:", error);
            }
        };

        fetchPermissions();
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAdmin && !isLoading && isAuthenticated) {
            router.replace("/admin/dashboard");
        }
    }, [isAdmin, isLoading, isAuthenticated, router]);

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

    if (isAdmin) {
        return (
            <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-8 text-center font-display">
                <div className="size-24 rounded-[2rem] bg-primary/20 border border-primary/40 flex items-center justify-center mb-8 animate-pulse text-primary">
                    <span className="material-symbols-outlined !text-5xl">rocket_launch</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">مركز القيادة والتحكم</h1>
                <p className="text-slate-400 text-sm mb-8 max-w-sm">جاري تحويلك إلى لوحة الإدارة الشاملة للمنصة...</p>
            </div>
        );
    }

    return (
        <>
            <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
                <div className="flex items-center justify-between p-4">
                    <h1 className="text-lg font-bold text-white">لوحة التحكم</h1>
                </div>
            </header>

            <main className="flex-1 pb-24 p-4">
                {(activeRole === "DRIVER" || !!stats) && (
                    <>
                        {(activeRole as string) === "DRIVER" ? (
                            <div className="mb-6">
                                <h2 className="text-sm font-bold text-white mb-3">لوحة الكابتن (سائق)</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl p-4 border border-blue-500/30">
                                        <p className="text-xs text-blue-400 mb-1">عروض جديدة</p>
                                        <p className="text-2xl font-bold text-white font-english text-left">{driverOffers.length}</p>
                                    </div>
                                    <div className="bg-surface-highlight rounded-2xl p-4 border border-slate-700/50">
                                        <p className="text-xs text-slate-500 mb-1">شحنات نشطة</p>
                                        <p className="text-2xl font-bold text-white font-english text-left">
                                            {driverDeliveries.filter((d) => ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(d.status)).length}
                                        </p>
                                    </div>
                                    <div className="bg-surface-highlight rounded-2xl p-4 border border-slate-700/50">
                                        <p className="text-xs text-slate-500 mb-1">شحنات مكتملة</p>
                                        <p className="text-2xl font-bold text-white font-english text-left">
                                            {driverDeliveries.filter((d) => d.status === "DELIVERED").length}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-emerald-600/20 to-lime-600/20 rounded-2xl p-4 border border-emerald-500/30">
                                        <p className="text-xs text-emerald-400 mb-1">تقييم السائق</p>
                                        <p className="text-2xl font-bold text-white font-english text-left">
                                            {driverProfile ? driverProfile.ratingAvg.toFixed(1) : "0.0"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (activeRole as string) === "TRADER" ? (
                            <div className="mb-6">
                                <h2 className="text-sm font-bold text-white mb-3">النظام المحاسبي المتقدم (تاجر)</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl p-4 border border-green-500/30">
                                        <p className="text-xs text-green-400 mb-1">إجمالي المشتريات والمبيعات</p>
                                        <p className="text-2xl font-bold text-white font-english">         {formatNumber(safeStats.totalSales)}</p>
                                        <p className="text-xs text-green-400 mt-1">ل.س</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-2xl p-4 border border-blue-500/30">
                                        <p className="text-xs text-blue-400 mb-1">الرصيد التشغيلي</p>
                                        <p className="text-2xl font-bold text-white font-english">{formatNumber(safeStats.walletBalance)}</p>
                                        <p className="text-xs text-blue-400 mt-1">ل.س</p>
                                    </div>
                                    <div className="bg-surface-highlight rounded-2xl p-4 border border-slate-700/50">
                                        <p className="text-xs text-slate-500 mb-1">الدورات المالية</p>
                                        <p className="text-2xl font-bold text-white font-english">12</p>
                                    </div>
                                    <div className="bg-surface-highlight rounded-2xl p-4 border border-slate-700/50">
                                        <p className="text-xs text-slate-500 mb-1">صافي الأرباح (تقريبي)</p>
                                        <p className="text-2xl font-bold text-white font-english">15.4%</p>
                                    </div>
                                </div>
                            </div>
                        ) : (activeRole as string) === "ADMIN" ? (
                            <div className="mb-6">
                                <h2 className="text-sm font-bold text-white mb-3">لوحة الإدارة</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-2xl p-4 border border-blue-500/30">
                                        <p className="text-xs text-blue-400 mb-1">الوصول الإداري</p>
                                        <p className="text-2xl font-bold text-white font-english">100%</p>
                                    </div>
                                    <div className="bg-surface-highlight rounded-2xl p-4 border border-slate-700/50">
                                        <p className="text-xs text-slate-500 mb-1">صلاحيات متقدمة</p>
                                        <p className="text-2xl font-bold text-white font-english">∞</p>
                                    </div>
                                </div>
                            </div>
                        ) : activeRole === "GOVERNMENT" ? (
                            <div className="mb-6">
                                <h2 className="text-sm font-bold text-white mb-3">بوابة الجهات الحكومية</h2>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-2xl p-4 border border-amber-500/30">
                                        <p className="text-xs text-amber-400 mb-1">البلاغات الرقابية النشطة</p>
                                        <p className="text-2xl font-bold text-white font-english text-left">12</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <h2 className="text-sm font-bold text-white mb-3">حالة الحساب (عميل)</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl p-4 border border-green-500/30">
                                        <p className="text-xs text-green-400 mb-1">إجمالي الأرباح والمبيعات</p>
                                        <p className="text-2xl font-bold text-white font-english">         {formatNumber(safeStats.totalSales)}</p>
                                        <p className="text-xs text-green-400 mt-1">ل.س</p>
                                    </div>
                                    <div className="bg-surface-highlight rounded-2xl p-4 border border-slate-700/50">
                                        <p className="text-xs text-slate-500 mb-1">الرصيد المتاح</p>
                                        <p className="text-2xl font-bold text-white font-english">{formatNumber(safeStats.walletBalance)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeRole as string) !== "DRIVER" && (
                            <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-surface-highlight rounded-2xl p-4 border border-slate-700/50">
                                <p className="text-xs text-slate-500 mb-1">المزادات/العروض النشطة</p>
                                <p className="text-2xl font-bold text-white font-english">{safeStats.activeAuctions}</p>
                            </div>
                            <div className="bg-surface-highlight rounded-2xl p-4 border border-slate-700/50">
                                <p className="text-xs text-slate-500 mb-1">الصفقات الجارية</p>
                                <p className="text-2xl font-bold text-white font-english">{safeStats.activeDeals}</p>
                            </div>
                            </div>
                        )}
                    </>
                )}

                <div className="mb-6">
                    <h2 className="text-sm font-bold text-white mb-3">القائمة السريعة</h2>
                    
                    {/* ADMIN VIEW QUICK ACTIONS - Governance Focused */}
                    {(activeRole as string) === "ADMIN" && (
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { icon: "person_search", label: "حوكمة المستخدمين", href: "/admin/users", color: "text-blue-400" },
                                { icon: "monitoring", label: "مراقب السوق", href: "/admin/marketplace", color: "text-emerald-400" },
                                { icon: "account_balance", label: "النظام المالي", href: "/admin/finance", color: "text-amber-400" },
                                { icon: "design_services", label: "مصمم الباقات", href: "/admin/subscriptions/packages", color: "text-purple-400" },
                                { icon: "verified", label: "التوثيق", href: "/admin/verification", color: "text-sky-400" },
                                { icon: "support_agent", label: "الدعم", href: "/admin/support", color: "text-red-400" },
                                { icon: "shield", label: "الأمن (SOC)", href: "/admin/soc", color: "text-indigo-400" },
                                { icon: "settings", label: "الإعدادات", href: "/admin/settings", color: "text-slate-400" },
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
                    )}

                    {/* CLIENT VIEW QUICK ACTIONS */}
                    {activeRole === "CLIENT" && (
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { icon: "wallet", label: "المحفظة", href: "/wallet", color: "text-green-500" },
                                { icon: "gavel", label: "المزادات", href: "/auctions", color: "text-purple-400" },
                                { icon: "inventory_2", label: "عروضي", href: "/offers", color: "text-blue-500" },
                                { icon: "handshake", label: "الصفقات", href: "/deals", color: "text-purple-500" },
                                { icon: "local_shipping", label: "التوصيل", href: "/transport/book", color: "text-orange-500" },
                                { icon: "trending_up", label: "الأسعار", href: "/market", color: "text-primary" },
                                { icon: "report", label: "البلاغات", href: "/stolen-reports", color: "text-red-500" },
                                { icon: "notifications_active", label: "تنبيهات", href: "/price-alerts", color: "text-yellow-500" },
                                { icon: "work", label: "الوظائف", href: "/jobs", color: "text-teal-500" },
                                { icon: "card_membership", label: "الاشتراكات", href: "/subscription/plans", color: "text-indigo-500" },
                                { icon: "star", label: "المكافآت", href: "/rewards/store", color: "text-yellow-400" },
                                { icon: "health_and_safety", label: "السلامة", href: "/safety", color: "text-pink-500" },
                                { icon: "headset_mic", label: "الدعم الفني", href: "/support/tickets", color: "text-sky-500" },
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
                    )}

                    {/* TRADER VIEW QUICK ACTIONS */}
                    {activeRole === "TRADER" && (
                         <div className="grid grid-cols-4 gap-3">
                         {[
                             { icon: "add_circle", label: "مزاد جديد", href: "/auctions/create", color: "text-primary" },
                             { icon: "inventory", label: "الطلبات", href: "/offers", color: "text-green-500" },
                             { icon: "account_balance", label: "الأرباح", href: "/wallet", color: "text-blue-500" },
                             { icon: "tune", label: "التسعير", href: "/dashboard/pricing", color: "text-orange-500" },
                             { icon: "handshake", label: "الصفقات", href: "/deals", color: "text-purple-500" },
                             { icon: "local_shipping", label: "النقل", href: "/transport/book", color: "text-yellow-500" },
                             { icon: "report", label: "بلاغ جديد", href: "/stolen-reports/new", color: "text-red-500" },
                             { icon: "leaderboard", label: "بيانات السوق", href: "/market", color: "text-teal-500" },
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
                    )}

                    {/* DRIVER VIEW QUICK ACTIONS */}
                    {activeRole === "DRIVER" && (
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { icon: "route", label: "طلبات النقل", href: "/driver/bookings", color: "text-blue-400" },
                                { icon: "history", label: "سجل التوصيل", href: "/driver/history", color: "text-slate-400" },
                                { icon: "local_shipping", label: "الأحمال المتاحة", href: "/transport/driver/loads", color: "text-emerald-400" },
                                { icon: "support_agent", label: "الدعم", href: "/support/tickets", color: "text-sky-400" },
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
                    )}

                    {/* GOVERNMENT VIEW QUICK ACTIONS */}
                    {activeRole === "GOVERNMENT" && (
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { icon: "gavel", label: "الرقابة", href: "/gov/monitoring", color: "text-amber-500" },
                                { icon: "report_problem", label: "بلاغاتنا", href: "/gov/reports", color: "text-orange-500" },
                                { icon: "verified", label: "تصاريح", href: "/gov/permits", color: "text-primary" },
                                { icon: "security", label: "الأمن", href: "/gov/security", color: "text-blue-500" },
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
                    )}
                </div>

                {(canManageContent || canManageAccess) && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-white">أدوات الإدارة الأكاديمية</h2>
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                                وصول مصرح
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                ...(canManageContent || isAdmin
                                    ? [
                                  { icon: "shield", label: "مركز السلامة", href: "/safety", color: "text-amber-400" },
                                  { icon: "assignment", label: "بلاغات السلامة", href: "/admin/safety/incidents", color: "text-red-400" },
                                  { icon: "school", label: "إدارة الدورات", href: "/admin/safety/trainings", color: "text-emerald-400" },
                                  { icon: "fact_check", label: "تقييمات الجاهزية", href: "/admin/safety/checklists", color: "text-amber-400" },
                                  { icon: "library_books", label: "لوحة المحتوى", href: "/admin/knowledge", color: "text-emerald-400" },
                                          { icon: "school", label: "الأكاديمية", href: "/academy", color: "text-sky-400" },
                                      ]
                                    : []),
                                ...(canManageAccess || isAdmin
                                    ? [
                                          { icon: "admin_panel_settings", label: "إدارة الأدوار", href: "/admin/access", color: "text-blue-400" },
                                      ]
                                    : []),
                            ].map((action, i) => (
                                <Link
                                    key={i}
                                    href={action.href}
                                    className="flex flex-col items-center gap-2 p-3 bg-surface-highlight rounded-xl border border-slate-700/50 hover:border-emerald-400/60 transition group"
                                >
                                    <span className={`material-symbols-outlined !text-[26px] ${action.color} group-hover:scale-110 transition`}>
                                        {action.icon}
                                    </span>
                                    <span className="text-[10px] text-slate-400 text-center leading-tight">{action.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {(activeRole as string) !== "ADMIN" && activeRole !== "DRIVER" && activeAuctions.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-white">المزادات النشطة</h2>
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
                                        <div className="text-right">
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

                {(activeRole as string) !== "ADMIN" && activeRole !== "DRIVER" && recentDeals.length > 0 && (
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
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 font-english">#{deal.id}</p>
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

                {(activeRole as string) !== "ADMIN" && activeRole !== "DRIVER" && activeAuctions.length === 0 && recentDeals.length === 0 && (
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

            {activeRole === "DRIVER" && (
                <div className="px-4 pb-6">
                    <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-bold text-white">ملخص السائق</h3>
                                <p className="text-xs text-slate-500">آخر تحديث مباشر</p>
                            </div>
                            {driverLoading && (
                                <span className="text-xs text-slate-500">جاري التحديث...</span>
                            )}
                        </div>
                        {driverProfile ? (
                            <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                                <div className="bg-surface-dark rounded-xl p-3 border border-slate-800">
                                    <p className="text-[10px] text-slate-500 mb-1">السائق</p>
                                    <p className="text-white font-bold text-sm">{driverProfile.fullName}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">{driverProfile.city || "غير محدد"}</p>
                                </div>
                                <div className="bg-surface-dark rounded-xl p-3 border border-slate-800">
                                    <p className="text-[10px] text-slate-500 mb-1">الحالة</p>
                                    <p className="text-white font-bold text-sm">{driverProfile.status}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">{driverProfile.ratingCount} تقييم</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400">
                                لم يتم العثور على ملف سائق مرتبط بالحساب.
                            </div>
                        )}
                    </div>
                </div>
            )}

            <BottomNavigation />
        </>
    );
}
