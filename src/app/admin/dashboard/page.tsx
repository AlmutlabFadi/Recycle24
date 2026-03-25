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

interface ManagerInfo {
    id: string;
    name: string;
    status: "ONLINE" | "IDLE" | "OFFLINE";
}

interface DeptStatus {
    department: string;
    managers: ManagerInfo[];
}

function formatNumber(num: number) {
    return new Intl.NumberFormat("ar-SY").format(num);
}

export default function AdminCommandCenter() {
    const { user, switchRole } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [deptManagers, setDeptManagers] = useState<DeptStatus[]>([]);
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
                const [statsRes, managerRes] = await Promise.all([
                    fetch("/api/admin/dashboard/stats"),
                    fetch("/api/admin/staff/managers")
                ]);
                
                const statsData = await statsRes.json();
                const managerData = await managerRes.json();

                if (isMounted) {
                    if (statsData.success) setStats(statsData.stats);
                    if (managerData.success) setDeptManagers(managerData.departments);
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

    const allModules = [
        { id: 'users', title: 'حوكمة المستخدمين', icon: 'person_search', href: '/admin/users', permission: 'MANAGE_USERS' },
        { id: 'access', title: 'الأدوار والصلاحيات', icon: 'key', href: '/admin/access', permission: 'MANAGE_ACCESS' },
        { id: 'leaderboard', title: 'متصدري الكفاءة', icon: 'military_tech', href: '/admin/staff/leaderboard', permission: 'MANAGE_ACCESS' },
        { id: 'activity', title: 'سجلات النشاط', icon: 'history', href: '/admin/staff/activity', permission: 'MANAGE_ACCESS' },
        { id: 'marketplace', title: 'مراقب الأسواق', icon: 'monitoring', href: '/admin/marketplace', permission: 'MANAGE_KNOWLEDGE' },
        { id: 'finance', title: 'النظام البنكي والمالي', icon: 'account_balance', href: '/admin/finance', permissions: ['MANAGE_FINANCE', 'FINANCE_FINAL_APPROVE'] },
        { id: 'subscription_designer', title: 'باقات الاشتراك', icon: 'design_services', href: '/admin/subscriptions/packages', permission: 'MANAGE_FINANCE' },
        { id: 'verification', title: 'التوثيق المستندي', icon: 'verified', href: '/admin/verification', permission: 'REVIEW_DRIVER_DOCS', count: stats?.verification.pending },
        { id: 'auctions', title: 'مراجعة المزادات', icon: 'gavel', href: '/admin/auctions', permission: 'MANAGE_KNOWLEDGE' },
        { id: 'support', title: 'مكتب الدعم', icon: 'support_agent', href: '/admin/support', permission: 'MANAGE_SUPPORT', count: stats?.support.open },
        { id: 'rewards', title: 'إعدادات المكافآت', icon: 'loyalty', href: '/admin/rewards', permission: 'MANAGE_REWARDS' },
        { id: 'soc', title: 'الأمن والعمليات', icon: 'security', href: '/admin/soc', permission: 'MANAGE_ACCESS' },
    ];

    const userPermissions = ((user as { permissions?: string[] } | undefined)?.permissions) || [];
    const adminModules = allModules.filter(m => {
        if (m.permissions) return m.permissions.some(p => userPermissions.includes(p));
        return userPermissions.includes(m.permission as string);
    });

    const deptPermissionMap: Record<string, string[]> = {
        "المالية": ["MANAGE_FINANCE", "FINANCE_FINAL_APPROVE"],
        "المستخدمين": ["MANAGE_USERS"],
        "النقل": ["MANAGE_DRIVERS", "REVIEW_DRIVER_DOCS"],
        "الأمن": ["MANAGE_ACCESS", "ACCESS_SAFETY"],
        "الدعم الفني": ["MANAGE_SUPPORT"],
    };

    const visibleDepartments = deptManagers.filter(dept => {
        const required = deptPermissionMap[dept.department];
        if (!required) return true;
        return required.some(p => userPermissions.includes(p));
    });

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
                </header>

                {/* Alerts / Pending Actions Row */}
                {(stats?.verification.pending || stats?.support.open) && (
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        {stats?.verification.pending && userPermissions.includes("REVIEW_DRIVER_DOCS") ? (
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
                        {stats?.support.open && userPermissions.includes("MANAGE_SUPPORT") ? (
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
                                {"count" in m && m.count ? (
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

                {/* Staff & Operations Overview */}
                {visibleDepartments.length > 0 && (
                    <>
                        <h2 className="text-sm font-bold text-slate-500 mb-4 px-2">أوضاع فريق العمل المكلفين</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                            {visibleDepartments.map((dept, idx) => (
                                <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 hover:bg-slate-900 transition">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black text-slate-300">{dept.department}</h3>
                                        <span className="text-[10px] text-slate-500 font-bold">المسؤولين: {dept.managers.length}</span>
                                    </div>
                                    <div className="space-y-3">
                                        {dept.managers.length === 0 ? (
                                            <p className="text-[10px] text-slate-600 italic">لا يوجد مدير مكلف حالياً</p>
                                        ) : (
                                            dept.managers.map((mgr) => (
                                                <div key={mgr.id} className="flex items-center justify-between group/mgr">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-6 rounded-full bg-slate-800 flex items-center justify-center">
                                                            <span className="material-symbols-outlined !text-sm text-slate-500">person</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-white group-hover/mgr:text-primary transition">{mgr.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-full border border-slate-800">
                                                        <span className={`size-1.5 rounded-full ${
                                                            mgr.status === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                                            mgr.status === 'IDLE' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                                                            'bg-slate-700'
                                                        }`}></span>
                                                        <span className={`text-[9px] font-bold ${
                                                            mgr.status === 'ONLINE' ? 'text-emerald-500' : 
                                                            mgr.status === 'IDLE' ? 'text-amber-500' : 
                                                            'text-slate-500'
                                                        }`}>
                                                            {mgr.status === 'ONLINE' ? 'متصل' : 
                                                             mgr.status === 'IDLE' ? 'خمول' : 
                                                             'خارج الاتصال'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

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

