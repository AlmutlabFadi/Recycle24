"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const getTabs = (role: string | null) => {
    const baseTabs = [
        { href: "/profile", label: "حسابي", icon: "person" },
        { href: "/offers", label: "طلباتي", icon: "list_alt" },
        { href: "/sell", label: "", icon: "add", isCenter: true },
        { href: "/market", label: "السوق", icon: "analytics" },
        { href: "/", label: "الرئيسية", icon: "home" },
    ];

    if (role === "ADMIN") {
        return [
            { href: "/profile", label: "حسابي", icon: "person" },
            { href: "/admin/support", label: "الدعم", icon: "support_agent" },
            { href: "/admin/dashboard", label: "", icon: "rocket_launch", isCenter: true },
            { href: "/admin/marketplace", label: "المراقبة", icon: "monitoring" },
            { href: "/admin/dashboard", label: "الرئيسية", icon: "home" },
        ];
    }

    if (role === "TRADER") {
        return [
            { href: "/profile", label: "حسابي", icon: "person" },
            { href: "/wallet", label: "المحفظة", icon: "account_balance_wallet" },
            { href: "/auctions/create", label: "", icon: "add", isCenter: true },
            { href: "/market", label: "الأسعار", icon: "trending_up" },
            { href: "/dashboard", label: "الرئيسية", icon: "home" },
        ];
    }

    return baseTabs;
};

export default function BottomNavigation({ loading = false, error = null }: { loading?: boolean; error?: string | null }) {
    const pathname = usePathname();
    const { activeRole } = useAuth();

    const [data, setData] = useState(() => getTabs(activeRole));

    useEffect(() => {
        setData(getTabs(activeRole));
    }, [activeRole]);

    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                setData(getTabs(activeRole));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading, activeRole]);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111a22] border-t border-slate-800 pb-safe">
            <div className="max-w-md mx-auto flex items-center justify-around h-16">
                {error && (
                    <div className="flex items-center justify-center w-full h-full">
                        <p className="text-white">حدث خطأ أثناء تحميل البيانات</p>
                    </div>
                )}
                {loading && (
                    <div className="flex items-center justify-center w-full h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}
                {!error && !loading && data.length === 0 && (
                    <div className="flex items-center justify-center w-full h-full">
                        <p className="text-white">لا توجد بيانات</p>
                    </div>
                )}
                {!error && !loading && data.length > 0 && (
                    <div className="grid grid-cols-5 gap-2">
                        {data.map((tab) => {
                            const isActive = pathname === tab.href;
                            const uniqueKey = `${tab.href}-${tab.icon}`;

                            if (tab.isCenter) {
                                return (
                                    <div key={uniqueKey} className="relative -top-5">
                                        <Link
                                            href={tab.href}
                                            className="flex items-center justify-center size-14 rounded-full bg-secondary text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition hover:scale-105 active:scale-95"
                                            aria-label={tab.label}
                                        >
                                            <span className="material-symbols-outlined !text-[28px]">
                                                {tab.icon}
                                            </span>
                                        </Link>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={uniqueKey}
                                    href={tab.href}
                                    className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                                        isActive ? "text-primary" : "text-slate-500 hover:text-slate-300"
                                    }`}
                                    aria-label={tab.label}
                                >
                                    <span className="material-symbols-outlined !text-[24px]">
                                        {tab.icon}
                                    </span>
                                    <span className={`text-[10px] mt-1 ${isActive ? "font-bold" : "font-medium"}`}>
                                        {tab.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </nav>
    );
}