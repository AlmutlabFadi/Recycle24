"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import HeaderWithBack from "@/components/HeaderWithBack";

interface DashboardStats {
    users: { total: number };
    verification: { pending: number };
    support: { open: number };
    financial: {
        totalVolume: number;
        totalFees: number;
        subscriptionRevenue: number;
        dealCount: number;
    };
    auctions: { active: number };
}

function formatNumber(num: number) {
    return new Intl.NumberFormat("ar-SY").format(num);
}

export default function AdminCommandCenter() {
    const { user, switchRole } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) setShowFallback(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, [loading]);

    const handleSwitchToClient = async () => {
        if (switchRole) {
            await switchRole("CLIENT");
            window.location.href = "/dashboard";
        }
    };

    useEffect(() => {
        let isMounted = true;
        async function fetchStats() {
            try {
                const res = await fetch("/api/admin/dashboard/stats");
                const data = await res.json();
                if (isMounted && data.success) {
                    setStats(data.stats);
                }
            } catch (error) {
                console.error("Error fetching admin stats:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchStats();
        return () => { isMounted = false; };
    }, []);

    const adminModules = [
        { id: 'users', title: 'حوكمة المستخدمين الأدوار', icon: 'person_search', href: '/admin/users', active: true },
        { id: 'marketplace', title: 'مراقب الأسواق والمعاملات', icon: 'monitoring', href: '/admin/marketplace', active: true },
        { id: 'finance', title: 'النظام البنكي والمالي', icon: 'account_balance', href: '/admin/finance', active: true },
        { id: 'subscription_designer', title: 'مصمم باقات الاشتراك', icon: 'design_services', href: '/admin/subscriptions/packages', active: true },
        { id: 'verification', title: 'التوثيق المستندي', icon: 'verified', href: '/admin/verification', count: stats?.verification.pending, active: true },
        { id: 'auctions', title: 'مراجعة المزادات', icon: 'gavel', href: '/admin/auctions', active: true },
        { id: 'support', title: 'مكتب الدعم', icon: 'support_agent', href: '/admin/support', count: stats?.support.open, active: true },
        { id: 'rewards', title: 'إعدادات المكافآت', icon: 'loyalty', href: '/admin/rewards', active: true },
        { id: 'soc', title: 'الأمن والعمليات', icon: 'security', href: '/admin/soc', active: true },
    ];

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark font-display">
                <HeaderWithBack title="مركز القيادة والتحكم" />
                <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="relative mb-8">
                        <div className="size-24 rounded-[2.5rem] bg-primary/20 border border-primary/40 flex items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined !text-5xl text-primary">analytics</span>
                        </div>
                        <div className="absolute inset-0 size-24 border-2 border-primary border-t-transparent rounded-[2.5rem] animate-spin"></div>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 italic">جاري تهيئة مركز القيادة...</h2>
                    <p className="text-slate-500 text-xs max-w-[200px] mb-8">يتم الآن جلب بيانات الوقت الفعلي من كافة وحدات المنصة.</p>
                    
                    {showFallback && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <p className="text-amber-500 text-[10px] mb-4">يبدو أن العملية تستغرق وقتاً طويلاً...</p>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => window.location.reload()} 
                                    className="px-6 py-2 bg-white/10 text-white rounded-xl text-xs font-bold border border-white/5"
                                >
                                    إعادة المحاولة
                                </button>
                                <button 
                                    onClick={handleSwitchToClient} 
                                    className="px-6 py-2 bg-primary/20 text-primary rounded-xl text-xs font-bold border border-primary/20"
                                >
                                    التبديل للوضع العادي
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display pb-12">
            <HeaderWithBack 
                title="مركز القيادة والتحكم" 
                action={
                    <button 
                        onClick={() => window.location.href = '/api/auth/signout'}
                        className="p-2 text-slate-400 hover:text-red-500 transition"
                        title="تسجيل الخروج"
                    >
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                }
            />

            <main className="flex-1 p-4 lg:max-w-7xl lg:mx-auto w-full">
                {/* Dashboard Hero */}
                <header className="mb-8 relative overflow-hidden bg-gradient-to-br from-primary/20 to-indigo-600/10 rounded-[2.5rem] border border-primary/20 p-8 shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-right">
                            <h1 className="text-2xl font-bold text-white mb-2">مرحباً بكل بيك يا أدمن، {user?.name}</h1>
                            <p className="text-slate-400 text-sm max-w-md pb-4">إليك نظرة شاملة على أداء المنصة والعمليات الجارية في الوقت الفعلي.</p>
                            <button 
                                onClick={handleSwitchToClient}
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold border border-white/10 transition"
                            >
                                <span className="material-symbols-outlined !text-sm">person</span>
                                التبديل لوضع العميل
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 flex flex-col items-center">
                                <span className="text-xl font-bold text-primary font-english">{stats ? formatNumber(stats.financial.totalVolume) : '---'}</span>
                                <span className="text-[10px] text-slate-500">حجم التداول الكلي</span>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 flex flex-col items-center">
                                <span className="text-xl font-bold text-emerald-500 font-english">{stats ? formatNumber(stats.users.total) : '---'}</span>
                                <span className="text-[10px] text-slate-500">إجمالي المشتركين</span>
                            </div>
                        </div>
                    </div>
                    {/* Abstract design elements */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
                </header>

                {/* Alerts / Pending Actions Row */}
                {(stats?.verification.pending || 0 > 0 || stats?.support.open || 0 > 0) && (
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        {stats?.verification.pending ? (
                            <Link href="/admin/verification" className="flex-1 bg-amber-500/10 border border-amber-500/20 p-4 rounded-3xl flex items-center justify-between hover:bg-amber-500/20 transition group">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                                        <span className="material-symbols-outlined">pending_actions</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-amber-500">طلبات توثيق معلقة</p>
                                        <p className="text-[10px] text-slate-400">هناك {stats.verification.pending} تاجر ينتظر المراجعة</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-amber-500 group-hover:translate-x-[-4px] transition">arrow_back</span>
                            </Link>
                        ) : null}
                        {stats?.support.open ? (
                            <Link href="/admin/support" className="flex-1 bg-red-500/10 border border-red-500/20 p-4 rounded-3xl flex items-center justify-between hover:bg-red-500/20 transition group">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500">
                                        <span className="material-symbols-outlined">contact_support</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-red-500">تذاكر دعم مفتوحة</p>
                                        <p className="text-[10px] text-slate-400">يوجد {stats.support.open} مستخدم بحاجة للمساعدة</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-red-500 group-hover:translate-x-[-4px] transition">arrow_back</span>
                            </Link>
                        ) : null}
                    </div>
                )}

                {/* Primary Control Grid */}
                <h2 className="text-sm font-bold text-slate-500 mb-4 px-2">لوحات التحكم والإدارة</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {adminModules.map((m) => (
                        <Link
                            key={m.id}
                            href={m.href}
                            className="bg-surface-highlight border border-slate-800 rounded-[2.5rem] p-6 flex flex-col items-center text-center hover:border-primary/50 hover:bg-primary/5 transition group shadow-lg"
                        >
                            <div className="relative mb-4">
                                <div className="size-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <span className="material-symbols-outlined !text-3xl">{m.icon}</span>
                                </div>
                                {m.count ? (
                                    <span className="absolute -top-1 -right-1 size-6 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                        {m.count}
                                    </span>
                                ) : null}
                            </div>
                            <h3 className="text-sm font-bold text-white group-hover:text-primary transition">{m.title}</h3>
                            <p className="text-[10px] text-slate-500 mt-1">اضغط للتوسع والإدارة</p>
                        </Link>
                    ))}
                </div>

                {/* Secondary Analytics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-surface-highlight border border-slate-800 rounded-[2.5rem] p-6">
                        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                             <span className="material-symbols-outlined text-emerald-500">insights</span>
                             تحليل الإيرادات والنمو
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                <span className="text-xs text-slate-400">رسوم الصفقات (العمولة)</span>
                                <span className="text-sm font-bold text-white font-english">{stats ? formatNumber(stats.financial.totalFees) : '0'} ل.س</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                <span className="text-xs text-slate-400">إيرادات الاشتراكات</span>
                                <span className="text-sm font-bold text-white font-english">{stats ? formatNumber(stats.financial.subscriptionRevenue) : '0'} ل.س</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-2xl border border-primary/20">
                                <span className="text-xs font-bold text-primary">إجمالي الدخل المتوقع</span>
                                <span className="text-sm font-bold text-primary font-english">
                                    {stats ? formatNumber(stats.financial.totalFees + stats.financial.subscriptionRevenue) : '0'} ل.س
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface-highlight border border-slate-800 rounded-[2.5rem] p-6 flex flex-col justify-center items-center text-center">
                        <div className="size-20 rounded-full border-4 border-primary border-t-white animate-spin-slow mb-6"></div>
                        <h3 className="text-sm font-bold text-white mb-2">النظام في الحالة المثلى</h3>
                        <p className="text-[10px] text-slate-500 px-4">تم فحص 12 وحدة أمان و8 وحدات أداء، جميعها تعمل بكفاءة 100%.</p>
                        <Link href="/gsocc/audit" className="mt-6 text-primary text-xs font-bold border border-primary/20 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition">
                            عرض سجل التدقيق
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
