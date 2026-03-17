"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import HeaderWithBack from "@/components/HeaderWithBack";

const LiveDriverMap = dynamic(() => import("@/components/transport/LiveDriverMap"), { ssr: false });

type SummaryGroup = { status: string; _count: { status: number } };

type SummaryPayload = {
    drivers: SummaryGroup[];
    live?: { online: number; offline: number; total: number };
    bookings: SummaryGroup[];
    offers: SummaryGroup[];
    deliveries: SummaryGroup[];
};

type DriverRow = {
    id: string;
    fullName: string;
    phone: string;
    city?: string | null;
    status: string;
    ratingAvg: number;
    ratingCount: number;
    vehicles: { id: string }[];
    documents: { id: string; status: string; type: string; fileUrl?: string | null }[];
    user?: { name: string | null; phone: string | null; email: string | null; createdAt: string } | null;
    createdAt: string;
    updatedAt: string;
};

type BookingRow = {
    id: string;
    trackingId: string;
    materialType: string;
    weight: number;
    pickupGovernorate: string;
    deliveryGovernorate: string;
    status: string;
    driverName?: string | null;
    driverPhone?: string | null;
    vehicleType?: string | null;
    plateNumber?: string | null;
    createdAt: string;
};

type OfferRow = {
    trackingId: string;
    bookingStatus: string;
    pickupGovernorate: string;
    deliveryGovernorate: string;
    weight: number;
    materialType: string;
    offer: {
        driverId: string;
        driverName?: string;
        driverPhone?: string;
        price: number;
        rating?: number;
        timestamp: string;
        status: "PENDING" | "ACCEPTED" | "REJECTED";
    };
};

type DeliveryRow = {
    id: string;
    status: string;
    createdAt: string;
    deliveredAt?: string | null;
    order: {
        id: string;
        pickupAddress: string;
        dropoffAddress: string;
        recipientName?: string | null;
        recipientPhone?: string | null;
    };
    driver: { fullName: string; phone: string; ratingAvg: number };
    pod?: { id: string } | null;
};

type LiveDriver = {
    driverId: string;
    fullName: string;
    phone: string;
    city?: string | null;
    status: string;
    ratingAvg: number;
    lastLat: number | null;
    lastLng: number | null;
    lastSeenAt: string | null;
    isOnline: boolean;
    isAvailable: boolean;
};

type LiveShipment = {
    trackingId: string;
    status: string;
    driverId?: string | null;
    driverName?: string | null;
    driverPhone?: string | null;
    pickupGovernorate: string;
    deliveryGovernorate: string;
    lastLat: number | null;
    lastLng: number | null;
    lastSeenAt: string | null;
};

type TrackingResponse = {
    trackingId: string;
    statusAr: string;
    materialName: string;
    weight: number;
    pickupGovernorate: string;
    deliveryGovernorate: string;
    estimatedDuration: string;
    distance: number;
    driver: { name: string; phone: string; vehicleType: string; plateNumber: string } | null;
    trackingSteps: { id: string; title: string; description: string; time: string | null; status: string }[];
};

