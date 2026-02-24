"use client";

import Link from "next/link";
import { useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

export default function LocationPage() {
    const [isLocating, setIsLocating] = useState(false);
    const [locationConfirmed, setLocationConfirmed] = useState(false);
    const [warehouseImage, setWarehouseImage] = useState<string | null>(null);
    const [address, setAddress] = useState("دمشق، المنطقة الصناعية، شارع 5");
    const [openTime, setOpenTime] = useState("08:00");
    const [closeTime, setCloseTime] = useState("18:00");

    const handleWarehouseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setWarehouseImage(URL.createObjectURL(file));
        }
    };

    const handleLocate = () => {
        setIsLocating(true);
        setTimeout(() => {
            setIsLocating(false);
            setLocationConfirmed(true);
        }, 1500);
    };

    return (
        <>
            <HeaderWithBack title="تأكيد موقع المستودع" />

            <main className="flex-col pb-28 h-full">
                {/* Stepper Progress */}
                <div className="w-full px-6 py-4 bg-bg-dark z-10 relative">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">2/4</span>
                        <h2 className="text-sm font-bold text-white">تأكيد موقع المستودع</h2>
                        <div></div>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-1.5 w-16 rounded-full bg-primary"></div>
                        <div className="h-1.5 w-16 rounded-full bg-primary"></div>
                        <div className="h-1.5 w-16 rounded-full bg-slate-700"></div>
                    </div>
                </div>

                {/* Header Description */}
                <div className="px-5 py-4">
                    <h2 className="text-lg font-black text-white mb-1">موقع ساحة الخردة</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        يرجى تحديد موقع ساحة الخردة بدقة على الخريطة أدناه لتمكين السائقين من الوصول إليك.
                    </p>
                </div>

                {/* Map Container - OpenStreetMap */}
                <div className="px-4 mb-4">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-surface-dark h-48">
                        <iframe
                            src="https://www.openstreetmap.org/export/embed.html?bbox=36.26,33.49,36.34,33.53&layer=mapnik&marker=33.51,36.30"
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
                        <p className="text-xs text-slate-500 mb-2 text-center">العنوان المكتشف</p>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-dark border border-slate-700">
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

                    {/* Warehouse Photo */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3">صورة مدخل المستودع</h3>
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
                                    <span className="text-sm font-bold text-white">التقط صورة أو اختر من المعرض</span>
                                    <span className="text-[11px] text-slate-500">يجب أن تكون اللوحة واسم المستودع واضحين</span>
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

                    {/* Working Hours */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3">ساعات العمل</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Opens */}
                            <div className="p-3 rounded-xl bg-surface-dark border border-slate-700">
                                <p className="text-[11px] text-slate-500 mb-2 text-center">يفتح في</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-[18px]">schedule</span>
                                    <input
                                        type="time"
                                        value={openTime}
                                        onChange={(e) => setOpenTime(e.target.value)}
                                        className="bg-transparent text-white text-sm font-bold focus:outline-none text-center w-20 [color-scheme:dark]"
                                    />
                                    <span className="text-xs text-slate-500">ص</span>
                                </div>
                            </div>
                            {/* Closes */}
                            <div className="p-3 rounded-xl bg-surface-dark border border-slate-700">
                                <p className="text-[11px] text-slate-500 mb-2 text-center">يغلق في</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-[18px]">schedule</span>
                                    <input
                                        type="time"
                                        value={closeTime}
                                        onChange={(e) => setCloseTime(e.target.value)}
                                        className="bg-transparent text-white text-sm font-bold focus:outline-none text-center w-20 [color-scheme:dark]"
                                    />
                                    <span className="text-xs text-slate-500">م</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Submit */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-bg-dark/90 backdrop-blur-lg border-t border-slate-800 max-w-md mx-auto">
                <Link
                    href="/verification/success"
                    className="w-full flex items-center justify-center gap-2 text-white font-bold text-base py-4 rounded-xl shadow-lg transition-all duration-200 bg-primary hover:bg-primary/90 shadow-primary/25"
                >
                    <span>تأكيد وحفظ</span>
                </Link>
            </div>
        </>
    );
}
