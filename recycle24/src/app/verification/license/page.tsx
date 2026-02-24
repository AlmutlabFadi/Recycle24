"use client";

import Link from "next/link";
import { useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

export default function LicensePage() {
    const [licenseImages, setLicenseImages] = useState<string[]>([]);
    const [businessName, setBusinessName] = useState("");
    const [regNumber, setRegNumber] = useState("");

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newImages = Array.from(files).map(file => URL.createObjectURL(file));
            setLicenseImages(prev => [...prev, ...newImages]);
        }
    };

    const isFormValid = businessName.length > 3 && regNumber.length > 3 && licenseImages.length > 0;

    return (
        <>
            <HeaderWithBack title="رخصة العمل" />

            <main className="flex-col pb-24">
                {/* Stepper Progress */}
                <div className="w-full px-6 py-6 bg-white dark:bg-bg-dark">
                    <div className="relative flex items-center justify-between">
                        {/* Connecting Line */}
                        <div className="absolute top-[14px] left-4 right-4 h-[2px] bg-slate-100 dark:bg-slate-800 -z-0">
                            <div className="h-full w-[66%] bg-primary rounded-full transition-all duration-500"></div>
                        </div>

                        {/* Step 1: Identity (Complete) */}
                        <Link href="/verification/identity" className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white shadow-[0_0_0_4px_rgba(255,255,255,1)] dark:shadow-[0_0_0_4px_rgba(16,25,34,1)] ring-2 ring-primary/20 ring-offset-2 ring-offset-white dark:ring-offset-bg-dark transition-all">
                                <span className="material-symbols-outlined !text-[16px]">check</span>
                            </div>
                            <span className="text-xs font-bold text-primary">الهوية</span>
                        </Link>

                        {/* Step 2: License (Active) */}
                        <div className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white shadow-[0_0_0_4px_rgba(255,255,255,1)] dark:shadow-[0_0_0_4px_rgba(16,25,34,1)] ring-2 ring-primary/20 ring-offset-2 ring-offset-white dark:ring-offset-bg-dark transition-all">
                                <span className="text-sm font-bold">2</span>
                            </div>
                            <span className="text-xs font-bold text-primary">الرخصة</span>
                        </div>

                        {/* Step 3: Location */}
                        <div className="relative z-10 flex flex-col items-center gap-2 group opacity-50">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-[0_0_0_4px_rgba(255,255,255,1)] dark:shadow-[0_0_0_4px_rgba(16,25,34,1)] transition-all">
                                <span className="text-sm font-bold">3</span>
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                الموقع
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 flex flex-col gap-5">
                    {/* Info Card */}
                    <div className="bg-surface-highlight/50 border border-slate-700/50 rounded-xl p-4">
                        <div className="flex gap-3">
                            <div className="size-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined !text-[20px] filled">verified_user</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm mb-1">توثيق النشاط التجاري</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    يساعدنا هذا الإجراء في ضمان بيئة آمنة لجميع التجار. بياناتك سرية بالكامل.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-white">اسم المنشأة / العمل</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="مثال: مؤسسة الأمل للتجارة"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 pl-10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                                />
                                <span className="absolute left-3 top-3.5 material-symbols-outlined text-slate-500 !text-[20px]">
                                    store
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-white">رقم السجل التجاري او الصناعي / الترخيص</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="**********"
                                    value={regNumber}
                                    onChange={(e) => setRegNumber(e.target.value)}
                                    className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 pl-10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition font-english"
                                    dir="ltr"
                                />
                                <span className="absolute left-3 top-3.5 material-symbols-outlined text-slate-500 !text-[20px]">
                                    numbers
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white">صور الترخيص والسجلات</label>
                            <div className="space-y-3">
                                {/* Upload Area */}
                                <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl bg-surface-dark cursor-pointer hover:border-primary/50 hover:bg-surface-highlight transition group overflow-hidden">
                                    <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-primary transition">
                                        <span className="material-symbols-outlined !text-[32px]">upload_file</span>
                                        <span className="text-xs font-medium text-center px-4">ارفع صور السجل التجاري، الصناعي، أو الترخيص</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </label>

                                {/* Previews */}
                                {licenseImages.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2">
                                        {licenseImages.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group">
                                                <img src={img} alt={`Licence ${idx}`} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setLicenseImages(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined !text-[16px]">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-bg-dark/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto">
                <Link
                    href="/verification/location"
                    className={`w-full flex items-center justify-center gap-2 text-white font-bold text-base py-4 rounded-xl shadow-lg transition-all duration-200 ${isFormValid
                        ? "bg-primary hover:bg-primary/90 shadow-primary/25"
                        : "bg-slate-700 cursor-not-allowed opacity-50"
                        }`}
                    onClick={(e) => {
                        if (!isFormValid) e.preventDefault();
                    }}
                >
                    <span>التالي: تأكيد الموقع</span>
                    <span className="material-symbols-outlined !text-[20px] rtl:-scale-x-100">
                        arrow_right_alt
                    </span>
                </Link>
            </div>
        </>
    );
}
