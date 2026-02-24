"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useState } from "react";
import Link from "next/link";

// Generate unique ID helper
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function CreateAuctionPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: "",
        auctionType: "private", // private or government
        organization: "", // For government auctions
        customOrganization: "", // For custom organization name when "other" is selected
        governorate: "دمشق", // Selected governorate
        address: "", // Detailed address
        materials: [
            {
                id: generateId(),
                type: "",
                customType: "", // For "other" material type
                weight: "",
                unit: "kg" as "kg" | "ton" | "piece" | "total" | "L" | "m2" | "m3" | "dunum" | "hectare",
                isAccurate: true // true = دقيق, false = تقريباً
            }
        ],
        allowPreview: false, // Allow preview toggle
        previewStartDate: "",
        previewEndDate: "",
        previewStartTime: "",
        previewEndTime: "",

        // Advanced Pricing
        startingBidAmount: "",
        startingBidUnit: "kg" as "kg" | "ton" | "piece" | "total" | "L" | "m2" | "m3" | "dunum" | "hectare",
        startingBidCurrency: "SYP" as "SYP" | "USD",

        buyNowPriceAmount: "",
        buyNowPriceUnit: "kg" as "kg" | "ton" | "piece" | "total" | "L" | "m2" | "m3" | "dunum" | "hectare",
        buyNowPriceCurrency: "SYP" as "SYP" | "USD",

        // Security Deposit
        securityDepositAmount: "",
        securityDepositCurrency: "SYP" as "SYP" | "USD",
        securityDepositPaymentMethod: "platform" as "platform" | "direct", // For government auctions

        // Shipment Duration
        shipmentDurationDays: "",

        duration: "24", // in hours: 1, 4, 6, 12, 24, 48, 72, 168 (week)
        startDate: "",
        startTime: "",
        endDate: "", // calculated based on duration
        endTime: "", // calculated based on duration
        scheduleType: "immediate", // immediate or scheduled
        scheduledDate: "",
        scheduledTime: "",
        images: [] as File[],
        videos: [] as File[],
        termsFiles: [] as File[],
        acceptedTerms: false,
        notes: "" // Additional notes
    });

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = async () => {
        try {
            const startDate = formData.scheduleType === "scheduled" && formData.scheduledDate && formData.scheduledTime 
                ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
                : new Date();
                
            const endDate = new Date(startDate.getTime() + (parseInt(formData.duration) * 60 * 60 * 1000));

            const payload = {
                title: formData.title,
                material: formData.materials[0]?.type === "أخرى" ? formData.materials[0]?.customType : formData.materials[0]?.type,
                weight: formData.materials[0]?.weight,
                startingPrice: formData.startingBidAmount,
                buyNowPrice: formData.buyNowPriceAmount,
                governorate: formData.governorate,
                address: formData.address,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            };

            const response = await fetch('/api/auctions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "فشل إنشاء المزاد");
            }
            
            // Show Success UI
            setStep(4);
        } catch (error) {
            console.error("Auction submission failed:", error);
            alert("حدث خطأ أثناء إرسال البيانات. تأكد من تسجيل الدخول.");
        }
    };

    const renderStepIndicator = () => (
        <div className="w-full px-6 py-6 bg-white dark:bg-bg-dark">
            <div className="relative flex items-center justify-between">
                <div className="absolute top-[14px] left-4 right-4 h-[2px] bg-slate-100 dark:bg-slate-800 -z-0">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
                </div>
                {[1, 2, 3].map((s) => (
                    <div key={s} className={`relative z-10 flex flex-col items-center gap-2 ${step >= s ? "text-primary" : "text-slate-400 opacity-50"}`}>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,1)] dark:shadow-[0_0_0_4px_rgba(16,25,34,1)] transition-all ${step >= s ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800"}`}>
                            <span className="text-sm font-bold">{s}</span>
                        </div>
                        <span className="text-xs font-bold">{s === 1 ? "التفاصيل" : s === 2 ? "التسعير" : "المراجعة"}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    if (step === 4) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <div className="w-full h-full bg-[url('https://lottie.host/embed/98692795-385d-452f-9642-167822b37803/7K9X2Q9X2Q.json')] opacity-20"></div>
                </div>
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="size-24 rounded-full bg-green-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-green-500/30 animate-bounce">
                        <span className="material-symbols-outlined !text-[48px]">check</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">تم إنشاء المزاد بنجاح!</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">سيظهر المزاد في الصالة العامة خلال لحظات.</p>
                    <div className="flex flex-col gap-3 w-full max-w-sm">
                        <Link href="/auctions/402" className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20">
                            مشاهدة المزاد
                        </Link>
                        <Link href="/auctions" className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white py-4 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                            العودة للرئيسية
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="إنشاء مزاد جديد" />

            {renderStepIndicator()}

            <main className="flex-1 px-4 py-2 flex flex-col gap-6">
                {step === 1 && (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white">عنوان المزاد</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="مثال: طن حديد سكراب نظيف"
                                className="w-full bg-white dark:bg-surface-highlight border-none rounded-xl py-4 px-4 shadow-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>

                        {/* Auction Type Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white">نوع المزاد</label>
                            <div className="relative">
                                <select
                                    value={formData.auctionType}
                                    onChange={(e) => setFormData({ ...formData, auctionType: e.target.value as "private" | "government", organization: "" })}
                                    className="w-full h-14 appearance-none rounded-xl bg-white dark:bg-surface-highlight border-none shadow-sm py-4 px-4 pl-10 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                >
                                    <option value="private">مزاد خاص</option>
                                    <option value="government">مزاد حكومي</option>
                                </select>
                                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <span className="material-symbols-outlined !text-[20px]">expand_more</span>
                                </div>
                            </div>
                        </div>


                        {/* Organization Selection (for government auctions) */}
                        {formData.auctionType === "government" && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-sm font-bold text-slate-900 dark:text-white">
                                    الجهة المعلنة
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.organization}
                                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                        className="w-full h-14 max-h-64 appearance-none rounded-xl bg-white dark:bg-surface-highlight border-none shadow-sm py-4 px-4 pl-10 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-green-600 outline-none cursor-pointer scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                                        size={1}
                                    >
                                        <option value="">-- اختر الجهة المعلنة --</option>
                                        <option value="مديرية كهرباء دمشق">مديرية كهرباء دمشق</option>
                                        <option value="مديرية كهرباء ريف دمشق">مديرية كهرباء ريف دمشق</option>
                                        <option value="مديرية كهرباء حلب">مديرية كهرباء حلب</option>
                                        <option value="مديرية كهرباء حمص">مديرية كهرباء حمص</option>
                                        <option value="مديرية كهرباء حماة">مديرية كهرباء حماة</option>
                                        <option value="مديرية كهرباء اللاذقية">مديرية كهرباء اللاذقية</option>
                                        <option value="مديرية كهرباء طرطوس">مديرية كهرباء طرطوس</option>
                                        <option value="مديرية كهرباء الحسكة">مديرية كهرباء الحسكة</option>
                                        <option value="مديرية كهرباء دير الزور">مديرية كهرباء دير الزور</option>
                                        <option value="مديرية الاتصالات">مديرية الاتصالات</option>
                                        <option value="مديرية النقل">مديرية النقل</option>
                                        <option value="وزارة الدفاع">وزارة الدفاع</option>
                                        <option value="وزارة الداخلية">وزارة الداخلية</option>
                                        <option value="بلدية دمشق">بلدية دمشق</option>
                                        <option value="بلدية حلب">بلدية حلب</option>
                                        <option value="بلدية حمص">بلدية حمص</option>
                                        <option value="بلدية حماة">بلدية حماة</option>
                                        <option value="بلدية اللاذقية">بلدية اللاذقية</option>
                                        <option value="شركة مياه الشرب">شركة مياه الشرب</option>
                                        <option value="الشركة العامة للصرف الصحي">الشركة العامة للصرف الصحي</option>
                                        <option value="وزارة الإدارة المحلية">وزارة الإدارة المحلية</option>
                                        <option value="وزارة الصناعة">وزارة الصناعة</option>
                                        <option value="وزارة الأشغال العامة">وزارة الأشغال العامة</option>
                                        <option value="other">أخرى</option>
                                    </select>
                                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <span className="material-symbols-outlined !text-[20px]">expand_more</span>
                                    </div>
                                </div>

                                {/* Custom Organization Input */}
                                {formData.organization === "other" && (
                                    <input
                                        type="text"
                                        placeholder="اكتب اسم الجهة المعلنة..."
                                        className="w-full bg-white dark:bg-surface-highlight border border-green-600 rounded-xl py-3 px-4 shadow-sm focus:ring-2 focus:ring-green-600 text-slate-900 dark:text-white placeholder:text-slate-400 animate-in fade-in slide-in-from-top-2 duration-300"
                                    />
                                )}

                                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-[14px]">info</span>
                                    المزادات الحكومية تتمتع بأولوية عرض أعلى
                                </p>
                            </div>
                        )}

                        {/* Multi-Material Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white">
                                المواد
                            </label>

                            {formData.materials.map((material, index) => (
                                <div key={material.id} className="bg-white dark:bg-surface-highlight p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
                                    {/* Row 1: Material Type */}
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">نوع المادة</label>
                                            <div className="relative">
                                                <select
                                                    value={material.type}
                                                    onChange={(e) => {
                                                        const newMaterials = [...formData.materials];
                                                        newMaterials[index].type = e.target.value;
                                                        setFormData({ ...formData, materials: newMaterials });
                                                    }}
                                                    className="w-full h-12 max-h-48 appearance-none rounded-lg bg-slate-50 dark:bg-slate-900 border-none px-3 pl-8 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer overflow-y-auto scrollbar-thin"
                                                >
                                                    <option value="">-- اختر نوع المادة --</option>
                                                    <option value="حديد">حديد</option>
                                                    <option value="نحاس أحمر">نحاس أحمر</option>
                                                    <option value="نحاس أصفر">نحاس أصفر</option>
                                                    <option value="نحاس مخلوط">نحاس مخلوط</option>
                                                    <option value="ألمنيوم">ألمنيوم</option>
                                                    <option value="ألمنيوم خردة">ألمنيوم خردة</option>
                                                    <option value="برونز">برونز</option>
                                                    <option value="نيكل">نيكل</option>
                                                    <option value="رصاص">رصاص</option>
                                                    <option value="قصدير">قصدير</option>
                                                    <option value="زنك">زنك</option>
                                                    <option value="تيتانيوم">تيتانيوم</option>
                                                    <option value="مخلفات عسكرية">مخلفات عسكرية </option>
                                                    <option value="حديد صلب">حديد صلب</option>
                                                    <option value="ستانلس ستيل">ستانلس ستيل</option>
                                                    <option value="بلاستيك PET">بلاستيك PET</option>
                                                    <option value="بلاستيك HDPE">بلاستيك HDPE</option>
                                                    <option value="بلاستيك PVC">بلاستيك PVC</option>
                                                    <option value="بلاستيك PP">بلاستيك PP</option>
                                                    <option value="بلاستيك مخلوط">بلاستيك مخلوط</option>
                                                    <option value="كرتون">كرتون</option>
                                                    <option value="ورق">ورق</option>
                                                    <option value="زجاج">زجاج</option>
                                                    <option value="زجاج ملون">زجاج ملون</option>
                                                    <option value="مطاط">مطاط</option>
                                                    <option value="إطارات">إطارات</option>
                                                    <option value="كابلات كهربائية">كابلات كهربائية</option>
                                                    <option value="بطاريات">بطاريات</option>
                                                    <option value="إلكترونيات">إلكترونيات</option>
                                                    <option value="خشب">خشب</option>
                                                    <option value="نسيج">نسيج</option>
                                                    <option value="جلود">جلود</option>
                                                    <option value="أجهزة منزلية">أجهزة منزلية</option>
                                                    <option value="سيارات">سيارات</option>
                                                    <option value="محركات">محركات</option>
                                                    <option value="معدات صناعية">معدات صناعية</option>
                                                    <option value="خرسانة">خرسانة</option>
                                                    <option value="طوب">طوب</option>
                                                    <option value="رخام">رخام</option>
                                                    <option value="سيراميك">سيراميك</option>
                                                    <option value="نفايات عضوية">نفايات عضوية</option>
                                                    <option value="زيوت مستعملة">زيوت مستعملة</option>
                                                    <option value="مختلطة">مختلطة</option>
                                                    <option value="أخرى">أخرى</option>
                                                </select>
                                                <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <span className="material-symbols-outlined !text-[16px]">expand_more</span>
                                                </div>
                                            </div>

                                            {/* Custom Material Type Input */}
                                            {material.type === "أخرى" && (
                                                <input
                                                    type="text"
                                                    value={material.customType}
                                                    onChange={(e) => {
                                                        const newMaterials = [...formData.materials];
                                                        newMaterials[index].customType = e.target.value;
                                                        setFormData({ ...formData, materials: newMaterials });
                                                    }}
                                                    placeholder="اكتب نوع المادة..."
                                                    className="w-full mt-2 h-10 bg-white dark:bg-surface-dark border border-primary rounded-lg px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                                />
                                            )}
                                        </div>

                                        {/* Delete Button */}
                                        {formData.materials.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newMaterials = formData.materials.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, materials: newMaterials });
                                                }}
                                                className="mt-6 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                            >
                                                <span className="material-symbols-outlined !text-[20px]">delete</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Row 2: Weight, Unit, Accuracy */}
                                    <div className="flex gap-2">
                                        {/* Weight */}
                                        <div className="flex-1">
                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">الكمية</label>
                                            <input
                                                type="number"
                                                value={material.weight}
                                                onChange={(e) => {
                                                    const newMaterials = [...formData.materials];
                                                    newMaterials[index].weight = e.target.value;
                                                    setFormData({ ...formData, materials: newMaterials });
                                                }}
                                                placeholder="0"
                                                className="w-full h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-3 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>

                                        {/* Unit */}
                                        <div className="w-24">
                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">الوحدة</label>
                                            <div className="relative">
                                                <select
                                                    value={material.unit}
                                                    onChange={(e) => {
                                                        const newMaterials = [...formData.materials];
                                                        newMaterials[index].unit = e.target.value as "kg" | "ton" | "piece" | "total" | "L" | "m2" | "m3" | "dunum" | "hectare";
                                                        setFormData({ ...formData, materials: newMaterials });
                                                    }}
                                                    className="w-full h-12 appearance-none rounded-lg bg-slate-50 dark:bg-slate-900 border-none px-2 pl-7 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                                >
                                                    <option value="kg">كغ</option>
                                                    <option value="ton">طن</option>
                                                    <option value="piece">قطعة</option>
                                                    <option value="total">كامل الكمية</option>
                                                    <option value="L">L</option>
                                                    <option value="m2">m²</option>
                                                    <option value="m3">m³</option>
                                                    <option value="dunum">دونم</option>
                                                    <option value="hectare">هكتار</option>
                                                </select>
                                                <div className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <span className="material-symbols-outlined !text-[14px]">expand_more</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Accuracy Toggle */}
                                        <div className="flex-1">
                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">الدقة</label>
                                            <div className="relative">
                                                <select
                                                    value={material.isAccurate ? "exact" : "approximate"}
                                                    onChange={(e) => {
                                                        const newMaterials = [...formData.materials];
                                                        newMaterials[index].isAccurate = e.target.value === "exact";
                                                        setFormData({ ...formData, materials: newMaterials });
                                                    }}
                                                    className="w-full h-12 appearance-none rounded-lg bg-slate-50 dark:bg-slate-900 border-none px-3 pl-8 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                                >
                                                    <option value="exact">دقيق</option>
                                                    <option value="approximate">تقريباً</option>
                                                </select>
                                                <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <span className="material-symbols-outlined !text-[14px]">expand_more</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add Material Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({
                                        ...formData,
                                        materials: [
                                            ...formData.materials,
                                            {
                                                id: Date.now().toString(),
                                                type: "",
                                                customType: "",
                                                weight: "",
                                                unit: "kg" as "kg" | "ton" | "piece" | "total" | "L" | "m2" | "m3" | "dunum" | "hectare",
                                                isAccurate: true
                                            }
                                        ]
                                    });
                                }}
                                className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl py-4 px-4 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition group"
                            >
                                <span className="material-symbols-outlined !text-[20px] group-hover:scale-110 transition-transform">add</span>
                                <span className="font-bold text-sm">إضافة مادة أخرى</span>
                            </button>
                        </div>

                        {/* Governorate & Address Section */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-900 dark:text-white">
                                الموقع
                            </label>

                            {/* Governorate Dropdown */}
                            <div className="relative">
                                <select
                                    value={formData.governorate}
                                    onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                                    className="w-full h-14 appearance-none rounded-xl bg-white dark:bg-surface-highlight border-none shadow-sm py-4 px-4 pl-10 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                >
                                    <option value="دمشق">دمشق</option>
                                    <option value="ريف دمشق">ريف دمشق</option>
                                    <option value="حلب">حلب</option>
                                    <option value="حمص">حمص</option>
                                    <option value="حماة">حماة</option>
                                    <option value="اللاذقية">اللاذقية</option>
                                    <option value="طرطوس">طرطوس</option>
                                    <option value="إدلب">إدلب</option>
                                    <option value="الحسكة">الحسكة</option>
                                    <option value="دير الزور">دير الزور</option>
                                    <option value="الرقة">الرقة</option>
                                    <option value="درعا">درعا</option>
                                    <option value="السويداء">السويداء</option>
                                    <option value="القنيطرة">القنيطرة</option>
                                </select>
                                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <span className="material-symbols-outlined !text-[20px]">expand_more</span>
                                </div>
                            </div>

                            {/* Address Input */}
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="العنوان التفصيلي (المنطقة، الشارع، رقم البناء...)"
                                className="w-full bg-white dark:bg-surface-highlight border-none rounded-xl py-4 px-4 shadow-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>

                        {/* Preview Settings Section */}
                        <div className="space-y-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined !text-[18px] text-blue-600">visibility</span>
                                    السماح بالمعاينة
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, allowPreview: !formData.allowPreview })}
                                    className={`relative w-12 h-6 rounded-full transition ${formData.allowPreview ? 'bg-primary' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${formData.allowPreview ? 'right-0.5' : 'right-6'}`} />
                                </button>
                            </div>

                            {formData.allowPreview && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* Date Range */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">فترة المعاينة</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">من تاريخ</label>
                                                <input
                                                    type="date"
                                                    value={formData.previewStartDate}
                                                    onChange={(e) => setFormData({ ...formData, previewStartDate: e.target.value })}
                                                    className="w-full bg-white dark:bg-surface-dark border-none rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">إلى تاريخ</label>
                                                <input
                                                    type="date"
                                                    value={formData.previewEndDate || formData.previewStartDate}
                                                    onChange={(e) => setFormData({ ...formData, previewEndDate: e.target.value })}
                                                    className="w-full bg-white dark:bg-surface-dark border-none rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Working Hours */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">أوقات العمل</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">من</label>
                                                <input
                                                    type="time"
                                                    value={formData.previewStartTime}
                                                    onChange={(e) => setFormData({ ...formData, previewStartTime: e.target.value })}
                                                    className="w-full bg-white dark:bg-surface-dark border-none rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">إلى</label>
                                                <input
                                                    type="time"
                                                    value={formData.previewEndTime}
                                                    onChange={(e) => setFormData({ ...formData, previewEndTime: e.target.value })}
                                                    className="w-full bg-white dark:bg-surface-dark border-none rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Image Upload Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined !text-[18px] text-primary">add_photo_alternate</span>
                                صور المادة
                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    setFormData({ ...formData, images: [...formData.images, ...files] });
                                }}
                                className="hidden"
                                id="image-upload"
                            />
                            <label
                                htmlFor="image-upload"
                                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 gap-2 hover:border-primary cursor-pointer transition-colors bg-white/50 dark:bg-surface-highlight/50 group"
                            >
                                <span className="material-symbols-outlined !text-[32px] group-hover:text-primary transition">add_photo_alternate</span>
                                <span className="text-xs font-semibold">اضغط لإضافة صور (غير محدودة)</span>
                                <span className="text-[10px] text-slate-400">JPG,PNG,JPEG</span>
                            </label>

                            {/* Image Previews */}
                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-3">
                                    {formData.images.map((img, index) => (
                                        <div key={index} className="relative group aspect-square">
                                            <img
                                                src={URL.createObjectURL(img)}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = formData.images.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, images: newImages });
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg"
                                            >
                                                <span className="material-symbols-outlined !text-[16px]">close</span>
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1.5 rounded-b-lg opacity-0 group-hover:opacity-100 transition">
                                                <p className="text-[10px] text-white truncate">{img.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Video Upload Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined !text-[18px] text-primary">videocam</span>
                                فيديو (اختياري)
                            </label>

                            <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setFormData({ ...formData, videos: [file] });
                                    }
                                }}
                                className="hidden"
                                id="video-upload"
                            />

                            {formData.videos.length === 0 ? (
                                <label
                                    htmlFor="video-upload"
                                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 gap-2 hover:border-primary cursor-pointer transition-colors bg-white/50 dark:bg-surface-highlight/50 group"
                                >
                                    <span className="material-symbols-outlined !text-[32px] group-hover:text-primary transition">videocam</span>
                                    <span className="text-xs font-semibold">اضغط لإضافة فيديو</span>
                                    <span className="text-[10px] text-slate-400">MP4, MOV - Max 50MB</span>
                                </label>
                            ) : (
                                <div className="relative rounded-xl overflow-hidden bg-black group">
                                    <video
                                        src={URL.createObjectURL(formData.videos[0])}
                                        controls
                                        className="w-full rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, videos: [] })}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition shadow-lg"
                                    >
                                        <span className="material-symbols-outlined !text-[20px]">delete</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Terms & Conditions Section */}
                        <div className="space-y-3 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                            <div className="flex gap-2">
                                <span className="material-symbols-outlined !text-[20px] text-amber-600">description</span>
                                <div className="flex-1">
                                    <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm">
                                        الأحكام والشروط
                                    </h4>
                                    <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                                        ⚠️ يجب الاطلاع على جميع الأحكام والشروط قبل المتابعة
                                    </p>
                                </div>
                            </div>

                            {/* Upload Terms Files */}
                            <div>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                    multiple
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        setFormData({ ...formData, termsFiles: [...formData.termsFiles, ...files] });
                                    }}
                                    className="hidden"
                                    id="terms-upload"
                                />
                                <label
                                    htmlFor="terms-upload"
                                    className="w-full border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-3 flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
                                >
                                    <span className="material-symbols-outlined !text-[18px]">upload_file</span>
                                    <span className="text-xs font-semibold">إرفاق ملفات (PDF, Word, PowerPoint)</span>
                                </label>

                                {/* Uploaded Files List */}
                                {formData.termsFiles.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        {formData.termsFiles.map((file, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-white dark:bg-surface-dark p-2 rounded-lg">
                                                <span className="material-symbols-outlined text-amber-600 !text-[18px]">description</span>
                                                <span className="text-xs flex-1 truncate">{file.name}</span>
                                                <span className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(0)} KB</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newFiles = formData.termsFiles.filter((_, i) => i !== index);
                                                        setFormData({ ...formData, termsFiles: newFiles });
                                                    }}
                                                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded p-1"
                                                >
                                                    <span className="material-symbols-outlined !text-[16px]">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Acceptance Checkbox */}
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.acceptedTerms}
                                    onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                                    className="mt-0.5 w-5 h-5 rounded border-amber-400 text-primary focus:ring-primary"
                                />
                                <span className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                                    أقر بأنني اطلعت على جميع الأحكام والشروط وأوافق عليها
                                </span>
                            </label>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white">
                                ملاحظات (اختياري)
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="أي ملاحظات إضافية ترغب في إضافتها..."
                                rows={4}
                                className="w-full bg-white dark:bg-surface-highlight border-none rounded-xl py-4 px-4 shadow-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3 items-start border border-blue-100 dark:border-blue-800/50">
                            <span className="material-symbols-outlined text-blue-500">info</span>
                            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                                نصيحة: تعيين سعر بداية منخفض يجذب المزيد من المزايدين ويشعل المنافسة.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white">سعر بداية المزاد</label>
                            <div className="grid grid-cols-3 gap-2">
                                {/* Price Amount */}
                                <input
                                    type="number"
                                    value={formData.startingBidAmount}
                                    onChange={(e) => setFormData({ ...formData, startingBidAmount: e.target.value })}
                                    placeholder="السعر"
                                    className="bg-white dark:bg-surface-highlight border-none rounded-xl py-4 px-4 shadow-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-white font-mono text-lg"
                                />

                                {/* Unit Selector */}
                                <div className="relative">
                                    <select
                                        value={formData.startingBidUnit}
                                        onChange={(e) => setFormData({ ...formData, startingBidUnit: e.target.value as "kg" | "ton" | "piece" | "total" | "L" | "m2" | "m3" | "dunum" | "hectare" })}
                                        className="w-full h-full appearance-none rounded-xl bg-white dark:bg-surface-highlight border-none px-3 pl-8 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                    >
                                        <option value="kg">كيلو</option>
                                        <option value="ton">طن</option>
                                        <option value="piece">قطعة</option>
                                        <option value="total">كامل الكمية</option>
                                        <option value="L">L</option>
                                        <option value="m2">m²</option>
                                        <option value="m3">m³</option>
                                        <option value="dunum">دونم</option>
                                        <option value="hectare">هكتار</option>
                                    </select>
                                    <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                                        <span className="material-symbols-outlined !text-[16px]">expand_more</span>
                                    </div>
                                </div>

                                {/* Currency Selector */}
                                <div className="relative">
                                    <select
                                        value={formData.startingBidCurrency}
                                        onChange={(e) => setFormData({ ...formData, startingBidCurrency: e.target.value as "SYP" | "USD" })}
                                        className="w-full h-full appearance-none rounded-xl bg-white dark:bg-surface-highlight border-none px-3 pl-8 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                    >
                                        <option value="SYP">SYP</option>
                                        <option value="USD">$</option>
                                    </select>
                                    <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                                        <span className="material-symbols-outlined !text-[16px]">expand_more</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white">سعر البيع المباشر (اختياري)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {/* Price Amount */}
                                <input
                                    type="number"
                                    value={formData.buyNowPriceAmount}
                                    onChange={(e) => setFormData({ ...formData, buyNowPriceAmount: e.target.value })}
                                    placeholder="السعر"
                                    className="bg-white dark:bg-surface-highlight border-none rounded-xl py-4 px-4 shadow-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-white font-mono text-lg"
                                />

                                {/* Unit Selector */}
                                <div className="relative">
                                    <select
                                        value={formData.buyNowPriceUnit}
                                        onChange={(e) => setFormData({ ...formData, buyNowPriceUnit: e.target.value as "kg" | "ton" | "piece" | "total" | "L" | "m2" | "m3" | "dunum" | "hectare" })}
                                        className="w-full h-full appearance-none rounded-xl bg-white dark:bg-surface-highlight border-none px-3 pl-8 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                    >
                                        <option value="kg">كيلو</option>
                                        <option value="ton">طن</option>
                                        <option value="piece">قطعة</option>
                                        <option value="total">كامل الكمية</option>
                                        <option value="L">L</option>
                                        <option value="m2">m²</option>
                                        <option value="m3">m³</option>
                                        <option value="dunum">دونم</option>
                                        <option value="hectare">هكتار</option>
                                    </select>
                                    <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                                        <span className="material-symbols-outlined !text-[16px]">expand_more</span>
                                    </div>
                                </div>

                                {/* Currency Selector */}
                                <div className="relative">
                                    <select
                                        value={formData.buyNowPriceCurrency}
                                        onChange={(e) => setFormData({ ...formData, buyNowPriceCurrency: e.target.value as "SYP" | "USD" })}
                                        className="w-full h-full appearance-none rounded-xl bg-white dark:bg-surface-highlight border-none px-3 pl-8 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                    >
                                        <option value="SYP">SYP</option>
                                        <option value="USD">$</option>
                                    </select>
                                    <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                                        <span className="material-symbols-outlined !text-[16px]">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500">السعر الذي ينتهي المزاد عنده فوراً إذا قدمه أحد المشترين</p>
                        </div>

                        {/* Auction Duration */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white">مدة المزاد</label>
                            <div className="relative">
                                <select
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    className="w-full h-14 appearance-none rounded-xl bg-white dark:bg-surface-highlight border-none shadow-sm py-4 px-4 pl-10 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                >
                                    <option value="1">1 ساعة</option>
                                    <option value="4">4 ساعات</option>
                                    <option value="6">6 ساعات</option>
                                    <option value="12">12 ساعة</option>
                                    <option value="24">24 ساعة</option>
                                    <option value="48">48 ساعة</option>
                                    <option value="72">72 ساعة</option>
                                    <option value="168">أسبوع</option>
                                </select>
                                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <span className="material-symbols-outlined !text-[20px]">expand_more</span>
                                </div>
                            </div>
                        </div>

                        {/* Start Date & Time */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined !text-[18px]">event</span>
                                تاريخ ووقت البدء
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="bg-white dark:bg-surface-highlight border-none rounded-xl py-3 px-4 shadow-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
                                />
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    placeholder="12:00"
                                    className="bg-white dark:bg-surface-highlight border-none rounded-xl py-3 px-4 shadow-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-white font-english"
                                />
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <span className="material-symbols-outlined !text-[12px]">info</span>
                                سيبدأ المزاد في التاريخ والوقت المحدد
                            </p>
                        </div>

                        {/* Security Deposit Section */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined !text-[18px] text-amber-600">verified_user</span>
                                قيمة التأمين
                            </label>

                            {/* Security Deposit Amount */}
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    value={formData.securityDepositAmount}
                                    onChange={(e) => setFormData({ ...formData, securityDepositAmount: e.target.value })}
                                    placeholder="القيمة"
                                    className="bg-white dark:bg-surface-highlight border-none rounded-xl py-4 px-4 shadow-sm focus:ring-2 focus:ring-amber-600 text-slate-900 dark:text-white font-mono text-lg"
                                />

                                <div className="relative">
                                    <select
                                        value={formData.securityDepositCurrency}
                                        onChange={(e) => setFormData({ ...formData, securityDepositCurrency: e.target.value as "SYP" | "USD" })}
                                        className="w-full h-full appearance-none rounded-xl bg-white dark:bg-surface-highlight border-none px-3 pl-8 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-600 outline-none cursor-pointer"
                                    >
                                        <option value="SYP">SYP</option>
                                        <option value="USD">$</option>
                                    </select>
                                    <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                                        <span className="material-symbols-outlined !text-[16px]">expand_more</span>
                                    </div>
                                </div>
                            </div>

                            {/* Private Auction Warnings */}
                            {formData.auctionType === "private" && (
                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex gap-3 items-start">
                                        <span className="material-symbols-outlined text-red-600 !text-[24px]">warning</span>
                                        <div className="flex-1 space-y-2">
                                            <p className="text-sm font-bold text-red-900 dark:text-red-200">⚠️ سياسة التأمينات الصارمة</p>
                                            <ul className="text-xs text-red-800 dark:text-red-300 space-y-1 list-disc list-inside">
                                                <li>يدفع <strong>البائع والمشتري</strong> قيمة التأمين</li>
                                                <li>أي تخلف في الاستلام أو التسليم → <strong>فقدان التأمين</strong></li>
                                                <li>تجاوز مدة الترحيل → <strong>فقدان التأمين</strong></li>
                                                <li>التأمين المفقود يذهب للطرف الآخر</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Government Auction Info */}
                            {formData.auctionType === "government" && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                                        <div className="flex gap-3 items-start">
                                            <span className="material-symbols-outlined text-green-600 !text-[24px]">info</span>
                                            <div className="flex-1 space-y-2">
                                                <p className="text-sm font-bold text-green-900 dark:text-green-200">ℹ️ تأمينات المزادات الحكومية</p>
                                                <ul className="text-xs text-green-800 dark:text-green-300 space-y-1 list-disc list-inside">
                                                    <li><strong>الجهة المعلنة معفاة</strong> من التأمين</li>
                                                    <li><strong>المشتري فقط</strong> يدفع التأمين</li>
                                                    <li>التأمين يبقى وديعة حتى انتهاء الترحيل</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">طريقة دفع التأمين</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, securityDepositPaymentMethod: "platform" })}
                                                className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all ${formData.securityDepositPaymentMethod === "platform"
                                                    ? "bg-green-50 dark:bg-green-900/20 border-green-600 text-green-700 dark:text-green-300"
                                                    : "bg-white dark:bg-surface-highlight border-slate-200 dark:border-slate-700 text-slate-600 hover:border-green-600/30"
                                                    }`}
                                            >
                                                للمنصة (وديعة)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, securityDepositPaymentMethod: "direct" })}
                                                className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all ${formData.securityDepositPaymentMethod === "direct"
                                                    ? "bg-green-50 dark:bg-green-900/20 border-green-600 text-green-700 dark:text-green-300"
                                                    : "bg-white dark:bg-surface-highlight border-slate-200 dark:border-slate-700 text-slate-600 hover:border-green-600/30"
                                                    }`}
                                            >
                                                للجهة + إيصال
                                            </button>
                                        </div>
                                        {formData.securityDepositPaymentMethod === "direct" && (
                                            <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-in fade-in">
                                                <span className="material-symbols-outlined !text-[12px]">upload_file</span>
                                                يجب رفع إيصال الدفع قبل المشاركة في المزاد
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Shipment Duration */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined !text-[18px] text-indigo-600">local_shipping</span>
                                مدة الترحيل (بالأيام)
                            </label>
                            <input
                                type="number"
                                value={formData.shipmentDurationDays}
                                onChange={(e) => setFormData({ ...formData, shipmentDurationDays: e.target.value })}
                                placeholder="عدد الأيام"
                                className="w-full bg-white dark:bg-surface-highlight border-none rounded-xl py-4 px-4 shadow-sm focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-white font-mono text-lg"
                            />
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed flex items-start gap-2">
                                    <span className="material-symbols-outlined !text-[16px] mt-0.5">schedule</span>
                                    <span>
                                        تبدأ المدة من <strong>اليوم التالي للفوز</strong> •
                                        سيظهر <strong>عداد تنازلي</strong> في لوحة تحكم المشتري •
                                        عند انتهاء الترحيل يؤكد المعلن <strong>براءة الذمة</strong> برمز أمان (SMS أو Email)
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* End Date & Time Display (calculated) */}
                        {formData.startDate && formData.startTime && formData.duration && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-green-600 !text-[24px]">schedule</span>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-green-800 dark:text-green-300 text-sm mb-1">
                                            تنتهي المزايدة تلقائياً
                                        </h4>
                                        <p className="text-xs text-green-700 dark:text-green-400">
                                            بعد <span className="font-bold font-english">{formData.duration}</span> ساعة من البدء
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-500 mt-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined !text-[12px]">notifications_active</span>
                                            سيتم إرسال إشعار للفائز بأعلى سعر تلقائياً
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">مراجعة قبل النشر</h3>

                        {/* Product Image Preview */}
                        {formData.images && formData.images.length > 0 && (
                            <div className="bg-white dark:bg-surface-highlight rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700/50">
                                <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative">
                                    <img
                                        src={URL.createObjectURL(formData.images[0])}
                                        alt="معاينة المنتج"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                        <span className="material-symbols-outlined !text-[16px] text-white">photo_library</span>
                                        <span className="text-xs text-white font-bold">{formData.images.length} صورة</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Auction Title & Type */}
                        <div className="bg-white dark:bg-surface-highlight rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 space-y-3">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">عنوان المزاد</p>
                                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{formData.title || "بدون عنوان"}</h4>
                            </div>

                            <div className="flex items-center gap-2">
                                <p className="text-xs text-slate-500">نوع المزاد:</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${formData.auctionType === "government"
                                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                    : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                    }`}>
                                    {formData.auctionType === "government" ? "حكومي" : "خاص"}
                                </span>
                            </div>

                            {formData.auctionType === "government" && formData.organization && (
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">الجهة المعلنة</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {formData.organization === "other" ? formData.customOrganization : formData.organization}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Materials Details */}
                        <div className="bg-white dark:bg-surface-highlight rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 space-y-3">
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined !text-[18px] text-primary">inventory_2</span>
                                المواد ({formData.materials.length})
                            </h5>
                            <div className="space-y-2">
                                {formData.materials.map((material, index) => (
                                    <div key={material.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                {(material.type === "other" || material.type === "أخرى") ? material.customType : material.type || "غير محدد"}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${material.isAccurate
                                                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                                : "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                                                }`}>
                                                {material.isAccurate ? "دقيق" : "تقريباً"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined !text-[14px]">scale</span>
                                                {material.weight || "0"} {material.unit === "kg" ? "كغ" : material.unit === "ton" ? "طن" : material.unit === "piece" ? "قطعة" : material.unit === "total" ? "كامل الكمية" : material.unit === "L" ? "L" : material.unit === "m2" ? "m²" : material.unit === "m3" ? "m³" : material.unit === "dunum" ? "دونم" : "هكتار"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Location */}
                        <div className="bg-white dark:bg-surface-highlight rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined !text-[18px] text-primary">location_on</span>
                                الموقع
                            </h5>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{formData.governorate}</p>
                            {formData.address && (
                                <p className="text-xs text-slate-500 mt-1">{formData.address}</p>
                            )}
                        </div>

                        {/* Pricing Details */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800 space-y-3">
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined !text-[18px] text-indigo-600">payments</span>
                                التسعير
                            </h5>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/60 dark:bg-slate-800/50 rounded-lg p-3">
                                    <p className="text-[10px] text-slate-500 mb-1">سعر البداية</p>
                                    <p className="text-xl font-bold text-indigo-600 font-mono">
                                        {formData.startingBidAmount || "0"} {formData.startingBidCurrency === "SYP" ? "SYP" : "$"}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                        {formData.startingBidUnit === "kg" ? "كيلو" : formData.startingBidUnit === "ton" ? "طن" : formData.startingBidUnit === "piece" ? "قطعة" : formData.startingBidUnit === "total" ? "كامل الكمية" : formData.startingBidUnit === "L" ? "L" : formData.startingBidUnit === "m2" ? "m²" : formData.startingBidUnit === "m3" ? "m³" : formData.startingBidUnit === "dunum" ? "دونم" : "هكتار"}
                                    </p>
                                </div>

                                {formData.buyNowPriceAmount && (
                                    <div className="bg-white/60 dark:bg-slate-800/50 rounded-lg p-3">
                                        <p className="text-[10px] text-slate-500 mb-1">البيع المباشر</p>
                                        <p className="text-xl font-bold text-green-600 font-mono">
                                            {formData.buyNowPriceAmount} {formData.buyNowPriceCurrency === "SYP" ? "SYP" : "$"}
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                            {formData.buyNowPriceUnit === "kg" ? "كيلو" : formData.buyNowPriceUnit === "ton" ? "طن" : formData.buyNowPriceUnit === "piece" ? "قطعة" : formData.buyNowPriceUnit === "total" ? "كامل الكمية" : formData.buyNowPriceUnit === "L" ? "L" : formData.buyNowPriceUnit === "m2" ? "m²" : formData.buyNowPriceUnit === "m3" ? "m³" : formData.buyNowPriceUnit === "dunum" ? "دونم" : "هكتار"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Security Deposit */}
                        {formData.securityDepositAmount && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 space-y-2">
                                <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined !text-[18px] text-amber-600">verified_user</span>
                                    التأمين
                                </h5>
                                <p className="text-lg font-bold text-amber-600 font-mono">
                                    {formData.securityDepositAmount} {formData.securityDepositCurrency === "SYP" ? "SYP" : "$"}
                                </p>
                                {formData.auctionType === "government" && (
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        طريقة الدفع: {formData.securityDepositPaymentMethod === "platform" ? "للمنصة (وديعة)" : "للجهة + إيصال"}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Auction Duration & Timing */}
                        <div className="bg-white dark:bg-surface-highlight rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 space-y-3">
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined !text-[18px] text-primary">schedule</span>
                                المدة والتوقيت
                            </h5>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">مدة المزاد</p>
                                    <p className="font-bold text-slate-900 dark:text-white">
                                        {formData.duration === "1" ? "1 ساعة" :
                                            formData.duration === "4" ? "4 ساعات" :
                                                formData.duration === "6" ? "6 ساعات" :
                                                    formData.duration === "12" ? "12 ساعة" :
                                                        formData.duration === "24" ? "24 ساعة" :
                                                            formData.duration === "48" ? "48 ساعة" :
                                                                formData.duration === "72" ? "72 ساعة" :
                                                                    formData.duration === "168" ? "أسبوع" : formData.duration + " ساعة"}
                                    </p>
                                </div>

                                {formData.shipmentDurationDays && (
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">مدة الترحيل</p>
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            {formData.shipmentDurationDays} يوم
                                        </p>
                                    </div>
                                )}
                            </div>

                            {formData.startDate && formData.startTime && (
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">يبدأ في</p>
                                    <p className="font-bold text-slate-900 dark:text-white">
                                        {formData.startDate} • {formData.startTime}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Preview Settings */}
                        {formData.allowPreview && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                <h5 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined !text-[18px] text-blue-600">visibility</span>
                                    المعاينة مفعّلة
                                </h5>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    من {formData.previewStartDate} {formData.previewStartTime} إلى {formData.previewEndDate} {formData.previewEndTime}
                                </p>
                            </div>
                        )}

                        {/* Notes */}
                        {formData.notes && (
                            <div className="bg-white dark:bg-surface-highlight rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                <h5 className="text-sm font-bold text-slate-900 dark:text-white mb-2">ملاحظات</h5>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{formData.notes}</p>
                            </div>
                        )}

                        {/* Confirmation Checkbox */}
                        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/20">
                            <input type="checkbox" className="mt-1 rounded border-slate-300 text-primary focus:ring-primary" id="confirm" />
                            <label htmlFor="confirm" className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer">
                                أقر بأن المعلومات المذكورة أعلاه صحيحة، وأنني أتحمل المسؤولية الكاملة عن وزن وجودة البضاعة المعروضة.
                            </label>
                        </div>
                    </div>
                )}
            </main>

            {/* Sticky Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-bg-dark border-t border-slate-200 dark:border-slate-800 flex gap-3 max-w-md mx-auto z-20">
                {step > 1 && (
                    <button
                        onClick={handleBack}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        سابق
                    </button>
                )}
                <button
                    onClick={step === 3 ? handleSubmit : handleNext}
                    className="flex-[2] bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                >
                    {step === 3 ? "نشر المزاد" : "تا بع"}
                    <span className="material-symbols-outlined !text-[20px] rtl:-scale-x-100">arrow_right_alt</span>
                </button>
            </div>
        </div>
    );
}
