"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";

interface TransportOrder {
    id: string;
    trackingId: string;
    status: string;
    statusAr: string;
    materialName: string;
    weight: number;
    pickupGovernorate: string;
    deliveryGovernorate: string;
    estimatedPrice: number;
    createdAt: string;
}

const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    DRIVER_ASSIGNED: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    PICKED_UP: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    IN_TRANSIT: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    DELIVERED: "bg-green-500/20 text-green-400 border-green-500/30",
    CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};

const quickActions = [
    {
        id: "book",
        title: "حجز نقل جديد",
        description: "احجز شحنة جديدة",
        icon: "add_circle",
        href: "/transport/book",
        color: "bg-primary/20 text-primary border-primary/30",
    },
    {
        id: "track",
        title: "تتبع شحنة",
        description: "تتبع شحنتك الحالية",
        icon: "my_location",
        href: "/transport/track",
        color: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    {
        id: "orders",
        title: "طلباتي",
        description: "عرض جميع الطلبات",
        icon: "receipt_long",
        href: "/transport/orders",
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
];

const transportTypes = [
    {
        id: "pickup",
        name: "بيك أب صغير",
        description: "حمولة حتى ١ طن",
        icon: "local_shipping",
        price: "من ٥٠,٠٠٠ ل.س",
    },
    {
        id: "medium",
        name: "شاحنة متوسطة",
        description: "حمولة ١ - ٥ طن",
        icon: "agriculture",
        price: "من ١٠٠,٠٠٠ ل.س",
    },
    {
        id: "large",
        name: "شاحنة كبيرة",
        description: "حمولة ٥ - ١٠ طن",
        icon: "rv_hookup",
        price: "من ١٨٠,٠٠٠ ل.س",
    },
    {
        id: "trailer",
        name: "مقطورة",
        description: "حمولة فوق ١٠ طن",
        icon: "local_shipping",
        price: "من ٣٠٠,٠٠٠ ل.س",
    },
];

export default function TransportPage() {
    const router = useRouter();
    const [recentOrders, setRecentOrders] = useState<TransportOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [trackingId, setTrackingId] = useState("");

    useEffect(() => {
        fetchRecentOrders();
    }, []);

    const fetchRecentOrders = async () => {
        try {
            const response = await fetch("/api/transport/orders?limit=3");
            const data = await response.json();
            if (data.success) {
                setRecentOrders(data.orders);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTrackSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (trackingId.trim()) {
            router.push(`/transport/track?trackingId=${encodeURIComponent(trackingId.trim())}`);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
    };

    const formatPrice = (price?: number | null) => {
        if (price === undefined || price === null) return "0";
        return price.toLocaleString("ar-SA");
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="خدمة النقل" />

            <main className="flex-1 p-4 flex flex-col gap-6 pb-6">
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-5 border border-primary/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-2xl">local_shipping</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">خدمة نقل احترافية</h1>
                            <p className="text-sm text-slate-400">نقل آمن وسريع لجميع أنواع الخردة</p>
                        </div>
                    </div>

                    <form onSubmit={handleTrackSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            placeholder="أدخل رقم الشحنة للتتبع..."
                            className="flex-1 h-12 rounded-xl bg-surface-dark border border-slate-700 px-4 text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
                        />
                        <button
                            type="submit"
                            className="h-12 px-5 rounded-xl bg-primary text-white font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">search</span>
                            <span className="hidden sm:inline">تتبع</span>
                        </button>
                    </form>
                </div>

                <section>
                    <h2 className="text-base font-bold text-white mb-3 px-1">الخدمات السريعة</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {quickActions.map((action) => (
                            <Link
                                key={action.id}
                                href={action.href}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${action.color} transition-transform active:scale-95`}
                            >
                                <span className="material-symbols-outlined text-2xl">{action.icon}</span>
                                <span className="text-xs font-bold text-center">{action.title}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h2 className="text-base font-bold text-white">أنواع النقل</h2>
                        <Link href="/transport/book" className="text-sm text-primary font-medium">
                            احجز الآن
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {transportTypes.map((type) => (
                            <Link
                                key={type.id}
                                href={`/transport/book?transportType=${type.id}`}
                                className="bg-surface-dark rounded-xl p-4 border border-slate-800 hover:border-primary/50 transition-colors"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-slate-400">{type.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-white">{type.name}</h3>
                                        <span className="text-xs text-slate-500">{type.description}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-primary font-medium">{type.price}</p>
                            </Link>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h2 className="text-base font-bold text-white">الطلبات الأخيرة</h2>
                        <Link href="/transport/orders" className="text-sm text-primary font-medium">
                            عرض الكل
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : recentOrders.length === 0 ? (
                        <div className="bg-surface-dark rounded-xl p-6 border border-slate-800 text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">local_shipping</span>
                            <p className="text-slate-400 text-sm mb-4">لا توجد طلبات نقل سابقة</p>
                            <Link
                                href="/transport/book"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                احجز شحنة جديدة
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {recentOrders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={`/transport/track?trackingId=${order.trackingId}`}
                                    className="bg-surface-dark rounded-xl p-4 border border-slate-800 hover:border-primary/50 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">local_shipping</span>
                                            <span className="text-sm font-bold text-white">{order.materialName}</span>
                                            <span className="text-xs text-slate-500">• {order.weight} طن</span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[order.status] || "bg-slate-500/20 text-slate-400"}`}>
                                            {order.statusAr}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span>{order.pickupGovernorate}</span>
                                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                                        <span>{order.deliveryGovernorate}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800">
                                        <span className="text-xs text-slate-500">{formatDate(order.createdAt)}</span>
                                        <span className="text-sm font-bold text-white">{formatPrice(order.estimatedPrice)} ل.س</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                <section className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-500">info</span>
                        مميزات خدمة النقل
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: "verified_user", text: "تأمين كامل" },
                            { icon: "speed", text: "توصيل سريع" },
                            { icon: "location_on", text: "تتبع مباشر" },
                            { icon: "support_agent", text: "دعم 24/7" },
                        ].map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-lg">{feature.icon}</span>
                                <span className="text-xs text-slate-300">{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
