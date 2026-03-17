"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

interface DriverDelivery {
    id: string;
    status: string;
    createdAt: string;
    deliveredAt?: string | null;
    failedAt?: string | null;
    failReason?: string | null;
    order: {
        id: string;
        pickupAddress: string;
        dropoffAddress: string;
        recipientName: string | null;
        recipientPhone: string | null;
    };
}

const deliveryStatusLabel: Record<string, string> = {
    DELIVERED: "تم التسليم",
    DELIVERY_FAILED: "فشل التسليم",
};

export default function DriverHistoryPage() {
    const [deliveries, setDeliveries] = useState<DriverDelivery[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/driver/deliveries", { cache: "no-store" });
            const data = await response.json();
            if (response.ok) {
                const items = (data.deliveries || []).filter((d: DriverDelivery) =>
                    ["DELIVERED", "DELIVERY_FAILED"].includes(d.status)
                );
                setDeliveries(items);
            }
        } catch (error) {
            console.error("Driver history fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "--";
        const date = new Date(dateStr);
        return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="سجل التوصيل" />

            <main className="flex-1 p-4 pb-24">
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <Link href="/driver/dashboard" className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-surface-dark py-2 text-[11px] font-bold text-slate-200 hover:border-primary/50 transition">
                        <span className="material-symbols-outlined !text-[16px] text-primary">dashboard</span>
                        لوحة السائق
                    </Link>
                    <Link href="/driver/profile" className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-surface-dark py-2 text-[11px] font-bold text-slate-200 hover:border-primary/50 transition">
                        <span className="material-symbols-outlined !text-[16px] text-primary">badge</span>
                        الملف
                    </Link>
                    <Link href="/driver/support" className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-surface-dark py-2 text-[11px] font-bold text-slate-200 hover:border-primary/50 transition">
                        <span className="material-symbols-outlined !text-[16px] text-primary">support_agent</span>
                        الدعم
                    </Link>
                </div>
                {loading ? (
                    <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">
                        جاري تحميل السجل...
                    </div>
                ) : deliveries.length === 0 ? (
                    <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">
                        لا يوجد سجل توصيل حتى الآن
                    </div>
                ) : (
                    <div className="space-y-3">
                        {deliveries.map((delivery) => (
                            <div key={delivery.id} className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-slate-500">شحنة #{delivery.order.id}</p>
                                        <p className="text-sm font-bold text-white">من {delivery.order.pickupAddress}</p>
                                        <p className="text-xs text-slate-400">إلى {delivery.order.dropoffAddress}</p>
                                    </div>
                                    <span className={`text-xs font-bold ${delivery.status === "DELIVERY_FAILED" ? "text-red-400" : "text-emerald-400"}`}>
                                        {deliveryStatusLabel[delivery.status] || delivery.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span>المستلم: {delivery.order.recipientName || "غير محدد"}</span>
                                    <span dir="ltr">{delivery.order.recipientPhone || "--"}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800">
                                    <span>تاريخ الإضافة: {formatDate(delivery.createdAt)}</span>
                                    <span>
                                        {delivery.status === "DELIVERED"
                                            ? `تاريخ التسليم: ${formatDate(delivery.deliveredAt)}`
                                            : `تاريخ الفشل: ${formatDate(delivery.failedAt)}`}
                                    </span>
                                </div>
                                {delivery.failReason && (
                                    <p className="text-xs text-red-400 mt-2">سبب الفشل: {delivery.failReason}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
