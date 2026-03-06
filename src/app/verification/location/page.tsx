"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useVerification } from "@/contexts/VerificationContext";
import { useToast } from "@/contexts/ToastContext";

function LocationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetRole = searchParams.get("role") || "CLIENT";
    const { data: contextData, updateData, submitVerification, isSubmitting } = useVerification();
    const { addToast } = useToast();

    const [isLocating, setIsLocating] = useState(false);
    const [locationConfirmed, setLocationConfirmed] = useState(false);
    
    // Local state initialized from context
    const [warehouseImage, setWarehouseImage] = useState<string | null>(contextData.warehouseImage);
    const [address, setAddress] = useState(contextData.address);
    const [openTime, setOpenTime] = useState(contextData.openTime);
    const [closeTime, setCloseTime] = useState(contextData.closeTime);

    const isTrader = targetRole === "TRADER";
    const isDriver = targetRole === "DRIVER";

    // Sync back to context
    useEffect(() => {
        updateData({
            warehouseImage,
            address,
            openTime,
            closeTime
        });
    }, [warehouseImage, address, openTime, closeTime, updateData]);

    const [isUploading, setIsUploading] = useState(false);

    const handleWarehouseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                const result = await res.json();
                
                if (result.success) {
                    setWarehouseImage(result.url);
                } else {
                    addToast(result.error || "تعذر رفع صورة الموقع", "error");
                }
            } catch (err) {
                addToast("تعذر الوصول للخادم", "error");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleLocate = () => {
        setIsLocating(true);
        setTimeout(() => {
            setIsLocating(false);
            setLocationConfirmed(true);
            addToast("تم تحديد الموقع بنجاح", "success");
        }, 1500);
    };

    const handleSubmit = async () => {
        const success = await submitVerification(targetRole);
        if (success) {
            router.push("/verification/success");
        }
    };

    const isFormValid = address.length > 5 && (!isTrader || !!warehouseImage);

    return (
        <>
            <HeaderWithBack title={isTrader ? "تأكيد موقع المستودع" : (isDriver ? "تأكيد منطقة عمل السائق" : "تأكيد موقع النشاط")} />

            <main className="flex-col pb-28 h-full">
                {/* Stepper Progress */}
                <div className="w-full px-6 py-6 bg-white dark:bg-bg-dark">
                    <div className="relative flex items-center justify-between">
                        {/* Connecting Line */}
                        <div className="absolute top-[14px] left-4 right-4 h-[2px] bg-slate-100 dark:bg-slate-800 -z-0">
                            <div className="h-full w-full bg-primary rounded-full transition-all duration-500"></div>
                        </div>

                        {/* Step 1: Identity (Complete) */}
                        <div 
                            onClick={() => router.push(`/verification/identity?role=${targetRole}`)}
                            className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white shadow-[0_0_0_4px_rgba(255,255,255,1)] dark:shadow-[0_0_0_4px_rgba(16,25,34,1)] ring-2 ring-primary/20 ring-offset-2 ring-offset-white dark:ring-offset-bg-dark transition-all">
                                <span className="material-symbols-outlined !text-[16px]">check</span>
                            </div>
                            <span className="text-xs font-bold text-primary">الهوية</span>
                        </div>

                        {/* Step 2: License (Complete) */}
                        <div 
                            onClick={() => router.push(`/verification/license?role=${targetRole}`)}
                            className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white shadow-[0_0_0_4px_rgba(255,255,255,1)] dark:shadow-[0_0_0_4px_rgba(16,25,34,1)] ring-2 ring-primary/20 ring-offset-2 ring-offset-white dark:ring-offset-bg-dark transition-all">
                                <span className="material-symbols-outlined !text-[16px]">check</span>
                            </div>
                            <span className="text-xs font-bold text-primary">{isTrader ? "الرخصة" : "المركبة"}</span>
                        </div>

                        {/* Step 3: Location (Active) */}
                        <div className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white shadow-[0_0_0_4px_rgba(255,255,255,1)] dark:shadow-[0_0_0_4px_rgba(16,25,34,1)] ring-2 ring-primary/20 ring-offset-2 ring-offset-white dark:ring-offset-bg-dark transition-all">
                                <span className="text-sm font-bold">3</span>
                            </div>
                            <span className="text-xs font-bold text-primary">الموقع</span>
                        </div>
                    </div>
                </div>

                {/* Header Description */}
                <div className="px-5 py-4">
                    <h2 className="text-lg font-black text-white mb-1">
                        {isTrader ? "موقع ساحة الخردة" : (isDriver ? "منطقة عمل السائق" : "تحديد الموقع الحالي")}
                    </h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        {isTrader 
                            ? "يرجى تحديد موقع ساحة الخردة بدقة على الخريطة لتمكين السائقين من الوصول إليك."
                            : (isDriver
                                ? "حدد منطقة عملك الأساسية لتفعيل استقبال طلبات النقل القريبة."
                                : "يرجى تأكيد موقعك الحالي لإتمام طلب التوثيق.")}
                    </p>
                </div>

                {/* Map Container - OpenStreetMap */}
                <div className="px-4 mb-4">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-surface-dark h-48">
                        <iframe
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=36.26,33.49,36.34,33.53&layer=mapnik&marker=${locationConfirmed ? '33.513,36.305' : '33.51,36.30'}`}
                            width="100%"
                            height="100%"
                            style={{ border: 0, filter: "brightness(0.85) contrast(1.1)" }}
                            loading="lazy"
                            title="Map"
                        ></iframe>

                        {/* Location Button */}
                        <button
                            onClick={handleLocate}
                            disabled={isLocating}
                            className="absolute bottom-3 left-3 size-10 bg-surface-dark/90 backdrop-blur text-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all border border-slate-700"
                        >
                            <span className={`material-symbols-outlined !text-[22px] ${isLocating ? 'animate-spin' : ''}`}>
                                {isLocating ? 'refresh' : 'my_location'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Address Section */}
                <div className="px-5 space-y-4">
                    {/* Detected Address */}
                    <div>
                        <p className="text-xs text-slate-500 mb-2 text-center text-white/60">العنوان المكتشف</p>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-dark border border-slate-700 focus-within:border-primary transition shadow-inner">
                            <span className="material-symbols-outlined text-slate-400 !text-[20px]">edit</span>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="flex-1 bg-transparent text-white text-sm font-medium focus:outline-none"
                                dir="rtl"
                            />
                        </div>
                    </div>

                    {/* Warehouse Photo - Only for Traders */}
                    {isTrader && (
                        <div>
                            <h3 className="text-sm font-bold text-white mb-3">صورة مدخل المستودع / المنشأة</h3>
                            <label className="relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-700 rounded-xl bg-surface-dark cursor-pointer hover:border-primary/50 hover:bg-surface-highlight transition group overflow-hidden">
                                {warehouseImage ? (
                                    <div className="relative w-full h-full">
                                        <img src={warehouseImage} alt="Warehouse" className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white !text-[28px]">edit</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-primary transition p-4 text-center">
                                        <div className="size-14 rounded-full bg-surface-highlight flex items-center justify-center">
                                            <span className="material-symbols-outlined !text-[28px]">photo_camera</span>
                                        </div>
                                        <span className="text-sm font-bold text-white">
                                            {isUploading ? "جاري الرفع..." : "التقط صورة أو اختر من المعرض"}
                                        </span>
                                        <span className="text-[11px] text-slate-500">يجب أن تكون اللوحة واسم المنشأة واضحين</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleWarehouseUpload}
                                />
                            </label>
                        </div>
                    )}

                    {/* Working Hours */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3">{isDriver ? "ساعات التوفر" : "ساعات العمل المقترحة"}</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-surface-dark border border-slate-700">
                                <p className="text-[11px] text-slate-500 mb-2 text-center">يفتح في</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-[18px]">schedule</span>
                                    <input
                                        title="وقت الافتتاح"
                                        type="time"
                                        value={openTime}
                                        onChange={(e) => setOpenTime(e.target.value)}
                                        className="bg-transparent text-white text-sm font-bold focus:outline-none text-center w-20 [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-surface-dark border border-slate-700">
                                <p className="text-[11px] text-slate-500 mb-2 text-center">يغلق في</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-[18px]">schedule</span>
                                    <input
                                        title="وقت الإغلاق"
                                        type="time"
                                        value={closeTime}
                                        onChange={(e) => setCloseTime(e.target.value)}
                                        className="bg-transparent text-white text-sm font-bold focus:outline-none text-center w-20 [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Submit */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-bg-dark/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isFormValid}
                    className={`w-full flex items-center justify-center gap-2 text-white font-bold text-base py-4 rounded-xl shadow-lg transition-all duration-200 ${
                        isSubmitting || !isFormValid
                            ? "bg-slate-700 cursor-not-allowed opacity-50"
                            : "bg-primary hover:bg-primary/90 shadow-primary/25"
                    }`}
                >
                    {isSubmitting ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>جاري إرسال الطلب...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined !text-[20px]">verified</span>
                            <span>إرسال طلب التوثيق النهائي</span>
                        </>
                    )}
                </button>
            </div>
        </>
    );
}

export default function LocationPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-bg-dark font-display items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400">جاري التحميل...</p>
            </div>
        }>
            <LocationContent />
        </Suspense>
    );
}
