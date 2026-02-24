"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

interface TransportFormData {
    materialType: string;
    materialTypeOther: string;
    weight: string;
    pickupAddress: string;
    pickupGovernorate: string;
    deliveryAddress: string;
    deliveryGovernorate: string;
    pickupDate: string;
    notes: string;
    pricingType: "per_ton" | "full_vehicle" | "";
}

const governorates = [
    "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "اللاذقية", "طرطوس",
    "إدلب", "الحسكة", "دير الزور", "الرقة", "درعا", "السويداء", "القنيطرة"
];

const materialTypes = [
    { id: "metals", name: "معادن", icon: "precision_manufacturing" },
    { id: "iron", name: "حديد", icon: "construction" },
    { id: "plastic", name: "بلاستيك", icon: "recycling" },
    { id: "rebar", name: "حديد إنشائات", icon: "domain" },
    { id: "cement", name: "أسمنت", icon: "foundation" },
    { id: "other", name: "أخرى", icon: "more_horiz" },
];

const pricingTypes = [
    {
        id: "per_ton",
        name: "أجرة الطن",
        description: "استقبال عروض على سعر نقل الطن الواحد",
        icon: "scale"
    },
    {
        id: "full_vehicle",
        name: "أجرة السيارة كاملة",
        description: "استقبال عروض على أجرة السيارة بالكامل",
        icon: "local_shipping"
    },
];

