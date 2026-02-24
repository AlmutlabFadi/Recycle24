"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

interface TrackingStep {
    id: string;
    title: string;
    description: string;
    time: string | null;
    status: "completed" | "current" | "pending";
}

interface TrackingData {
    trackingId: string;
    status: string;
    statusAr: string;
    materialType: string;
    materialName: string;
    weight: number;
    pickupAddress: string;
    pickupGovernorate: string;
    deliveryAddress: string;
    deliveryGovernorate: string;
    pickupDate: string;
    transportType: string;
    transportTypeName: string;
    estimatedPrice: number;
    actualPrice: number | null;
    estimatedDuration: string;
    distance: number;
    driver: {
        name: string;
        phone: string;
        rating: number;
        vehicleType: string;
        plateNumber: string;
    } | null;
    trackingSteps: TrackingStep[];
    createdAt: string;
    updatedAt: string;
}

export default function TransportTrackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { addToast } = useToast();
    
    const [tracking, setTracking] = useState<TrackingData | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState(searchParams.get("trackingId") || "");

    const fetchTracking = useCallback(async (id: string) => {
        if (!id.trim()) {
            addToast("الرجاء إدخال رقم الشحنة", "warning");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/transport/track?trackingId=${encodeURIComponent(id.trim())}`);
            const data = await response.json();
            
            if (data.success) {
                setTracking(data.tracking);
            } else {
                addToast(data.error || "لم يتم العثور على الشحنة", "error");
                setTracking(null);
            }
        } catch {
            addToast("حدث خطأ أثناء جلب بيانات الشحنة", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        const id = searchParams.get("trackingId");
        if (id) {
            setSearchInput(id);
            fetchTracking(id);
        }
    }, [searchParams, fetchTracking]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            router.push(`/transport/track?trackingId=${encodeURIComponent(searchInput.trim())}`);
        }
    };

    const getStepIcon = (status: string) => {
        switch (status) {
            case "completed": return "check_circle";
            case "current": return "radio_button_checked";
            default: return "radio_button_unchecked";
        }
    };

    const getStepColor = (status: string) => {
        switch (status) {
            case "completed": return "text-green-500";
            case "current": return "text-primary";
            default: return "text-slate-500";
        }
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString("ar-SA");
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="تتبع الشحنة" />

            <main className="flex-1 p-4 flex flex-col gap-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="أدخل رقم الشحنة..."
                        className="flex-1 h-12 rounded-xl bg-surface-dark border border-slate-700 px-4 text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-12 px-5 rounded-xl bg-primary text-white font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-xl">search</span>
                                <span className="hidden sm:inline">بحث</span>
                            </>
                        )}
                    </button>
                </form>

                {loading ? (
                    <div className="flex flex-col gap-4">
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 animate-pulse">
                            <div className="h-6 w-32 bg-slate-700 rounded mb-3" />
                            <div className="h-4 w-full bg-slate-700 rounded" />
                        </div>
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 animate-pulse">
                            <div className="h-20 bg-slate-700 rounded" />
                        </div>
                    </div>
                ) : tracking ? (
                    <>
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs text-slate-400">رقم الشحنة</span>
                                <span className="text-sm font-bold text-primary">{tracking.trackingId}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined ${
                                        tracking.status === "DELIVERED" ? "text-green-500" :
                                        tracking.status === "CANCELLED" ? "text-red-500" :
                                        "text-primary"
                                    }`}>
                                        local_shipping
                                    </span>
                                    <span className="text-sm text-slate-300">{tracking.statusAr}</span>
                                </div>
                                <span className="text-xs text-slate-400">
                                    الوصول المتوقع: {tracking.estimatedDuration}
                                </span>
                            </div>
                        </div>

                        {tracking.driver && (
                            <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                                <h3 className="text-sm font-bold text-white mb-3">معلومات السائق</h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-2xl text-slate-400">person</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-bold text-white">{tracking.driver.name}</span>
                                            <div className="flex items-center gap-1 bg-yellow-900/30 px-1.5 py-0.5 rounded">
                                                <span className="material-symbols-outlined text-yellow-400 text-[12px]">star</span>
                                                <span className="text-xs text-yellow-400 font-bold">{tracking.driver.rating}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {tracking.driver.vehicleType} • {tracking.driver.plateNumber}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={`tel:${tracking.driver.phone}`}
                                            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
                                        >
                                            <span className="material-symbols-outlined">call</span>
                                        </a>
                                        <a
                                            href={`https://wa.me/${tracking.driver.phone.replace(/^0/, "963")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/30 transition-colors"
                                        >
                                            <span className="material-symbols-outlined">chat</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                            <h3 className="text-sm font-bold text-white mb-3">تفاصيل الشحنة</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-3 h-3 rounded-full bg-primary mt-1.5" />
                                    <div className="flex-1">
                                        <span className="text-xs text-slate-400">من - {tracking.pickupGovernorate}</span>
                                        <p className="text-sm text-white">{tracking.pickupAddress}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
                                    <div className="flex-1">
                                        <span className="text-xs text-slate-400">إلى - {tracking.deliveryGovernorate}</span>
                                        <p className="text-sm text-white">{tracking.deliveryAddress}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-3 border-t border-slate-700 text-xs text-slate-400">
                                <span>{tracking.materialName}</span>
                                <span>•</span>
                                <span>{tracking.weight} طن</span>
                                <span>•</span>
                                <span>{tracking.transportTypeName}</span>
                                <span>•</span>
                                <span>{tracking.distance} كم</span>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700">
                                <span className="text-xs text-slate-400">السعر</span>
                                <span className="text-base font-bold text-white">
                                    {formatPrice(tracking.actualPrice || tracking.estimatedPrice)} ل.س
                                </span>
                            </div>
                        </div>

                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                            <h3 className="text-sm font-bold text-white mb-4">مراحل التتبع</h3>
                            <div className="flex flex-col gap-0">
                                {tracking.trackingSteps.map((step, index) => (
                                    <div key={step.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <span className={`material-symbols-outlined text-2xl ${getStepColor(step.status)}`}>
                                                {getStepIcon(step.status)}
                                            </span>
                                            {index < tracking.trackingSteps.length - 1 && (
                                                <div className={`w-0.5 h-12 ${
                                                    step.status === "completed" ? "bg-green-500" : "bg-slate-700"
                                                }`} />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-6">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`text-sm font-medium ${
                                                    step.status === "pending" ? "text-slate-500" : "text-white"
                                                }`}>
                                                    {step.title}
                                                </h4>
                                                {step.time && (
                                                    <span className="text-xs text-slate-400">{step.time}</span>
                                                )}
                                            </div>
                                            <p className={`text-xs mt-1 ${
                                                step.status === "pending" ? "text-slate-600" : "text-slate-400"
                                            }`}>
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-2xl">map</span>
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-white">تتبع الموقع المباشر</span>
                                    <p className="text-xs text-slate-400 mt-0.5">شاهد موقع السائق على الخريطة</p>
                                </div>
                                <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                                    فتح الخريطة
                                </button>
                            </div>
                        </div>

                        {tracking.status !== "DELIVERED" && tracking.status !== "CANCELLED" && (
                            <button className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors">
                                إلغاء الشحنة
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-slate-600">local_shipping</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">تتبع شحنتك</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            أدخل رقم الشحنة أعلاه لتتبع موقعها وحالتها
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
