"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import StaffActivityHeartbeat from "@/components/admin/StaffActivityHeartbeat";

interface NavItem {
    id: string;
    label: string;
    icon: string;
    href: string;
    badge?: number;
    permission?: string;
    children?: { label: string; href: string }[];
}

function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
    const pathname = usePathname();
    const { user, switchRole } = useAuth();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetch("/api/admin/dashboard/stats")
            .then(r => r.json())
            .then(d => { if (d.success) setStats(d.stats); })
            .catch(() => {});
    }, []);

    const navItems: NavItem[] = [
        { id: "dashboard", label: "لوحة القيادة", icon: "dashboard", href: "/admin/dashboard" },
        { id: "control", label: "برج المراقبة", icon: "cell_tower", href: "/admin/control" },
        { id: "users", label: "المستخدمين", icon: "group", href: "/admin/users", permission: "MANAGE_USERS" },
        { id: "verification", label: "التوثيق", icon: "verified_user", href: "/admin/verification", badge: stats?.verification?.pending, permission: "MANAGE_USERS" },
        { id: "finance", label: "المالية", icon: "account_balance", href: "/admin/finance", permission: "MANAGE_FINANCE" },
        { id: "transport", label: "إدارة النقل", icon: "local_shipping", href: "/admin/transport", permission: "MANAGE_DRIVERS" },
        { id: "marketplace", label: "الأسواق", icon: "storefront", href: "/admin/marketplace", permission: "MANAGE_KNOWLEDGE" },
        { id: "deals", label: "الصفقات", icon: "handshake", href: "/admin/deals", permission: "MANAGE_FINANCE" },
        { id: "subscriptions", label: "الاشتراكات", icon: "card_membership", href: "/admin/subscriptions", permission: "MANAGE_FINANCE" },
        { id: "support", label: "الدعم الفني", icon: "support_agent", href: "/admin/support", badge: stats?.support?.open, permission: "MANAGE_SUPPORT" },
        { id: "rewards", label: "المكافآت", icon: "loyalty", href: "/admin/rewards", permission: "MANAGE_REWARDS" },
        { id: "soc", label: "الأمن", icon: "security", href: "/admin/soc", permission: "MANAGE_ACCESS" },
        { id: "safety", label: "السلامة", icon: "health_and_safety", href: "/admin/safety/incidents", permission: "ACCESS_SAFETY" },
        { id: "access", label: "الصلاحيات", icon: "admin_panel_settings", href: "/admin/access", permission: "MANAGE_ACCESS" },
    ];

    const filteredNavItems = navItems.filter(item => {
        if (!item.permission) return true;
        return user?.permissions?.includes(item.permission);
    });

    const handleSwitchToClient = async () => {
        if (switchRole) {
            await switchRole("CLIENT");
            window.location.href = "/dashboard";
        }
    };

    return (
        <>
            {/* Mobile overlay */}
            {!collapsed && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onToggle}
                />
            )}

            <aside className={`
                fixed top-0 right-0 h-full z-50
                bg-[#0a0e1a] border-l border-slate-800/60
                flex flex-col
                transition-all duration-300 ease-in-out
                ${collapsed ? "-translate-x-full lg:translate-x-0 lg:w-[72px]" : "w-[260px] translate-x-0"}
            `}>
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/60">
                    {!collapsed && (
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined !text-lg text-white">cell_tower</span>
                            </div>
                            <div>
                                <h1 className="text-sm font-black text-white leading-tight">Recycle24</h1>
                                <p className="text-[9px] text-primary font-bold tracking-wider">CONTROL TOWER</p>
                            </div>
                        </div>
                    )}
                    {collapsed && (
                        <div className="mx-auto size-8 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                            <span className="material-symbols-outlined !text-lg text-white">cell_tower</span>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className={`px-3 py-3 border-b border-slate-800/40 ${collapsed ? "flex justify-center" : ""}`}>
                    {!collapsed ? (
                        <div className="flex items-center gap-2.5 bg-white/[0.03] rounded-xl px-3 py-2">
                            <div className="size-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold border border-slate-700">
                                {user?.name?.charAt(0) || "A"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{user?.name || "المشرف"}</p>
                                <p className="text-[10px] text-slate-500 truncate">{user?.email || "admin"}</p>
                            </div>
                            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" title="متصل"></div>
                        </div>
                    ) : (
                        <div className="size-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold border border-slate-700">
                            {user?.name?.charAt(0) || "A"}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                title={collapsed ? item.label : undefined}
                                className={`
                                    group flex items-center gap-2.5 rounded-xl transition-all duration-200
                                    ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
                                    ${isActive
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                                    }
                                `}
                            >
                                <span className={`material-symbols-outlined !text-[20px] ${isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-300"} transition`}>
                                    {item.icon}
                                </span>
                                {!collapsed && (
                                    <>
                                        <span className="text-[13px] font-medium flex-1">{item.label}</span>
                                        {item.badge && item.badge > 0 && (
                                            <span className="min-w-[20px] h-5 px-1.5 rounded-md bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                                {item.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                                {collapsed && item.badge && item.badge > 0 && (
                                    <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500"></span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="border-t border-slate-800/60 p-2 space-y-1">
                    <button
                        onClick={handleSwitchToClient}
                        title="التبديل لوضع العميل"
                        className={`w-full flex items-center gap-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.04] transition ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`}
                    >
                        <span className="material-symbols-outlined !text-[20px]">swap_horiz</span>
                        {!collapsed && <span className="text-[13px] font-medium">وضع العميل</span>}
                    </button>
                    <button
                        onClick={() => window.location.href = "/api/auth/signout"}
                        title="تسجيل الخروج"
                        className={`w-full flex items-center gap-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`}
                    >
                        <span className="material-symbols-outlined !text-[20px]">logout</span>
                        {!collapsed && <span className="text-[13px] font-medium">تسجيل الخروج</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // collapsed on mobile by default
    const pathname = usePathname();

    // Get page title from pathname
    const pageTitles: Record<string, string> = {
        "/admin/dashboard": "لوحة القيادة والتحكم",
        "/admin/control": "برج المراقبة",
        "/admin/users": "إدارة المستخدمين",
        "/admin/verification": "إدارة التوثيق والتحقق",
        "/admin/finance": "النظام البنكي والمالي",
        "/admin/transport": "إدارة النقل والسائقين",
        "/admin/marketplace": "مراقب الأسواق",
        "/admin/deals": "إدارة الصفقات",
        "/admin/subscriptions": "إدارة الاشتراكات",
        "/admin/subscriptions/packages": "مصمم الباقات",
        "/admin/support": "مكتب الدعم الفني",
        "/admin/rewards": "إعدادات المكافآت",
        "/admin/soc": "مركز العمليات الأمنية",
        "/admin/soc/report": "تقرير أمني",
        "/admin/safety/incidents": "حوادث السلامة",
        "/admin/safety/checklists": "قوائم الفحص",
        "/admin/safety/trainings": "التدريبات",
        "/admin/access": "إدارة الصلاحيات",
        "/admin/knowledge": "قاعدة المعرفة",
    };

    const currentTitle = pageTitles[pathname || ""] || "لوحة الإدارة";

    return (
        <div className="min-h-screen bg-[#060a14] font-display" dir="rtl">
            <StaffActivityHeartbeat />
            {/* Sidebar */}
            <AdminSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content Area */}
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:mr-[72px]" : "lg:mr-[260px]"}`}>
                {/* Top Header */}
                <header className="sticky top-0 z-30 h-14 bg-[#060a14]/80 backdrop-blur-xl border-b border-slate-800/40 flex items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center gap-3">
                        {/* Hamburger / Collapse Toggle */}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                        >
                            <span className="material-symbols-outlined !text-xl">
                                {sidebarCollapsed ? "menu" : "menu_open"}
                            </span>
                        </button>
                        <h2 className="text-sm font-bold text-white">{currentTitle}</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Break Toggle Button */}
                        <button
                            onClick={() => {
                                const isOnBreak = document.querySelector('[data-staff-break]')?.getAttribute('data-staff-break') === 'true';
                                window.dispatchEvent(new CustomEvent('staff-break-toggle', {
                                    detail: { action: isOnBreak ? 'end' : 'start' }
                                }));
                                const btn = document.querySelector('[data-staff-break]');
                                if (btn) btn.setAttribute('data-staff-break', String(!isOnBreak));
                            }}
                            data-staff-break="false"
                            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
                            title="أخذ استراحة / العودة من الاستراحة"
                        >
                            <span className="material-symbols-outlined !text-[14px]">coffee</span>
                            استراحة
                        </button>

                        {/* System Status Indicator */}
                        <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-500/20">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            النظام يعمل
                        </div>
                        {/* Time */}
                        <div className="text-[10px] text-slate-500 font-english hidden md:block">
                            {new Date().toLocaleDateString("ar-SY", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    <PermissionGuard pathname={pathname}>
                        {children}
                    </PermissionGuard>
                </main>
            </div>
        </div>
    );
}
function PermissionGuard({ children, pathname }: { children: React.ReactNode; pathname: string | null }) {
    const { user, isLoading } = useAuth();
    
    if (isLoading) return <div className="flex items-center justify-center p-20 animate-pulse text-slate-500 font-bold">جاري التحقق من الصلاحيات...</div>;

    const routePermissions: Record<string, string> = {
        "/admin/users": "MANAGE_USERS",
        "/admin/verification": "MANAGE_USERS",
        "/admin/finance": "MANAGE_FINANCE",
        "/admin/transport": "MANAGE_DRIVERS",
        "/admin/marketplace": "MANAGE_KNOWLEDGE",
        "/admin/deals": "MANAGE_FINANCE",
        "/admin/subscriptions": "MANAGE_FINANCE",
        "/admin/support": "MANAGE_SUPPORT",
        "/admin/rewards": "MANAGE_REWARDS",
        "/admin/soc": "MANAGE_ACCESS",
        "/admin/safety": "ACCESS_SAFETY",
        "/admin/access": "MANAGE_ACCESS",
    };

    const requiredPermission = Object.entries(routePermissions).find(([route]) => pathname?.startsWith(route))?.[1];

    // Check for Master Admin Access Toggle
    if (user && user.adminAccessEnabled === false) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="size-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined !text-4xl text-amber-500">hail</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-2">الوصول مقيد حالياً</h2>
                <p className="text-slate-400 max-w-sm font-bold text-lg mb-4">
                    يجب مراجعة مدير المشروع
                </p>
                <p className="text-slate-500 text-sm max-w-xs">
                    تم تعليق وصولك للوحة الإدارة من قبل المشرف. يرجى مراجعة المسؤول المباشر خارج أوقات العمل الرسمية.
                </p>
                <div className="mt-8 flex gap-4">
                    <Link href="/dashboard" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold transition">
                        الذهاب للملف الشخصي
                    </Link>
                    <button 
                        onClick={() => window.location.href = "/api/auth/signout"}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold transition"
                    >
                        تسجيل الخروج
                    </button>
                </div>
            </div>
        );
    }

    if (requiredPermission && !user?.permissions?.includes(requiredPermission)) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined !text-4xl text-red-500">lock</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-2">عذراً، الوصول مرفوض</h2>
                <p className="text-slate-400 max-w-sm font-bold">ليس لديك الصلاحيات الكافية للوصول إلى هذا القسم. إذا كنت تعتقد أن هذا خطأ، يرجى مراجعة المسؤول.</p>
                <Link href="/admin/dashboard" className="mt-8 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold transition">
                    العودة للرئيسية
                </Link>
            </div>
        );
    }

    return <>{children}</>;
}
