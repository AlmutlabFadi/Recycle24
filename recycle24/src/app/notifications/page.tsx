"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

const notifications = [
    {
        id: 1,
        type: "bid",
        title: "مزايدة جديدة",
        message: "قام تاجر ٨٤٣ بالمزايدة على مزاد #402 بمبلغ 45,200,000 ل.س",
        time: "منذ 5 دقائق",
        read: false,
        link: "/auctions/402",
        icon: "gavel",
        color: "text-primary",
        bg: "bg-primary/20",
    },
    {
        id: 2,
        type: "deal",
        title: "تم إتمام الصفقة",
        message: "تم بنجاح إتمام صفقة بيع النحاس الأحمر مع ساحة النور",
        time: "منذ 30 دقيقة",
        read: false,
        link: "/deals/DEAL-7782",
        icon: "check_circle",
        color: "text-green-400",
        bg: "bg-green-400/20",
    },
    {
        id: 3,
        type: "payment",
        title: "إيداع ناجح",
        message: "تم إضافة مبلغ 250,000 ل.س إلى محفظتك",
        time: "منذ ساعة",
        read: true,
        link: "/wallet/transactions",
        icon: "payments",
        color: "text-blue-400",
        bg: "bg-blue-400/20",
    },
    {
        id: 4,
        type: "system",
        title: "تحديث النظام",
        message: "تم إضافة ميزة جديدة: تقارير الأداء المالي الشهرية",
        time: "منذ 3 ساعات",
        read: true,
        link: "/dashboard",
        icon: "update",
        color: "text-purple-400",
        bg: "bg-purple-400/20",
    },
    {
        id: 5,
        type: "alert",
        title: "تنبيه سعر",
        message: "ارتفع سعر النحاس بنسبة 2.5% في منطقتك",
        time: "منذ 5 ساعات",
        read: true,
        link: "/market/alerts",
        icon: "trending_up",
        color: "text-orange-400",
        bg: "bg-orange-400/20",
    },
];

const filters = [
    { id: "all", label: "الكل", count: 5 },
    { id: "unread", label: "غير مقروء", count: 2 },
    { id: "bid", label: "المزادات", count: 1 },
    { id: "deal", label: "الصفقات", count: 1 },
    { id: "payment", label: "المدفوعات", count: 1 },
];

export default function NotificationsPage() {
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [notifs, setNotifs] = useState(notifications);

    const filteredNotifications = activeFilter === "all"
        ? notifs
        : activeFilter === "unread"
        ? notifs.filter(n => !n.read)
        : notifs.filter(n => n.type === activeFilter);

    const unreadCount = notifs.filter(n => !n.read).length;

    const markAllAsRead = () => {
        setNotifs(notifs.map(n => ({ ...n, read: true })));
    };

    const markAsRead = (id: number) => {
        setNotifs(notifs.map(n => n.id === id ? { ...n, read: true } : n));
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="الإشعارات" />

            {/* Header Stats */}
            <div className="px-4 py-4 bg-surface-dark border-b border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="text-slate-400">إشعارات غير مقروءة</span>
                        <div className="text-2xl font-bold text-white">{unreadCount}</div>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-primary hover:underline"
                        >
                            تحديد الكل كمقروء
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                activeFilter === filter.id
                                    ? "bg-primary text-white"
                                    : "bg-surface-highlight text-slate-300 border border-slate-700"
                            }`}
                        >
                            {filter.label}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                activeFilter === filter.id
                                    ? "bg-white/20"
                                    : "bg-slate-700"
                            }`}>
                                {filter.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications List */}
            <main className="flex-1 px-4 py-4 pb-24">
                <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                        <Link
                            key={notification.id}
                            href={notification.link}
                            onClick={() => markAsRead(notification.id)}
                            className={`block bg-surface-highlight rounded-xl p-4 border ${
                                notification.read
                                    ? "border-slate-700"
                                    : "border-primary/50 bg-primary/5"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full ${notification.bg} flex items-center justify-center shrink-0`}>
                                    <span className={`material-symbols-outlined ${notification.color}`}>
                                        {notification.icon}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-white">{notification.title}</h3>
                                        {!notification.read && (
                                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 mb-2">{notification.message}</p>
                                    <span className="text-xs text-slate-500">{notification.time}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {filteredNotifications.length === 0 && (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">
                            notifications_off
                        </span>
                        <p className="text-slate-400">لا توجد إشعارات</p>
                    </div>
                )}
            </main>

            {/* Settings Link */}
            <div className="fixed bottom-0 left-0 right-0 bg-surface-dark border-t border-slate-800 p-4 pb-safe">
                <div className="max-w-md mx-auto">
                    <Link
                        href="/settings/notifications"
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-slate-300 bg-surface-highlight border border-slate-700 hover:border-primary transition-all"
                    >
                        <span className="material-symbols-outlined">settings</span>
                        إعدادات الإشعارات
                    </Link>
                </div>
            </div>
        </div>
    );
}
