"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

interface TransportOrder {
    id: string;
    trackingId: string;
    status: string;
    statusAr: string;
    materialType: string;
    materialName: string;
    weight: number;
    pickupGovernorate: string;
    deliveryGovernorate: string;
    pricingType: string;
    pricingTypeName: string;
    offersCount: number;
    createdAt: string;
}

const statusColors: Record<string, string> = {
    OPEN: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    HAS_OFFERS: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    CONFIRMED: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    IN_TRANSIT: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    DELIVERED: "bg-green-500/20 text-green-400 border-green-500/30",
    CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusFilters = [
    { id: "all", name: "الكل" },
    { id: "OPEN", name: "مفتوح للعروض" },
    { id: "HAS_OFFERS", name: "لديه عروض" },
    { id: "IN_TRANSIT", name: "في الطريق" },
    { id: "DELIVERED", name: "تم التسليم" },
    { id: "CANCELLED", name: "ملغي" },
];

export default function TransportOrdersPage() {
    const { addToast } = useToast();
    const [orders, setOrders] = useState<TransportOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            const statusParam = activeFilter !== "all" ? `&status=${activeFilter}` : "";
            const response = await fetch(`/api/transport/orders?limit=50${statusParam}`);
            const data = await response.json();
            if (data.success) {
                setOrders(data.orders);
            } else {
                addToast(data.error || "حدث خطأ", "error");
            }
        } catch {
            addToast("حدث خطأ أثناء جلب الطلبات", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeFilter, addToast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("ar-SA", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString("ar-SA", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString("ar-SA");
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "OPEN": return "campaign";
            case "HAS_OFFERS": return "local_offer";
            case "CONFIRMED": return "check_circle";
            case "IN_TRANSIT": return "local_shipping";
            case "DELIVERED": return "task_alt";
            case "CANCELLED": return "cancel";
            default: return "help";
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="طلبات النقل" />

            <div className="px-4 py-3 border-b border-slate-800 bg-surface-dark">
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    {statusFilters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => {
                                setActiveFilter(filter.id);
                                setLoading(true);
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                                activeFilter === filter.id
                                    ? "bg-primary text-white"
                                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                        >
                            {filter.name}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-1 p-4 flex flex-col gap-4">
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-surface-dark rounded-xl p-4 border border-slate-800 animate-pulse">
                                <div className="flex justify-between mb-3">
                                    <div className="h-5 w-32 bg-slate-700 rounded" />
                                    <div className="h-5 w-20 bg-slate-700 rounded" />
                                </div>
                                <div className="h-4 w-full bg-slate-700 rounded mb-2" />
                                <div className="h-4 w-2/3 bg-slate-700 rounded" />
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-slate-600">local_shipping</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">لا توجد طلبات</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            {activeFilter !== "all"
                                ? `لا توجد طلبات ${statusFilters.find(f => f.id === activeFilter)?.name}`
                                : "لم تقم بأي طلبات نقل بعد"}
                        </p>
                        <Link
                            href="/transport/book"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold"
                        >
                            <span className="material-symbols-outlined">add</span>
                            احجز شحنة جديدة
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-sm text-slate-400">
                                {orders.length} طلب
                            </span>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-1 text-sm text-primary"
                            >
                                <span className={`material-symbols-outlined text-lg ${refreshing ? "animate-spin" : ""}`}>
                                    refresh
                                </span>
                                تحديث
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {orders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={(order.status === "OPEN" || order.status === "HAS_OFFERS") ? `/transport/offers?trackingId=${order.trackingId}` : `/transport/track?trackingId=${order.trackingId}`}
                                    className="bg-surface-dark rounded-xl p-4 border border-slate-800 hover:border-primary/50 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                order.status === "DELIVERED" ? "bg-green-500/20" :
                                                order.status === "CANCELLED" ? "bg-red-500/20" :
                                                order.status === "HAS_OFFERS" ? "bg-yellow-500/20" :
                                                "bg-blue-500/20"
                                            }`}>
                                                <span className={`material-symbols-outlined text-xl ${
                                                    order.status === "DELIVERED" ? "text-green-400" :
                                                    order.status === "CANCELLED" ? "text-red-400" :
                                                    order.status === "HAS_OFFERS" ? "text-yellow-400" :
                                                    "text-blue-400"
                                                }`}>
                                                    {getStatusIcon(order.status)}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white">{order.materialName}</h3>
                                                <span className="text-xs text-slate-500">{order.trackingId}</span>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[order.status] || "bg-slate-500/20 text-slate-400"}`}>
                                            {order.statusAr}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="text-xs text-slate-400">{order.pickupGovernorate}</span>
                                        </div>
                                        <span className="material-symbols-outlined text-xs text-slate-600">arrow_back</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-xs text-slate-400">{order.deliveryGovernorate}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span>{order.weight} طن</span>
                                            <span>•</span>
                                            <span>{order.pricingTypeName}</span>
                                        </div>
                                        {order.offersCount > 0 && (
                                            <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                                                <span className="material-symbols-outlined text-yellow-400 text-sm">local_offer</span>
                                                <span className="text-xs text-yellow-400 font-medium">{order.offersCount} عروض</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/50">
                                        <span className="text-xs text-slate-500">
                                            {formatDate(order.createdAt)} - {formatTime(order.createdAt)}
                                        </span>
                                        <span className="text-xs text-primary font-medium flex items-center gap-1">
                                            عرض التفاصيل
                                            <span className="material-symbols-outlined text-sm">arrow_left</span>
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </main>

            <div className="fixed bottom-20 right-4">
                <Link
                    href="/transport/book"
                    className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                >
                    <span className="material-symbols-outlined text-white text-2xl">add</span>
                </Link>
            </div>
        </div>
    );
}
