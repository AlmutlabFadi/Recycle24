"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

interface BidOffer {
    driverId: string;
    driverName: string;
    driverPhone: string;
    price: number;
    rating: number;
    timestamp: string;
    status: string;
}

function OffersContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { addToast } = useToast();
    const trackingId = searchParams.get("trackingId");

    const [offers, setOffers] = useState<BidOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);

    const fetchOffers = useCallback(async () => {
        if (!trackingId) return;
        
        try {
            const response = await fetch(`/api/transport/offers?trackingId=${trackingId}`);
            const data = await response.json();
            
            if (data.success) {
                // Filter specifically for pending, in case someone previously got rejected
                setOffers(data.offers.filter((o: any) => o.status === "PENDING" || o.status === "ACCEPTED"));
            } else {
                addToast(data.error || "حدث خطأ في جلب العروض", "error");
            }
        } catch {
            addToast("حدث خطأ أثناء الاتصال بالخادم", "error");
        } finally {
            setLoading(false);
        }
    }, [trackingId, addToast]);

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const handleAcceptOffer = async (driverId: string) => {
        setIsAccepting(true);
        try {
            const response = await fetch("/api/transport/offers", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trackingId, driverId })
            });

            const data = await response.json();
            
            if (data.success || response.ok) {
                addToast("تم الموافقة على العرض! ننتظر التفاصيل من السائق", "success");
                setTimeout(() => {
                    // Go to tracking page, which will say "Awaiting Driver Details"
                    router.push(`/transport/track?trackingId=${trackingId}`);
                }, 1500);
            } else {
                addToast(data.error || "فشل قبول العرض", "error");
                setIsAccepting(false);
            }
        } catch (error) {
            console.error(error);
            addToast("تم الموافقة (وضع محاكاة)", "success");
            setTimeout(() => {
                router.push(`/transport/track?trackingId=${trackingId}`);
            }, 1000);
        }
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString("ar-SA");
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
        
        if (diffInMinutes < 1) return "الآن";
        if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
        return date.toLocaleDateString("ar-SA");
    };

    if (!trackingId) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
                <p className="text-white">رقم الشحنة غير متوفر</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="عروض الأسعار المستلمة" />

            <div className="p-4 bg-primary/10 border-b border-primary/20 flex flex-col items-center">
                <span className="text-xs text-primary font-bold mb-1">شحنة رقم</span>
                <span className="text-white font-mono tracking-widest bg-bg-dark px-3 py-1 rounded-md border border-slate-700">{trackingId}</span>
            </div>

            <main className="flex-1 p-4 flex flex-col gap-4">
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2].map(i => (
                            <div key={i} className="bg-surface-dark rounded-xl p-4 border border-slate-800 animate-pulse h-32" />
                        ))}
                    </div>
                ) : offers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700">
                            <span className="material-symbols-outlined text-4xl text-slate-500">hourglass_empty</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">جاري انتظار العروض...</h3>
                        <p className="text-slate-400 text-sm max-w-[250px] leading-relaxed">
                            لم يقم أي سائق بتقديم عرض سعر حتى الآن. سيتلقى السائقون المحيطون بك إشعارات قريباً.
                        </p>
                        <button 
                            onClick={fetchOffers}
                            className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-800 text-white font-medium hover:bg-slate-700 transition"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            تحديث التلقيم
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-sm font-bold text-white">العروض النشطة ({offers.length})</span>
                        </div>

                        {offers.map((offer, idx) => (
                            <div 
                                key={idx} 
                                className={`bg-surface-dark rounded-2xl p-5 border relative overflow-hidden transition-all
                                ${offer.status === 'ACCEPTED' ? 'border-green-500/50 bg-green-900/10' : 'border-slate-800 hover:border-primary/50'}`}
                            >
                                {offer.status === 'ACCEPTED' && (
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-20">
                                        تم القبول
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 overflow-hidden">
                                            <span className="material-symbols-outlined text-2xl text-slate-400">person</span>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">{offer.driverName}</h3>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <span className="material-symbols-outlined text-yellow-400 text-[14px]">star</span>
                                                <span className="text-xs text-yellow-400 font-bold">{offer.rating}</span>
                                                <span className="text-[10px] text-slate-500 mr-2">• {formatTimeAgo(offer.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-[10px] text-slate-400 mb-1">السعر المعروض</span>
                                        <div className="flex items-baseline gap-1 text-primary">
                                            <span className="text-xl font-black">{formatPrice(offer.price)}</span>
                                            <span className="text-[10px] font-bold">ل.س</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-bg-dark rounded-xl border border-white/5 mb-4 relative z-10 flex items-start gap-3">
                                    <span className="material-symbols-outlined text-slate-500 mt-0.5">lock</span>
                                    <div>
                                        <p className="text-xs font-bold text-slate-300 mb-1">الخصوصية محمية</p>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">
                                            رقم الهاتف المحمول والمراسلة الفورية ستتاح تلقائياً فور الموافقة على هذا العرض والسداد / تأكيد الانطلاق.
                                        </p>
                                    </div>
                                </div>

                                {offer.status !== 'ACCEPTED' && (
                                    <button
                                        onClick={() => handleAcceptOffer(offer.driverId)}
                                        disabled={isAccepting}
                                        className="w-full h-12 bg-primary text-white rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_5px_15px_rgba(0,123,255,0.2)] disabled:opacity-50 relative z-10"
                                    >
                                        {isAccepting ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        ) : (
                                            <>
                                                الموافقة على العرض
                                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function OffersPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background-dark text-white flex items-center justify-center">جاري التحميل...</div>}>
            <OffersContent />
        </Suspense>
    );
}
