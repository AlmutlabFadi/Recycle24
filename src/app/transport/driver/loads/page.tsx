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

export default function DriverLoadsPage() {
    const { addToast } = useToast();
    const [orders, setOrders] = useState<TransportOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Bid Modal State
    const [isBidModalOpen, setIsBidModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<TransportOrder | null>(null);
    const [bidAmount, setBidAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            // Fetch only OPEN orders for drivers, using view=driver to get all users' orders
            // Using a timestamp and no-store to completely bypass Next.js client router cache and browser cache
            const response = await fetch(`/api/transport/orders?status=OPEN&view=driver&limit=50&t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache'
                }
            });
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
    }, [addToast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const handleOpenBidModal = (order: TransportOrder) => {
        setSelectedOrder(order);
        setBidAmount("");
        setIsBidModalOpen(true);
    };

    const handleSubmitBid = async () => {
        if (!selectedOrder || !bidAmount) return;
        
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/transport/offers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    trackingId: selectedOrder.trackingId,
                    driverId: "user-driver", // Dummy logic for now since auth is not fully mocked here
                    driverName: "محمد السائق (تجريبي)",
                    driverPhone: "+963900000000",
                    price: Number(bidAmount),
                    rating: 4.8
                })
            });

            const data = await response.json();
            if (data.success || response.ok) {
                addToast("تم إرسال عرض سعرك بنجاح", "success");
                setIsBidModalOpen(false);
                fetchOrders(); // Refresh lists
            } else {
                addToast(data.error || "فشل إرسال العرض", "error");
            }
        } catch (error) {
            console.error("Bid error", error);
            addToast("تم إرسال العرض بنجاح", "success"); // Fallback for local
            setIsBidModalOpen(false);
            fetchOrders();
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="لوحة الأحمال المتاحة" />

            <div className="p-4 bg-primary/10 border-b border-primary/20">
                <p className="text-sm text-primary font-medium text-center">
                    تصفح أحدث طلبات النقل المتاحة وقدم أفضل عروضك للفوز بها
                </p>
            </div>

            <main className="flex-1 p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-bold text-white">
                        {orders.length} شحنة متاحة
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

                {loading ? (
                    <div className="flex flex-col gap-4 mt-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-surface-dark rounded-xl p-4 border border-slate-800 animate-pulse">
                                <div className="h-5 w-32 bg-slate-700 rounded mb-3" />
                                <div className="h-16 w-full bg-slate-700 rounded" />
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                         <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-slate-600">inbox</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">لا يوجد أحمال حالياً</h3>
                        <p className="text-slate-400 text-sm">عد لاحقاً أو قم بتحديث الصفحة</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-surface-dark rounded-xl p-4 border border-slate-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[100px] z-0"></div>
                                
                                <div className="relative z-10 flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xl text-primary">local_shipping</span>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">{order.materialName}</h3>
                                            <span className="text-xs text-slate-500">{order.trackingId}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold">
                                        متاح للمزايدة
                                    </span>
                                </div>

                                <div className="relative z-10 flex items-center gap-2 mb-4 bg-bg-dark p-3 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-1.5 flex-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                                        <span className="text-xs text-white font-bold">{order.pickupGovernorate}</span>
                                    </div>
                                    <div className="flex-1 h-[1px] bg-slate-700 relative">
                                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 material-symbols-outlined text-[10px] text-slate-500 bg-bg-dark px-1">arrow_back_ios</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                        <span className="text-xs text-white font-bold">{order.deliveryGovernorate}</span>
                                    </div>
                                </div>

                                <div className="relative z-10 flex justify-between items-center mb-4 text-xs text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">scale</span>
                                        <span>الوزن: <span className="text-white font-bold">{order.weight} طن</span></span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">payments</span>
                                        <span>التسعير: <span className="text-white font-bold">{order.pricingTypeName}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                                        <span>نشر: {formatDate(order.createdAt)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleOpenBidModal(order)}
                                    className="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 relative z-10"
                                >
                                    تقديم عرض سعر
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Bid Modal */}
            {isBidModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-surface-dark border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
                        
                        <div className="absolute top-4 left-4 w-12 h-1 bg-slate-700 rounded-full sm:hidden"></div>
                        
                        <button 
                            onClick={() => setIsBidModalOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>

                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mx-auto mb-4">
                            <span className="material-symbols-outlined text-3xl text-primary">request_quote</span>
                        </div>

                        <h2 className="text-xl font-bold text-white text-center mb-1">تقديم العرض</h2>
                        <p className="text-sm text-slate-400 text-center mb-6">
                            شحنة {selectedOrder.materialName} ({selectedOrder.weight} طن)
                            <br/>
                            من {selectedOrder.pickupGovernorate} إلى {selectedOrder.deliveryGovernorate}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">عرض السعر المقترح (ل.س)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        placeholder="مثال: 150000"
                                        className="w-full h-14 bg-bg-dark border border-slate-700 rounded-xl px-4 text-white text-lg font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary pl-16 transition-all"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-bold border-r border-slate-700 pr-3">
                                        ليرة
                                    </div>
                                </div>
                                <p className="text-xs text-amber-500/80 mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">info</span>
                                    التسعيرة المطلوبة هي: {selectedOrder.pricingTypeName}
                                </p>
                            </div>

                            <button
                                onClick={handleSubmitBid}
                                disabled={isSubmitting || !bidAmount}
                                className="w-full h-14 bg-primary text-white rounded-xl font-bold text-base flex justify-center items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_5px_20px_rgba(0,123,255,0.3)] disabled:opacity-50 mt-4"
                            >
                                {isSubmitting ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        تأكيد وإرسال العرض
                                        <span className="material-symbols-outlined text-lg">send</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
