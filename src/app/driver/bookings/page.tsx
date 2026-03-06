"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

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

const deliveryStatusLabel: Record<string, string> = {
    ASSIGNED: "تم الإسناد",
    PICKED_UP: "تم الاستلام",
    OUT_FOR_DELIVERY: "في الطريق",
    DELIVERED: "تم التسليم",
    DELIVERY_FAILED: "فشل التسليم",
};

export default function DriverBookingsPage() {
    const { addToast } = useToast();
    const [offers, setOffers] = useState<DriverOffer[]>([]);
    const [deliveries, setDeliveries] = useState<DriverDelivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [offersRes, deliveriesRes] = await Promise.all([
                fetch("/api/driver/offers?status=OFFERED", { cache: "no-store" }),
                fetch("/api/driver/deliveries", { cache: "no-store" }),
            ]);

            const offersData = await offersRes.json();
            const deliveriesData = await deliveriesRes.json();

            if (offersRes.ok) setOffers(offersData.offers || []);
            if (deliveriesRes.ok) setDeliveries(deliveriesData.deliveries || []);
        } catch (error) {
            console.error("Driver bookings fetch error:", error);
            addToast("تعذر تحميل بيانات السائق", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOfferAction = async (offerId: string, action: "accept" | "decline") => {
        setActionLoading(offerId);
        try {
            const response = await fetch(`/api/driver/offers/${offerId}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = await response.json();
            if (!response.ok) {
                addToast(data.error || "تعذر تحديث العرض", "error");
                return;
            }
            addToast(action === "accept" ? "تم قبول العرض" : "تم رفض العرض", "success");
            fetchData();
        } catch (error) {
            console.error("Offer action error:", error);
            addToast("حدث خطأ أثناء تنفيذ العملية", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeliveryAction = async (deliveryId: string, action: "pickup" | "out-for-delivery" | "fail") => {
        setActionLoading(deliveryId);
        try {
            let body: Record<string, unknown> | undefined;

            if (action === "fail") {
                const reason = window.prompt("اذكر سبب فشل التسليم (اختياري)");
                body = { reason: reason || null };
            }

            const response = await fetch(`/api/driver/deliveries/${deliveryId}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: body ? JSON.stringify(body) : undefined,
            });
            const data = await response.json();
            if (!response.ok) {
                addToast(data.error || "تعذر تحديث حالة الشحنة", "error");
                return;
            }
            addToast("تم تحديث حالة الشحنة", "success");
            fetchData();
        } catch (error) {
            console.error("Delivery action error:", error);
            addToast("حدث خطأ أثناء تنفيذ العملية", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
    };

    const activeDeliveries = deliveries.filter((d) => ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(d.status));

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="طلبات السائق" />

            <main className="flex-1 p-4 pb-24 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl p-4 border border-blue-500/30">
                        <p className="text-xs text-blue-400 mb-1">عروض جديدة</p>
                        <p className="text-2xl font-bold text-white font-english">{offers.length}</p>
                    </div>
                    <div className="bg-surface-highlight rounded-2xl p-4 border border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-1">شحنات نشطة</p>
                        <p className="text-2xl font-bold text-white font-english">{activeDeliveries.length}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Link
                        href="/transport/driver/loads"
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-surface-dark py-3 text-xs font-bold text-slate-200 hover:border-primary/50 transition"
                    >
                        <span className="material-symbols-outlined !text-[18px] text-primary">local_shipping</span>
                        الأحمال المتاحة
                    </Link>
                    <Link
                        href="/driver/history"
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-surface-dark py-3 text-xs font-bold text-slate-200 hover:border-primary/50 transition"
                    >
                        <span className="material-symbols-outlined !text-[18px] text-primary">history</span>
                        سجل التوصيل
                    </Link>
                </div>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-white">العروض الجديدة</h2>
                        <Link href="/transport/driver/loads" className="text-xs text-primary font-bold">
                            تصفح الأحمال المتاحة
                        </Link>
                    </div>

                    {loading ? (
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">
                            جاري تحميل العروض...
                        </div>
                    ) : offers.length === 0 ? (
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">
                            لا توجد عروض جديدة حاليا
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {offers.map((offer) => (
                                <div key={offer.id} className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-xs text-slate-500">طلب #{offer.order.id}</p>
                                            <p className="text-sm font-bold text-white">من {offer.order.pickupAddress}</p>
                                            <p className="text-xs text-slate-400">إلى {offer.order.dropoffAddress}</p>
                                        </div>
                                        <span className="text-xs text-primary font-bold">{formatDate(offer.offeredAt)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                                        <span>المستلم: {offer.order.recipientName || "غير محدد"}</span>
                                        <span dir="ltr">{offer.order.recipientPhone || "--"}</span>
                                    </div>
                                    {offer.offeredPrice !== null && (
                                        <div className="text-xs text-slate-400 mb-3">
                                            قيمة العرض: <span className="text-white font-bold">{offer.offeredPrice.toLocaleString("ar-SA")} ل.س</span>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOfferAction(offer.id, "accept")}
                                            disabled={actionLoading === offer.id}
                                            className="flex-1 h-10 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50"
                                        >
                                            قبول العرض
                                        </button>
                                        <button
                                            onClick={() => handleOfferAction(offer.id, "decline")}
                                            disabled={actionLoading === offer.id}
                                            className="flex-1 h-10 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 disabled:opacity-50"
                                        >
                                            رفض العرض
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <h2 className="text-sm font-bold text-white mb-3">الشحنات الموكلة</h2>
                    {loading ? (
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">
                            جاري تحميل الشحنات...
                        </div>
                    ) : activeDeliveries.length === 0 ? (
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">
                            لا توجد شحنات نشطة حاليا
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeDeliveries.map((delivery) => (
                                <div key={delivery.id} className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-xs text-slate-500">شحنة #{delivery.order.id}</p>
                                            <p className="text-sm font-bold text-white">من {delivery.order.pickupAddress}</p>
                                            <p className="text-xs text-slate-400">إلى {delivery.order.dropoffAddress}</p>
                                        </div>
                                        <span className="text-xs text-emerald-400 font-bold">
                                            {deliveryStatusLabel[delivery.status] || delivery.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                                        <span>المستلم: {delivery.order.recipientName || "غير محدد"}</span>
                                        <span dir="ltr">{delivery.order.recipientPhone || "--"}</span>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {delivery.status === "ASSIGNED" && (
                                            <button
                                                onClick={() => handleDeliveryAction(delivery.id, "pickup")}
                                                disabled={actionLoading === delivery.id}
                                                className="flex-1 h-10 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50"
                                            >
                                                تأكيد الاستلام
                                            </button>
                                        )}
                                        {delivery.status === "PICKED_UP" && (
                                            <button
                                                onClick={() => handleDeliveryAction(delivery.id, "out-for-delivery")}
                                                disabled={actionLoading === delivery.id}
                                                className="flex-1 h-10 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50"
                                            >
                                                خارج للتسليم
                                            </button>
                                        )}
                                        {delivery.status === "OUT_FOR_DELIVERY" && (
                                            <>
                                                <Link
                                                    href={`/driver/deliveries/${delivery.id}/pod`}
                                                    className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center"
                                                >
                                                    تسليم مع إثبات
                                                </Link>
                                                <button
                                                    onClick={() => handleDeliveryAction(delivery.id, "fail")}
                                                    disabled={actionLoading === delivery.id}
                                                    className="flex-1 h-10 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 disabled:opacity-50"
                                                >
                                                    فشل التسليم
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
