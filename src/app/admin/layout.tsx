"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
    id: string;
    label: string;
    icon: string;
    href: string;
    badge?: number;
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
        { id: "users", label: "المستخدمين", icon: "group", href: "/admin/users" },
        { id: "verification", label: "التوثيق", icon: "verified_user", href: "/admin/verification", badge: stats?.verification?.pending },
        { id: "finance", label: "المالية", icon: "account_balance", href: "/admin/finance" },
        { id: "marketplace", label: "الأسواق", icon: "storefront", href: "/admin/marketplace" },
        { id: "deals", label: "الصفقات", icon: "handshake", href: "/admin/deals" },
        { id: "subscriptions", label: "الاشتراكات", icon: "card_membership", href: "/admin/subscriptions" },
        { id: "support", label: "الدعم الفني", icon: "support_agent", href: "/admin/support", badge: stats?.support?.open },
        { id: "rewards", label: "المكافآت", icon: "loyalty", href: "/admin/rewards" },
        { id: "soc", label: "الأمن", icon: "security", href: "/admin/soc" },
        { id: "safety", label: "السلامة", icon: "health_and_safety", href: "/admin/safety/incidents" },
        { id: "access", label: "الصلاحيات", icon: "admin_panel_settings", href: "/admin/access" },
    ];

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
                    {navItems.map((item) => {
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
                    {children}
                </main>
            </div>
        </div>
    );
}