export default function BookTransportPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [publishedRequestId, setPublishedRequestId] = useState<string | null>(null);
    const [formData, setFormData] = useState<TransportFormData>({
        materialType: "",
        materialTypeOther: "",
        weight: "",
        pickupAddress: "",
        pickupGovernorate: "",
        deliveryAddress: "",
        deliveryGovernorate: "",
        pickupDate: "",
        notes: "",
        pricingType: "",
    });

    const updateForm = (field: keyof TransportFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/transport/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    materialType: formData.materialType === "other" ? formData.materialTypeOther : formData.materialType,
                    weight: formData.weight,
                    pickupAddress: formData.pickupAddress,
                    pickupGovernorate: formData.pickupGovernorate,
                    deliveryAddress: formData.deliveryAddress,
                    deliveryGovernorate: formData.deliveryGovernorate,
                    pickupDate: formData.pickupDate,
                    notes: formData.notes,
                    pricingType: formData.pricingType,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setPublishedRequestId(data.booking?.id || `REQ-${Date.now().toString(36).toUpperCase()}`);
                setStep(4);
            } else {
                addToast(data.error || "حدث خطأ", "error");
            }
        } catch {
            addToast("حدث خطأ أثناء نشر الطلب", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 1:
                if (!formData.materialType) return false;
                if (formData.materialType === "other" && !formData.materialTypeOther.trim()) return false;
                if (!formData.weight || parseFloat(formData.weight) <= 0) return false;
                if (!formData.pricingType) return false;
                return true;
            case 2:
                if (!formData.pickupGovernorate || !formData.pickupAddress.trim()) return false;
                if (!formData.deliveryGovernorate || !formData.deliveryAddress.trim()) return false;
                return true;
            default:
                return true;
        }
    };

    if (step === 4) {
        return (
            <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
                <HeaderWithBack title="تم النشر" />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">تم نشر طلبك بنجاح!</h2>
                    <p className="text-slate-400 text-sm mb-2">رقم الطلب: <span className="text-primary font-bold">{publishedRequestId}</span></p>
                    <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 mb-6 max-w-sm w-full">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="material-symbols-outlined text-primary text-2xl">notifications_active</span>
                            <span className="text-sm text-white font-medium">ماذا الآن؟</span>
                        </div>
                        <ul className="text-xs text-slate-400 space-y-2 text-right">
                            <li className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-primary text-sm mt-0.5">check</span>
                                <span>سيتلقى السائقون إشعاراً بطلبك</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-primary text-sm mt-0.5">check</span>
                                <span>ستصلك العروض والمفاوضات</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-primary text-sm mt-0.5">check</span>
                                <span>اختر العرض المناسب وأكد الحجز</span>
                            </li>
                        </ul>
                    </div>
                    <div className="w-full max-w-sm space-y-3">
                        <button
                            onClick={() => router.push("/transport/orders")}
                            className="w-full py-3 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">visibility</span>
                            عرض طلباتي
                        </button>
                        <button
                            onClick={() => {
                                setStep(1);
                                setFormData({
                                    materialType: "",
                                    materialTypeOther: "",
                                    weight: "",
                                    pickupAddress: "",
                                    pickupGovernorate: "",
                                    deliveryAddress: "",
                                    deliveryGovernorate: "",
                                    pickupDate: "",
                                    notes: "",
                                    pricingType: "",
                                });
                                setPublishedRequestId(null);
                            }}
                            className="w-full py-3 rounded-xl bg-slate-700 text-white font-bold"
                        >
                            نشر طلب جديد
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="طلب نقل جديد" />

            <div className="px-4 py-3 border-b border-slate-800">
                <div className="flex gap-2">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`flex-1 h-1 rounded-full ${s <= step ? "bg-primary" : "bg-slate-700"}`}
                        />
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                    <span>الشحنة</span>
                    <span>العنوان</span>
                    <span>التأكيد</span>
                </div>
            </div>

            <main className="flex-1 p-4 flex flex-col gap-4 pb-24">
                {step === 1 && (
                    <>
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">category</span>
                                نوع المادة
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                {materialTypes.map((mat) => (
                                    <button
                                        key={mat.id}
                                        onClick={() => updateForm("materialType", mat.id)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition ${
                                            formData.materialType === mat.id
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-slate-700 text-slate-300 hover:border-slate-600"
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">{mat.icon}</span>
                                        <span className="text-xs">{mat.name}</span>
                                    </button>
                                ))}
                            </div>
                            
                            {formData.materialType === "other" && (
                                <div className="mt-3 animate-fadeIn">
                                    <input
                                        type="text"
                                        value={formData.materialTypeOther}
                                        onChange={(e) => updateForm("materialTypeOther", e.target.value)}
                                        placeholder="حدد نوع المادة..."
                                        className="w-full h-12 rounded-xl bg-bg-dark border border-slate-700 px-4 text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">scale</span>
                                الوزن (طن)
                            </h3>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.weight}
                                onChange={(e) => updateForm("weight", e.target.value)}
                                placeholder="أدخل الوزن بالطن"
                                className="w-full h-12 rounded-xl bg-bg-dark border border-slate-700 px-4 text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">payments</span>
                                طريقة التسعير
                            </h3>
                            <p className="text-xs text-slate-400 mb-3">
                                اختر كيف تريد استقبال العروض من الناقلين
                            </p>
                            <div className="flex flex-col gap-3">
                                {pricingTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => updateForm("pricingType", type.id)}
                                        className={`p-4 rounded-xl border text-right transition ${
                                            formData.pricingType === type.id
                                                ? "border-primary bg-primary/10"
                                                : "border-slate-700 hover:border-slate-600"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className={`material-symbols-outlined text-2xl ${
                                                formData.pricingType === type.id ? "text-primary" : "text-slate-400"
                                            }`}>
                                                {type.icon}
                                            </span>
                                            <div className="flex-1">
                                                <span className={`text-sm font-bold ${
                                                    formData.pricingType === type.id ? "text-primary" : "text-white"
                                                }`}>
                                                    {type.name}
                                                </span>
                                                <p className="text-xs text-slate-400 mt-1">{type.description}</p>
                                            </div>
                                            {formData.pricingType === type.id && (
                                                <span className="material-symbols-outlined text-primary">check_circle</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-primary"></span>
                                موقع الاستلام
                            </h3>
                            <div className="flex flex-col gap-3">
                                <select
                                    value={formData.pickupGovernorate}
                                    onChange={(e) => updateForm("pickupGovernorate", e.target.value)}
                                    className="h-12 rounded-xl bg-bg-dark border border-slate-700 px-4 text-white focus:border-primary focus:outline-none"
                                >
                                    <option value="">اختر المحافظة</option>
                                    {governorates.map((gov) => (
                                        <option key={gov} value={gov}>{gov}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={formData.pickupAddress}
                                    onChange={(e) => updateForm("pickupAddress", e.target.value)}
                                    placeholder="العنوان التفصيلي (المنطقة، الشارع، القرب)"
                                    className="h-12 rounded-xl bg-bg-dark border border-slate-700 px-4 text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                موقع التسليم
                            </h3>
                            <div className="flex flex-col gap-3">
                                <select
                                    value={formData.deliveryGovernorate}
                                    onChange={(e) => updateForm("deliveryGovernorate", e.target.value)}
                                    className="h-12 rounded-xl bg-bg-dark border border-slate-700 px-4 text-white focus:border-primary focus:outline-none"
                                >
                                    <option value="">اختر المحافظة</option>
                                    {governorates.map((gov) => (
                                        <option key={gov} value={gov}>{gov}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={formData.deliveryAddress}
                                    onChange={(e) => updateForm("deliveryAddress", e.target.value)}
                                    placeholder="العنوان التفصيلي (المنطقة، الشارع، القرب)"
                                    className="h-12 rounded-xl bg-bg-dark border border-slate-700 px-4 text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">calendar_month</span>
                                تاريخ الاستلام المتوقع
                            </h3>
                            <input
                                type="date"
                                value={formData.pickupDate}
                                onChange={(e) => updateForm("pickupDate", e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full h-12 rounded-xl bg-bg-dark border border-slate-700 px-4 text-white focus:border-primary focus:outline-none"
                            />
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">receipt_long</span>
                                ملخص الطلب
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                                    <span className="text-slate-400">نوع المادة</span>
                                    <span className="text-white font-medium">
                                        {formData.materialType === "other" 
                                            ? formData.materialTypeOther 
                                            : materialTypes.find(m => m.id === formData.materialType)?.name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                                    <span className="text-slate-400">الوزن</span>
                                    <span className="text-white font-medium">{formData.weight} طن</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                                    <span className="text-slate-400">طريقة التسعير</span>
                                    <span className="text-primary font-medium">
                                        {pricingTypes.find(t => t.id === formData.pricingType)?.name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                                    <span className="text-slate-400">من</span>
                                    <span className="text-white font-medium">{formData.pickupGovernorate}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                                    <span className="text-slate-400">إلى</span>
                                    <span className="text-white font-medium">{formData.deliveryGovernorate}</span>
                                </div>
                                {formData.pickupDate && (
                                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                                        <span className="text-slate-400">تاريخ الاستلام</span>
                                        <span className="text-white font-medium">
                                            {new Date(formData.pickupDate).toLocaleDateString("ar-SA")}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-4 border border-primary/20">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-primary text-2xl">info</span>
                                <span className="text-sm font-bold text-white">بعد النشر</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                سيتلقى السائقون والناقلون إشعاراً بطلبك. ستتمكن من مراجعة العروض المستلمة والمفاوضات واختيار الأنسب لك.
                            </p>
                        </div>

                        <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">edit_note</span>
                                ملاحظات إضافية (اختياري)
                            </h3>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => updateForm("notes", e.target.value)}
                                placeholder="أي تفاصيل إضافية عن الشحنة أو متطلبات خاصة..."
                                rows={3}
                                className="w-full rounded-xl bg-bg-dark border border-slate-700 px-4 py-3 text-white placeholder:text-slate-500 resize-none focus:border-primary focus:outline-none"
                            />
                        </div>
                    </>
                )}
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-dark border-t border-slate-800">
                <div className="flex gap-3">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-6 py-3 rounded-xl bg-slate-700 text-white font-bold"
                        >
                            السابق
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (step < 3) setStep(step + 1);
                            else handleSubmit();
                        }}
                        disabled={!isStepValid() || isSubmitting}
                        className="flex-1 py-3 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : step === 3 ? (
                            <>
                                <span className="material-symbols-outlined">publish</span>
                                نشر الطلب
                            </>
                        ) : (
                            "التالي"
                        )}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
