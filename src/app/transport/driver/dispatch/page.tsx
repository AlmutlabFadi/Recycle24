"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

function DispatchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { addToast } = useToast();
    const trackingId = searchParams.get("trackingId");

    const [eta, setEta] = useState("");
    const [date, setDate] = useState("");
    const [timeWindow, setTimeWindow] = useState("");
    const [plateNumber, setPlateNumber] = useState("");
    const [vehicleColor, setVehicleColor] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!eta || !date || !timeWindow || !plateNumber || !vehicleColor) {
            addToast("يرجى تعبئة جميع الحقول المطلوبة", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/transport/dispatch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    trackingId,
                    eta,
                    date,
                    timeWindow,
                    plateNumber,
                    vehicleColor,
                    notes
                })
            });

            const data = await response.json();

            if (data.success || response.ok) {
                addToast("تم تأكيد تفاصيل الرحلة بنجاح!", "success");
                setTimeout(() => {
                    router.push(`/transport/track?trackingId=${trackingId}`);
                }, 1500);
            } else {
                addToast(data.error || "فشل تأكيد التفاصيل", "error");
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error(error);
            addToast("تم التأكيد (وضع محاكاة)", "success");
            setTimeout(() => {
                router.push(`/transport/track?trackingId=${trackingId}`);
            }, 1000);
        }
    };

    if (!trackingId) {
        return (
            <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
                <HeaderWithBack title="تفاصيل الرحلة (السائق)" />
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-white">رقم الشحنة غير متوفر</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="تفاصيل الرحلة وتأكيد الانطلاق" />

            <div className="p-4 bg-primary/10 border-b border-primary/20 flex flex-col items-center">
                <span className="text-xs text-primary font-bold mb-1">تأكيد تفاصيل الشحنة رقم</span>
                <span className="text-white font-mono tracking-widest bg-bg-dark px-3 py-1 rounded-md border border-slate-700">{trackingId}</span>
            </div>

            <main className="flex-1 p-4 flex flex-col gap-4 pb-24">
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-4 border border-green-500/20 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                        <span className="material-symbols-outlined text-2xl text-green-400">task_alt</span>
                    </div>
                    <h2 className="text-sm font-bold text-white mb-1">تمت الموافقة على عرضك!</h2>
                    <p className="text-xs text-slate-300">
                        يرجى ملء تفاصيل مركبتك وموعد الوصول للبدء بمشاركة موقعك وتفعيل المراسلة المباشرة مع العميل.
                    </p>
                </div>

                {/* Date and Time Group */}
                <div className="bg-surface-dark rounded-2xl p-4 border border-slate-800">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                        مواعيد الوصول
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">الوقت المقدر للوصول (ETA)</label>
                            <input 
                                type="text" 
                                value={eta}
                                onChange={(e) => setEta(e.target.value)}
                                placeholder="مثال: 45 دقيقة / ساعتين"
                                className="w-full h-12 bg-bg-dark border border-slate-700 rounded-xl px-4 text-white text-sm focus:border-primary focus:outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">تاريخ اليوم</label>
                                <input 
                                    type="date" 
                                    title="تاريخ الوصول"
                                    placeholder="تاريخ الوصول"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full h-12 bg-bg-dark border border-slate-700 rounded-xl px-4 text-white text-sm focus:border-primary focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">نافذة الوقت (من - إلى)</label>
                                <input 
                                    type="text" 
                                    value={timeWindow}
                                    onChange={(e) => setTimeWindow(e.target.value)}
                                    placeholder="02:00 م - 04:00 م"
                                    className="w-full h-12 bg-bg-dark border border-slate-700 rounded-xl px-4 text-white text-sm focus:border-primary focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vehicle Details */}
                <div className="bg-surface-dark rounded-2xl p-4 border border-slate-800">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">directions_car</span>
                        معلومات المركبة
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">رقم اللوحة</label>
                            <input 
                                type="text" 
                                value={plateNumber}
                                onChange={(e) => setPlateNumber(e.target.value)}
                                placeholder="مثال: دمشق 123456"
                                className="w-full h-12 bg-bg-dark border border-slate-700 rounded-xl px-4 text-white text-sm focus:border-primary focus:outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">لون المركبة</label>
                            <input 
                                type="text" 
                                value={vehicleColor}
                                onChange={(e) => setVehicleColor(e.target.value)}
                                placeholder="مثال: أبيض / فضي"
                                className="w-full h-12 bg-bg-dark border border-slate-700 rounded-xl px-4 text-white text-sm focus:border-primary focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Additional Notes */}
                <div className="bg-surface-dark rounded-2xl p-4 border border-slate-800">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">speaker_notes</span>
                        ملاحظات إضافية للعميل
                    </h3>
                    <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="أي رسالة أو توضيح تريد إضافته للعميل (اختياري)..."
                        rows={3}
                        className="w-full bg-bg-dark border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none transition-all resize-none"
                    />
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-dark border-t border-slate-800">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !eta || !date || !timeWindow || !plateNumber || !vehicleColor}
                    className="w-full h-14 bg-primary text-white rounded-xl font-bold text-base flex justify-center items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_5px_20px_rgba(0,123,255,0.3)] disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                        <>
                            تأكيد البيانات والانطلاق
                            <span className="material-symbols-outlined text-xl">route</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function DispatchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background-dark text-white flex items-center justify-center">جاري التحميل...</div>}>
            <DispatchContent />
        </Suspense>
    );
}