const driverStatusMap: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "قيد التقديم", color: "text-amber-400", bg: "bg-amber-500/10" },
    UNDER_REVIEW: { label: "قيد المراجعة", color: "text-blue-400", bg: "bg-blue-500/10" },
    VERIFIED: { label: "موثق", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    ACTIVE: { label: "نشط", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    SUSPENDED: { label: "موقوف", color: "text-red-400", bg: "bg-red-500/10" },
};

const bookingStatusMap: Record<string, { label: string; color: string; bg: string }> = {
    OPEN: { label: "مفتوح", color: "text-blue-400", bg: "bg-blue-500/10" },
    HAS_OFFERS: { label: "عروض واردة", color: "text-amber-400", bg: "bg-amber-500/10" },
    CONFIRMED_AWAITING_DETAILS: { label: "بانتظار التفاصيل", color: "text-purple-400", bg: "bg-purple-500/10" },
    CONFIRMED: { label: "مؤكد", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    IN_TRANSIT: { label: "في الطريق", color: "text-cyan-400", bg: "bg-cyan-500/10" },
    DELIVERED: { label: "تم التسليم", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    CANCELLED: { label: "ملغي", color: "text-red-400", bg: "bg-red-500/10" },
    PENDING: { label: "قيد الانتظار", color: "text-slate-400", bg: "bg-slate-500/10" },
};

const offerStatusMap: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "معلق", color: "text-amber-400", bg: "bg-amber-500/10" },
    ACCEPTED: { label: "مقبول", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    REJECTED: { label: "مرفوض", color: "text-red-400", bg: "bg-red-500/10" },
};

const deliveryStatusMap: Record<string, { label: string; color: string; bg: string }> = {
    ASSIGNED: { label: "تم الإسناد", color: "text-blue-400", bg: "bg-blue-500/10" },
    PICKED_UP: { label: "تم الاستلام", color: "text-amber-400", bg: "bg-amber-500/10" },
    OUT_FOR_DELIVERY: { label: "في الطريق", color: "text-cyan-400", bg: "bg-cyan-500/10" },
    DELIVERED: { label: "تم التسليم", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    DELIVERY_FAILED: { label: "فشل التسليم", color: "text-red-400", bg: "bg-red-500/10" },
};

const docTypeMap: Record<string, string> = {
    ID_CARD: "الهوية الوطنية",
    LICENSE: "رخصة القيادة",
    VEHICLE_REG: "ترخيص المركبة",
    INSURANCE: "تأمين المركبة",
    SELFIE: "صورة شخصية",
};

const docStatusMap: Record<string, { label: string; color: string; bg: string }> = {
    UPLOADED: { label: "مرفوع", color: "text-slate-400", bg: "bg-slate-500/10" },
    UNDER_REVIEW: { label: "قيد المراجعة", color: "text-blue-400", bg: "bg-blue-500/10" },
    APPROVED: { label: "مقبول", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    REJECTED: { label: "مرفوض", color: "text-red-400", bg: "bg-red-500/10" },
    EXPIRED: { label: "منتهي", color: "text-amber-400", bg: "bg-amber-500/10" },
};

const tabs = [
    { id: "drivers", label: "السائقون" },
    { id: "bookings", label: "طلبات النقل" },
    { id: "offers", label: "عروض النقل" },
    { id: "deliveries", label: "شحنات التوصيل" },
    { id: "map", label: "الخريطة الحية" },
];

export default function AdminTransportPage() {
    const [activeTab, setActiveTab] = useState("drivers");
    const [summary, setSummary] = useState<SummaryPayload | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingTab, setLoadingTab] = useState(true);

    const [drivers, setDrivers] = useState<DriverRow[]>([]);
    const [bookings, setBookings] = useState<BookingRow[]>([]);
    const [offers, setOffers] = useState<OfferRow[]>([]);
    const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
    const [liveDrivers, setLiveDrivers] = useState<LiveDriver[]>([]);
    const [liveShipments, setLiveShipments] = useState<LiveShipment[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [routePoints, setRoutePoints] = useState<{ lat: number; lng: number }[]>([]);
    const [liveFilter, setLiveFilter] = useState<"all" | "online" | "offline">("all");
    const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");
    const [lastLiveRefresh, setLastLiveRefresh] = useState<string | null>(null);
    const [trackingId, setTrackingId] = useState("");
    const [tracking, setTracking] = useState<TrackingResponse | null>(null);
    const [trackingLoading, setTrackingLoading] = useState(false);

    const [driverStatusUpdate, setDriverStatusUpdate] = useState<Record<string, string>>({});
    const [bookingStatusUpdate, setBookingStatusUpdate] = useState<Record<string, string>>({});

    const getCount = useCallback((items: SummaryGroup[] | undefined, status?: string) => {
        if (!items) return 0;
        if (!status) return items.reduce((acc, item) => acc + item._count.status, 0);
        const found = items.find((item) => item.status === status);
        return found ? found._count.status : 0;
    }, []);

    const loadSummary = useCallback(async () => {
        setLoadingSummary(true);
        try {
            const res = await fetch("/api/admin/transport/summary", { cache: "no-store" });
            const data = await res.json();
            if (res.ok && data.ok) setSummary(data.summary);
        } catch (error) {
            console.error("Summary load error:", error);
        } finally {
            setLoadingSummary(false);
        }
    }, []);

    const loadTab = useCallback(async () => {
        setLoadingTab(true);
        try {
            if (activeTab === "drivers") {
                const res = await fetch("/api/admin/transport/drivers?status=all", { cache: "no-store" });
                const data = await res.json();
                if (res.ok && data.ok) setDrivers(data.drivers || []);
            }
            if (activeTab === "bookings") {
                const res = await fetch("/api/admin/transport/bookings?status=all", { cache: "no-store" });
                const data = await res.json();
                if (res.ok && data.ok) setBookings(data.bookings || []);
            }
            if (activeTab === "offers") {
                const res = await fetch("/api/admin/transport/offers?status=all", { cache: "no-store" });
                const data = await res.json();
                if (res.ok && data.ok) setOffers(data.offers || []);
            }
            if (activeTab === "deliveries") {
                const res = await fetch("/api/admin/transport/deliveries?status=all", { cache: "no-store" });
                const data = await res.json();
                if (res.ok && data.ok) setDeliveries(data.deliveries || []);
            }
            if (activeTab === "map") {
                const res = await fetch("/api/admin/transport/live-drivers", { cache: "no-store" });
                const data = await res.json();
                if (res.ok && data.ok) {
                    setLiveDrivers(data.drivers || []);
                    setLastLiveRefresh(new Date().toISOString());
                }
                const shipmentsRes = await fetch("/api/admin/transport/live-shipments", { cache: "no-store" });
                const shipmentsData = await shipmentsRes.json();
                if (shipmentsRes.ok && shipmentsData.ok) setLiveShipments(shipmentsData.shipments || []);
            }
        } catch (error) {
            console.error("Transport tab load error:", error);
        } finally {
            setLoadingTab(false);
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab !== "map") return;
        const interval = setInterval(() => {
            fetch("/api/admin/transport/live-drivers", { cache: "no-store" })
                .then((res) => res.json())
                .then((data) => {
                    if (data?.ok) {
                        setLiveDrivers(data.drivers || []);
                        setLastLiveRefresh(new Date().toISOString());
                    }
                })
                .catch(() => {});
            fetch("/api/admin/transport/live-shipments", { cache: "no-store" })
                .then((res) => res.json())
                .then((data) => {
                    if (data?.ok) setLiveShipments(data.shipments || []);
                })
                .catch(() => {});
        }, 20000);
        return () => clearInterval(interval);
    }, [activeTab]);

    useEffect(() => {
        if (!selectedDriverId || activeTab !== "map") return;
        fetch(`/api/admin/transport/driver-route?driverId=${selectedDriverId}&minutes=120`, { cache: "no-store" })
            .then((res) => res.json())
            .then((data) => {
                if (data?.ok) setRoutePoints(data.points || []);
            })
            .catch(() => {});
    }, [selectedDriverId, activeTab]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    useEffect(() => {
        loadTab();
    }, [loadTab]);

    const handleDriverStatusUpdate = async (driverId: string) => {
        const status = driverStatusUpdate[driverId];
        if (!status) return;
        const reason = status === "SUSPENDED" ? window.prompt("سبب الإيقاف (اختياري)") : null;
        await fetch(`/api/support/driver/${driverId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, reason }),
        });
        loadSummary();
        loadTab();
    };

    const handleBookingStatusUpdate = async (trackingId: string) => {
        const status = bookingStatusUpdate[trackingId];
        if (!status) return;
        const actualPriceInput = status === "DELIVERED" ? window.prompt("السعر النهائي (اختياري)") : null;
        const actualPrice = actualPriceInput ? Number(actualPriceInput) : undefined;
        await fetch("/api/transport/status", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trackingId, status, actualPrice }),
        });
        loadSummary();
        loadTab();
    };

    const handleAcceptOffer = async (trackingId: string, driverId: string) => {
        await fetch("/api/transport/offers", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trackingId, driverId }),
        });
        loadSummary();
        loadTab();
    };

    const handleDocStatusUpdate = async (docId: string, status: string) => {
        await fetch(`/api/admin/transport/driver-documents/${docId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        loadTab();
    };

    const totalDrivers = useMemo(() => getCount(summary?.drivers), [summary, getCount]);
    const totalBookings = useMemo(() => getCount(summary?.bookings), [summary, getCount]);
    const totalOffers = useMemo(() => getCount(summary?.offers), [summary, getCount]);
    const totalDeliveries = useMemo(() => getCount(summary?.deliveries), [summary, getCount]);
    const liveOnline = summary?.live?.online ?? 0;
    const liveOffline = summary?.live?.offline ?? 0;

    const filteredLiveDrivers = useMemo(() => {
        let list = liveDrivers;
        if (liveFilter === "online") list = list.filter((driver) => driver.isOnline);
        if (liveFilter === "offline") list = list.filter((driver) => !driver.isOnline);
        if (availabilityFilter === "available") list = list.filter((driver) => driver.isAvailable);
        if (availabilityFilter === "unavailable") list = list.filter((driver) => !driver.isAvailable);
        return list;
    }, [liveDrivers, liveFilter, availabilityFilter]);

    const densityPoints = useMemo(() => {
        const buckets = new Map<string, { lat: number; lng: number; count: number }>();
        filteredLiveDrivers.forEach((driver) => {
            if (typeof driver.lastLat !== "number" || typeof driver.lastLng !== "number") return;
            const keyLat = Math.round(driver.lastLat * 20) / 20;
            const keyLng = Math.round(driver.lastLng * 20) / 20;
            const key = `${keyLat}:${keyLng}`;
            const existing = buckets.get(key);
            if (existing) {
                existing.count += 1;
            } else {
                buckets.set(key, { lat: keyLat, lng: keyLng, count: 1 });
            }
        });
        return Array.from(buckets.values());
    }, [filteredLiveDrivers]);

    const shipmentPoints = useMemo(() => {
        return liveShipments
            .filter((shipment) => typeof shipment.lastLat === "number" && typeof shipment.lastLng === "number")
            .map((shipment) => ({
                lat: shipment.lastLat as number,
                lng: shipment.lastLng as number,
                trackingId: shipment.trackingId,
                status: shipment.status,
                driverName: shipment.driverName,
            }));
    }, [liveShipments]);

    const handleTrackingLookup = async () => {
        if (!trackingId.trim()) return;
        setTrackingLoading(true);
        try {
            const res = await fetch(`/api/transport/track?trackingId=${trackingId.trim()}`, { cache: "no-store" });
            const data = await res.json();
            if (res.ok && data.success) {
                setTracking(data.tracking);
            } else {
                setTracking(null);
            }
        } catch (error) {
            console.error("Tracking lookup error:", error);
            setTracking(null);
        } finally {
            setTrackingLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <HeaderWithBack title="إدارة النقل" />

            <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[{
                    label: "السائقون",
                    value: totalDrivers,
                    icon: "local_shipping",
                    tone: "from-blue-500/15 to-cyan-500/10",
                }, {
                    label: "طلبات النقل",
                    value: totalBookings,
                    icon: "route",
                    tone: "from-amber-500/15 to-orange-500/10",
                }, {
                    label: "العروض",
                    value: totalOffers,
                    icon: "request_quote",
                    tone: "from-emerald-500/15 to-green-500/10",
                }, {
                    label: "التوصيل",
                    value: totalDeliveries,
                    icon: "inventory",
                    tone: "from-violet-500/15 to-purple-500/10",
                }, {
                    label: "متصلون الآن",
                    value: liveOnline,
                    icon: "cell_tower",
                    tone: "from-emerald-500/15 to-emerald-500/5",
                }, {
                    label: "غير متصلين",
                    value: liveOffline,
                    icon: "signal_cellular_off",
                    tone: "from-slate-500/15 to-slate-500/5",
                }].map((card) => (
                    <div key={card.label} className={`rounded-3xl p-4 border border-slate-800 bg-gradient-to-br ${card.tone}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                                <p className="text-2xl font-bold text-white font-english">
                                    {loadingSummary ? "--" : card.value}
                                </p>
                            </div>
                            <span className="material-symbols-outlined text-2xl text-slate-400">{card.icon}</span>
                        </div>
                    </div>
                ))}
            </section>

            <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-800/60 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === tab.id ? "bg-white/10 text-white border border-white/10" : "text-slate-500 hover:text-slate-200"}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loadingTab ? (
                <div className="bg-surface-highlight border border-slate-800 rounded-2xl p-6 text-slate-500 text-sm text-center">
                    جاري تحميل البيانات...
                </div>
            ) : null}

            {!loadingTab && activeTab === "drivers" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {drivers.map((driver) => {
                        const statusMeta = driverStatusMap[driver.status] || driverStatusMap.PENDING;
                        return (
                            <div key={driver.id} className="bg-surface-highlight border border-slate-800 rounded-3xl p-5 flex flex-col gap-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary">local_shipping</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-bold">{driver.fullName}</p>
                                            <p className="text-xs text-slate-500 font-english">{driver.phone}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-full ${statusMeta.bg} ${statusMeta.color} font-bold`}>
                                        {statusMeta.label}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">المركبات</p>
                                        <p className="text-white font-bold text-sm">{driver.vehicles?.length || 0}</p>
                                    </div>
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">المستندات</p>
                                        <p className="text-white font-bold text-sm">{driver.documents?.length || 0}</p>
                                    </div>
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">التقييم</p>
                                        <p className="text-white font-bold text-sm">{driver.ratingAvg.toFixed(1)} ★</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Link href="/admin/verification" className="text-xs text-primary font-bold border border-primary/20 rounded-lg px-3 py-2">
                                        مراجعة التوثيق
                                    </Link>
                                    <select
                                        value={driverStatusUpdate[driver.id] || driver.status}
                                        onChange={(e) => setDriverStatusUpdate((prev) => ({ ...prev, [driver.id]: e.target.value }))}
                                        className="bg-bg-dark border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                                    >
                                        {Object.keys(driverStatusMap).map((status) => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleDriverStatusUpdate(driver.id)}
                                        className="text-xs text-white bg-primary rounded-lg px-3 py-2"
                                    >
                                        تطبيق الحالة
                                    </button>
                                </div>

                                {driver.documents?.length > 0 && (
                                    <div className="bg-bg-dark/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-slate-400 font-bold">مستندات السائق</p>
                                            <span className="text-[10px] text-slate-500">{driver.documents.length} مستند</span>
                                        </div>
                                        <div className="space-y-2">
                                            {driver.documents.map((doc) => {
                                                const docStatus = docStatusMap[doc.status] || docStatusMap.UPLOADED;
                                                return (
                                                    <div key={doc.id} className="flex items-center justify-between gap-2 bg-slate-900/40 border border-slate-800 rounded-xl p-3">
                                                        <div>
                                                            <p className="text-xs text-white font-bold">{docTypeMap[doc.type] || doc.type}</p>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${docStatus.bg} ${docStatus.color} font-bold`}>
                                                                {docStatus.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {doc.fileUrl && (
                                                                <a
                                                                    href={doc.fileUrl}
                                                                    target="_blank"
                                                                    className="text-[10px] text-slate-300 border border-slate-600 rounded-lg px-2 py-1"
                                                                >
                                                                    عرض
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() => handleDocStatusUpdate(doc.id, "APPROVED")}
                                                                className="text-[10px] text-emerald-400 border border-emerald-500/30 rounded-lg px-2 py-1"
                                                            >
                                                                قبول
                                                            </button>
                                                            <button
                                                                onClick={() => handleDocStatusUpdate(doc.id, "REJECTED")}
                                                                className="text-[10px] text-red-400 border border-red-500/30 rounded-lg px-2 py-1"
                                                            >
                                                                رفض
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {!loadingTab && activeTab === "bookings" && (
                <div className="space-y-3">
                    {bookings.map((booking) => {
                        const statusMeta = bookingStatusMap[booking.status] || bookingStatusMap.PENDING;
                        return (
                            <div key={booking.id} className="bg-surface-highlight border border-slate-800 rounded-3xl p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-slate-500">رقم التتبع</p>
                                        <p className="text-sm font-bold text-white font-english">{booking.trackingId}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-full ${statusMeta.bg} ${statusMeta.color} font-bold`}>
                                        {statusMeta.label}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400">
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">المادة</p>
                                        <p className="text-white font-bold">{booking.materialType}</p>
                                    </div>
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">الوزن</p>
                                        <p className="text-white font-bold">{booking.weight} طن</p>
                                    </div>
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">الانطلاق</p>
                                        <p className="text-white font-bold">{booking.pickupGovernorate}</p>
                                    </div>
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">الوصول</p>
                                        <p className="text-white font-bold">{booking.deliveryGovernorate}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <select
                                        value={bookingStatusUpdate[booking.trackingId] || ""}
                                        onChange={(e) => setBookingStatusUpdate((prev) => ({ ...prev, [booking.trackingId]: e.target.value }))}
                                        className="bg-bg-dark border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                                    >
                                        <option value="">تحديث الحالة</option>
                                        <option value="CONFIRMED">تم التأكيد</option>
                                        <option value="IN_TRANSIT">في الطريق</option>
                                        <option value="DELIVERED">تم التسليم</option>
                                        <option value="CANCELLED">ملغي</option>
                                    </select>
                                    <button
                                        onClick={() => handleBookingStatusUpdate(booking.trackingId)}
                                        className="text-xs text-white bg-primary rounded-lg px-3 py-2"
                                    >
                                        تطبيق
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loadingTab && activeTab === "offers" && (
                <div className="space-y-3">
                    {offers.map((row, idx) => {
                        const statusMeta = offerStatusMap[row.offer.status];
                        return (
                            <div key={`${row.trackingId}-${row.offer.driverId}-${idx}`} className="bg-surface-highlight border border-slate-800 rounded-3xl p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-slate-500">رقم التتبع</p>
                                        <p className="text-sm font-bold text-white font-english">{row.trackingId}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-full ${statusMeta.bg} ${statusMeta.color} font-bold`}>
                                        {statusMeta.label}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400">
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">السائق</p>
                                        <p className="text-white font-bold">{row.offer.driverName || row.offer.driverId}</p>
                                    </div>
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">الهاتف</p>
                                        <p className="text-white font-bold font-english">{row.offer.driverPhone || "--"}</p>
                                    </div>
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">السعر</p>
                                        <p className="text-white font-bold">{row.offer.price.toLocaleString("ar-SY")} ل.س</p>
                                    </div>
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">التقييم</p>
                                        <p className="text-white font-bold">{row.offer.rating?.toFixed(1) || "--"}</p>
                                    </div>
                                </div>
                                {row.offer.status === "PENDING" && (
                                    <button
                                        onClick={() => handleAcceptOffer(row.trackingId, row.offer.driverId)}
                                        className="mt-4 text-xs text-white bg-emerald-600 rounded-lg px-4 py-2"
                                    >
                                        قبول العرض
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {!loadingTab && activeTab === "deliveries" && (
                <div className="space-y-3">
                    {deliveries.map((delivery) => {
                        const statusMeta = deliveryStatusMap[delivery.status] || deliveryStatusMap.ASSIGNED;
                        return (
                            <div key={delivery.id} className="bg-surface-highlight border border-slate-800 rounded-3xl p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-slate-500">شحنة</p>
                                        <p className="text-sm font-bold text-white">#{delivery.order.id}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-full ${statusMeta.bg} ${statusMeta.color} font-bold`}>
                                        {statusMeta.label}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400">
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">السائق</p>
                                        <p className="text-white font-bold">{delivery.driver.fullName}</p>
                                    </div>
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">الهاتف</p>
                                        <p className="text-white font-bold font-english">{delivery.driver.phone}</p>
                                    </div>
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">الانطلاق</p>
                                        <p className="text-white font-bold">{delivery.order.pickupAddress}</p>
                                    </div>
                                    <div className="bg-bg-dark/50 rounded-xl p-3 border border-slate-800/60">
                                        <p className="text-[10px] text-slate-500">الوصول</p>
                                        <p className="text-white font-bold">{delivery.order.dropoffAddress}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
                                    <span>المستلم: {delivery.order.recipientName || "غير محدد"}</span>
                                    <span dir="ltr">{delivery.order.recipientPhone || "--"}</span>
                                </div>
                                {delivery.pod && (
                                    <div className="mt-3 text-xs text-emerald-400 font-bold">تم تسجيل إثبات التسليم</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {!loadingTab && activeTab === "map" && (
                <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
                    <div className="bg-surface-highlight border border-slate-800 rounded-3xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500">الخريطة الحية</p>
                                <p className="text-sm font-bold text-white">انتشار السائقين في الوقت الحقيقي</p>
                            </div>
                            <div className="flex gap-2">
                                {[
                                    { id: "all", label: "الكل" },
                                    { id: "online", label: "متصل" },
                                    { id: "offline", label: "غير متصل" },
                                ].map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setLiveFilter(filter.id as "all" | "online" | "offline")}
                                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border ${liveFilter === filter.id ? "bg-primary text-white border-primary" : "border-slate-700 text-slate-400"}`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                                {[
                                    { id: "all", label: "الخدمة: الكل" },
                                    { id: "available", label: "داخل الخدمة" },
                                    { id: "unavailable", label: "خارج الخدمة" },
                                ].map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setAvailabilityFilter(filter.id as "all" | "available" | "unavailable")}
                                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border ${availabilityFilter === filter.id ? "bg-white/10 text-white border-white/10" : "border-slate-700 text-slate-400"}`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-[820px]">
                            <LiveDriverMap
                                drivers={filteredLiveDrivers}
                                selectedId={selectedDriverId}
                                routePoints={routePoints}
                                densityPoints={densityPoints}
                                shipmentPoints={shipmentPoints}
                                onSelect={setSelectedDriverId}
                            />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400" /> داخل الخدمة</span>
                                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-400" /> خارج الخدمة</span>
                                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-slate-400" /> غير متصل</span>
                                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-orange-400" /> شحنة نشطة</span>
                                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-sky-400/50" /> كثافة</span>
                            </div>
                            <span className="text-[10px] text-slate-600">آخر تحديث: {lastLiveRefresh ? new Date(lastLiveRefresh).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" }) : "--"}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-surface-highlight border border-slate-800 rounded-3xl p-4">
                            <p className="text-xs text-slate-500 mb-3">مراقبة مباشرة</p>
                            <div className="space-y-3 max-h-[240px] overflow-y-auto">
                                {filteredLiveDrivers.length === 0 ? (
                                    <div className="text-xs text-slate-500 text-center">لا توجد بيانات مباشرة حالياً</div>
                                ) : (
                                    filteredLiveDrivers.map((driver) => (
                                        <button
                                            key={driver.driverId}
                                            onClick={() => setSelectedDriverId(driver.driverId)}
                                            className={`w-full text-right border rounded-2xl p-3 transition ${selectedDriverId === driver.driverId ? "border-primary/60 bg-primary/5" : "border-slate-800 bg-bg-dark/50"}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-white font-bold">{driver.fullName}</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${driver.isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                                                    {driver.isOnline ? "متصل" : "غير متصل"}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-english">{driver.phone}</p>
                                            <p className="text-[10px] text-slate-500">آخر ظهور: {driver.lastSeenAt ? new Date(driver.lastSeenAt).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" }) : "--"}</p>
                                            <p className="text-[10px] text-slate-500">الحالة التشغيلية: {driver.isAvailable ? "داخل الخدمة" : "خارج الخدمة"}</p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-surface-highlight border border-slate-800 rounded-3xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs text-slate-500">الشحنات الحية</p>
                                <span className="text-[10px] text-slate-500">{liveShipments.length} شحنة</span>
                            </div>
                            <div className="space-y-2 max-h-[220px] overflow-y-auto">
                                {liveShipments.length === 0 ? (
                                    <div className="text-xs text-slate-500 text-center">لا توجد شحنات نشطة</div>
                                ) : (
                                    liveShipments.map((shipment) => (
                                        <div key={shipment.trackingId} className="bg-bg-dark/60 border border-slate-800 rounded-2xl p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-white font-bold">#{shipment.trackingId}</p>
                                                <span className="text-[10px] text-amber-400">{shipment.status}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500">{shipment.pickupGovernorate} → {shipment.deliveryGovernorate}</p>
                                            <p className="text-[10px] text-slate-500">السائق: {shipment.driverName || "غير محدد"}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-surface-highlight border border-slate-800 rounded-3xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500">تتبع الشحنات</p>
                                    <p className="text-sm font-bold text-white">تحقق من حالة شحنة</p>
                                </div>
                                <span className="material-symbols-outlined text-slate-400">radar</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={trackingId}
                                    onChange={(e) => setTrackingId(e.target.value)}
                                    placeholder="رقم التتبع"
                                    className="flex-1 bg-bg-dark border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                                />
                                <button
                                    onClick={handleTrackingLookup}
                                    className="bg-primary text-white text-xs font-bold rounded-xl px-4"
                                >
                                    تتبع
                                </button>
                            </div>
                            {trackingLoading ? (
                                <div className="text-xs text-slate-500">جاري جلب البيانات...</div>
                            ) : tracking ? (
                                <div className="space-y-3">
                                    <div className="bg-bg-dark/60 border border-slate-800 rounded-2xl p-3">
                                        <p className="text-xs text-slate-500">الحالة الحالية</p>
                                        <p className="text-sm text-white font-bold">{tracking.statusAr}</p>
                                        <p className="text-xs text-slate-400">{tracking.materialName} · {tracking.weight} طن</p>
                                        <p className="text-xs text-slate-500">{tracking.pickupGovernorate} → {tracking.deliveryGovernorate}</p>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        المدة المتوقعة: {tracking.estimatedDuration} · المسافة: {tracking.distance} كم
                                    </div>
                                    {tracking.driver && (
                                        <div className="bg-bg-dark/60 border border-slate-800 rounded-2xl p-3">
                                            <p className="text-xs text-slate-500">السائق</p>
                                            <p className="text-sm text-white font-bold">{tracking.driver.name}</p>
                                            <p className="text-xs text-slate-400">{tracking.driver.phone} · {tracking.driver.vehicleType} · {tracking.driver.plateNumber}</p>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        {tracking.trackingSteps.map((step) => (
                                            <div key={step.id} className="flex items-center gap-3">
                                                <span className={`size-2 rounded-full ${step.status === "completed" ? "bg-emerald-400" : step.status === "current" ? "bg-amber-400" : "bg-slate-600"}`} />
                                                <div>
                                                    <p className="text-xs text-white">{step.title}</p>
                                                    <p className="text-[10px] text-slate-500">{step.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
