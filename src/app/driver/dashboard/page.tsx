"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useAuth } from "@/contexts/AuthContext";

type DriverProfile = {
    id: string;
    fullName: string;
    phone: string;
    city?: string | null;
    status: string;
    ratingAvg: number;
    ratingCount: number;
    vehicles?: { id: string }[];
    documents?: { id: string }[];
};

type TransportOrder = {
    id: string;
    trackingId: string;
    status: string;
    materialName: string;
    weight: number;
    pickupGovernorate: string;
    deliveryGovernorate: string;
    createdAt: string;
};

type DriverOffer = {
    id: string;
    status: string;
    offeredPrice: number | null;
    offeredAt: string;
    order: { id: string; pickupAddress: string; dropoffAddress: string };
};

type DriverDelivery = {
    id: string;
    status: string;
    createdAt: string;
    order: { id: string; pickupAddress: string; dropoffAddress: string };
};

type Reward = { id: string; amount: number; type: string; status: string };
type Ticket = { id: string; ticketId: string; subject: string; status: string };

export default function DriverDashboardPage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<DriverProfile | null>(null);
    const [offers, setOffers] = useState<DriverOffer[]>([]);
    const [deliveries, setDeliveries] = useState<DriverDelivery[]>([]);
    const [loads, setLoads] = useState<TransportOrder[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [trackingEnabled, setTrackingEnabled] = useState(false);
    const [lastTrackingAt, setLastTrackingAt] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [profileRes, offersRes, deliveriesRes, loadsRes, rewardsRes, ticketsRes, verificationRes] = await Promise.all([
                fetch("/api/driver/me", { cache: "no-store" }),
                fetch("/api/driver/offers?status=OFFERED", { cache: "no-store" }),
                fetch("/api/driver/deliveries", { cache: "no-store" }),
                fetch("/api/transport/orders?status=OPEN&view=driver&limit=5", { cache: "no-store" }),
                fetch("/api/driver/rewards", { cache: "no-store" }),
                fetch("/api/driver/tickets?status=open", { cache: "no-store" }),
                user?.id ? fetch(`/api/verification?userId=${user.id}`, { cache: "no-store" }) : Promise.resolve(null),
            ]);

            const profileJson = await profileRes.json();
            if (profileRes.ok && profileJson.driver) setProfile(profileJson.driver);

            const offersJson = await offersRes.json();
            if (offersRes.ok) setOffers(offersJson.offers || []);

            const deliveriesJson = await deliveriesRes.json();
            if (deliveriesRes.ok) setDeliveries(deliveriesJson.deliveries || []);

            const loadsJson = await loadsRes.json();
            if (loadsRes.ok && loadsJson.success) setLoads(loadsJson.orders || []);

            const rewardsJson = await rewardsRes.json();
            if (rewardsRes.ok) setRewards(rewardsJson.rewards || []);

            const ticketsJson = await ticketsRes.json();
            if (ticketsRes.ok) setTickets(ticketsJson.tickets || []);

            if (verificationRes) {
                const verificationJson = await verificationRes.json();
                const status = verificationJson?.trader?.verificationStatus || verificationJson?.verificationStatus || verificationJson?.status || null;
                setVerificationStatus(status);
            }
        } catch (error) {
            console.error("Driver dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem("driverTrackingEnabled");
        setTrackingEnabled(stored === "true");
        const availability = window.localStorage.getItem("driverAvailability");
        setIsAvailable(availability ? availability === "true" : true);
    }, []);

    useEffect(() => {
        if (!trackingEnabled) return;
        let interval: ReturnType<typeof setInterval> | null = null;
        const sendHeartbeat = async () => {
            if (!navigator.geolocation) return;

            navigator.geolocation.getCurrentPosition(async (pos) => {
                const deviceId = getDeviceId();
                const payload = {
                    deviceId,
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    isAvailable,
                };
                await fetch("/api/driver/session/heartbeat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                setLastTrackingAt(new Date().toISOString());
            }, () => {
                // ignore errors
            }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 });
        };

        sendHeartbeat();
        interval = setInterval(sendHeartbeat, 30000);
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [trackingEnabled, isAvailable]);

    const getDeviceId = () => {
        if (typeof window === "undefined") return "";
        const existing = window.localStorage.getItem("driverDeviceId");
        if (existing) return existing;
        const created = `drv_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
        window.localStorage.setItem("driverDeviceId", created);
        return created;
    };

    const toggleTracking = () => {
        const next = !trackingEnabled;
        setTrackingEnabled(next);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("driverTrackingEnabled", next ? "true" : "false");
        }
    };

    const toggleAvailability = async () => {
        const next = !isAvailable;
        setIsAvailable(next);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("driverAvailability", next ? "true" : "false");
        }

        const deviceId = getDeviceId();
        await fetch("/api/driver/session/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId, isAvailable: next }),
        });
    };

    const activeDeliveries = useMemo(
        () => deliveries.filter((d) => ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(d.status)),
        [deliveries]
    );

    const rewardBalance = useMemo(
        () => rewards.filter((r) => r.status === "APPROVED" || r.status === "PAID").reduce((acc, r) => acc + r.amount, 0),
        [rewards]
    );

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="لوحة السائق" />

            <main className="flex-1 p-4 pb-24 space-y-6">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e1b2d] via-[#0a1323] to-[#0b0f1a] border border-slate-800">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1d3b5f,transparent_50%)] opacity-40" />
                    <div className="relative p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-slate-400">مرحباً</p>
                                <h1 className="text-xl font-bold text-white">
                                    {profile?.fullName || user?.name || "سائق Recycle24"}
                                </h1>
                                <p className="text-xs text-slate-500 mt-1 font-english">{profile?.phone || user?.phone || "--"}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500">التوثيق</p>
                                <p className="text-xs font-bold text-emerald-400">
                                    {verificationStatus === "APPROVED" || verificationStatus === "VERIFIED" ? "موثق" : "قيد المراجعة"}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                                <p className="text-[10px] text-slate-500">التقييم</p>
                                <p className="text-white font-bold text-sm">{profile?.ratingAvg?.toFixed(1) || "0.0"} ★</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                                <p className="text-[10px] text-slate-500">التسليمات النشطة</p>
                                <p className="text-white font-bold text-sm">{activeDeliveries.length}</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                                <p className="text-[10px] text-slate-500">رصيد المكافآت</p>
                                <p className="text-white font-bold text-sm">{rewardBalance.toLocaleString("ar-SY")}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={toggleTracking}
                                className={`text-xs font-bold rounded-xl px-4 py-2 ${trackingEnabled ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-200 border border-slate-700"}`}
                            >
                                {trackingEnabled ? "التتبع مفعل" : "تفعيل تتبع الموقع"}
                            </button>
                            <button
                                onClick={toggleAvailability}
                                className={`text-xs font-bold rounded-xl px-4 py-2 ${isAvailable ? "bg-primary/10 text-primary border border-primary/30" : "bg-slate-800 text-slate-200 border border-slate-700"}`}
                            >
                                {isAvailable ? "داخل الخدمة" : "خارج الخدمة"}
                            </button>
                            <span className="text-[10px] text-slate-500">
                                آخر تحديث: {lastTrackingAt ? new Date(lastTrackingAt).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" }) : "--"}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/driver/profile" className="text-xs text-white bg-primary rounded-xl px-4 py-2">إدارة الملف</Link>
                            <Link href="/driver/bookings" className="text-xs text-slate-200 border border-slate-700 rounded-xl px-4 py-2">طلبات التوصيل</Link>
                            <Link href="/transport/driver/loads" className="text-xs text-slate-200 border border-slate-700 rounded-xl px-4 py-2">الأحمال المتاحة</Link>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-3">
                    {[
                        { label: "توثيق الحساب", href: "/verification/status?role=DRIVER", icon: "verified", tone: "from-emerald-500/15 to-emerald-500/5" },
                        { label: "المركبات", href: "/driver/profile", icon: "directions_car", tone: "from-blue-500/15 to-blue-500/5" },
                        { label: "المكافآت", href: "/driver/rewards", icon: "loyalty", tone: "from-amber-500/15 to-orange-500/5" },
                        { label: "الدعم الفني", href: "/driver/support", icon: "support_agent", tone: "from-purple-500/15 to-purple-500/5" },
                    ].map((item) => (
                        <Link key={item.label} href={item.href} className={`rounded-2xl p-4 border border-slate-800 bg-gradient-to-br ${item.tone} flex items-center justify-between`}> 
                            <div>
                                <p className="text-xs text-slate-400">{item.label}</p>
                                <p className="text-sm font-bold text-white mt-1">إدارة سريعة</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-300">{item.icon}</span>
                        </Link>
                    ))}
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white">العروض الجديدة</h2>
                        <Link href="/driver/bookings" className="text-xs text-primary">عرض الكل</Link>
                    </div>
                    {loading ? (
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">جاري التحميل...</div>
                    ) : offers.length === 0 ? (
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">لا توجد عروض جديدة</div>
                    ) : (
                        <div className="space-y-2">
                            {offers.slice(0, 3).map((offer) => (
                                <div key={offer.id} className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                                    <p className="text-xs text-slate-500">طلب #{offer.order.id}</p>
                                    <p className="text-sm text-white font-bold">من {offer.order.pickupAddress}</p>
                                    <p className="text-xs text-slate-400">إلى {offer.order.dropoffAddress}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white">الأحمال المتاحة</h2>
                        <Link href="/transport/driver/loads" className="text-xs text-primary">تصفح الكل</Link>
                    </div>
                    {loading ? (
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">جاري التحميل...</div>
                    ) : loads.length === 0 ? (
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">لا توجد أحمال حالياً</div>
                    ) : (
                        <div className="space-y-2">
                            {loads.slice(0, 3).map((load) => (
                                <div key={load.id} className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-white font-bold">{load.materialName}</p>
                                        <span className="text-xs text-slate-400">{load.weight} طن</span>
                                    </div>
                                    <p className="text-xs text-slate-400">{load.pickupGovernorate} → {load.deliveryGovernorate}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white">الدعم الفني</h2>
                        <Link href="/driver/support" className="text-xs text-primary">كل التذاكر</Link>
                    </div>
                    {tickets.length === 0 ? (
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">لا توجد تذاكر مفتوحة</div>
                    ) : (
                        <div className="space-y-2">
                            {tickets.slice(0, 2).map((ticket) => (
                                <div key={ticket.id} className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                                    <p className="text-xs text-slate-500">{ticket.ticketId}</p>
                                    <p className="text-sm text-white font-bold">{ticket.subject}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
