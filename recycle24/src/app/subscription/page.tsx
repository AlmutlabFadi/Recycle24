"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

const plans = [
    {
        id: "free",
        name: "مجاني",
        price: 0,
        period: "للأبد",
        description: "للمستخدمين العاديين",
        features: [
            "عرض الأسعار اليومية",
            "البحث عن المشترين",
            "3 صفقات شهرياً",
            "دعم عبر البريد",
        ],
        unavailableFeatures: [
            "المزادات الحصرية",
            "تقارير السوق",
            "دعم مباشر",
        ],
        popular: false,
    },
    {
        id: "pro",
        name: "احترافي",
        price: 25000,
        period: "شهرياً",
        description: "للتجار النشطين",
        features: [
            "كل مميزات الباقة المجانية",
            "صفقات غير محدودة",
            "المزادات الحصرية",
            "تقارير السوق الأسبوعية",
            "دعم مباشر via دردشة",
            "شارة تاجر موثق",
        ],
        unavailableFeatures: [],
        popular: true,
    },
    {
        id: "business",
        name: "أعمال",
        price: 75000,
        period: "شهرياً",
        description: "للشركات والمصانع",
        features: [
            "كل مميزات الباقة الاحترافية",
            "5 مستخدمين فرعيين",
            "API للربط",
            "تقارير السوق اليومية",
            "مدير حساب مخصص",
            "أولوية في الدعم",
            "تقارير مالية مفصلة",
        ],
        unavailableFeatures: [],
        popular: false,
    },
];

export default function SubscriptionPage() {
    const [selectedPlan, setSelectedPlan] = useState<string>("pro");
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="خطط الاشتراك" />

            <main className="flex-1 p-4 pb-24">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">اختر خطتك</h1>
                    <p className="text-slate-400">ارتقِ بتجارتك مع مميزات حصرية</p>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center mb-8">
                    <div className="bg-surface-highlight rounded-full p-1 flex">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-6 py-2 rounded-full font-medium transition-all ${
                                billingCycle === "monthly"
                                    ? "bg-primary text-white"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            شهري
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                                billingCycle === "yearly"
                                    ? "bg-primary text-white"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            سنوي
                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                وفّر 20%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Plans */}
                <div className="space-y-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`relative rounded-2xl border-2 transition-all cursor-pointer ${
                                selectedPlan === plan.id
                                    ? "border-primary bg-primary/5"
                                    : "border-slate-700 bg-surface-highlight hover:border-slate-600"
                            }`}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                                        الأكثر شيوعاً
                                    </span>
                                </div>
                            )}

                            <div className="p-5">
                                {/* Plan Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                        <p className="text-sm text-slate-400">{plan.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">
                                            {plan.price === 0 ? "مجاني" : `${plan.price.toLocaleString()} ل.س`}
                                        </div>
                                        <div className="text-xs text-slate-500">{plan.period}</div>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="space-y-2 mb-4">
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                            <span className="material-symbols-outlined text-green-500 !text-[18px]">
                                                check_circle
                                            </span>
                                            {feature}
                                        </div>
                                    ))}
                                    {plan.unavailableFeatures.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                            <span className="material-symbols-outlined !text-[18px]">close</span>
                                            {feature}
                                        </div>
                                    ))}
                                </div>

                                {/* Selection */}
                                <div className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                                    selectedPlan === plan.id
                                        ? "bg-primary text-white"
                                        : "bg-slate-700 text-slate-300"
                                }`}>
                                    {selectedPlan === plan.id ? (
                                        <>
                                            <span className="material-symbols-outlined">check_circle</span>
                                            <span>مختار</span>
                                        </>
                                    ) : (
                                        <span>اختر هذه الباقة</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FAQ Link */}
                <div className="mt-8 text-center">
                    <Link href="/help" className="text-primary hover:underline text-sm">
                        لديك أسئلة؟ زر مركز المساعدة
                    </Link>
                </div>
            </main>

            {/* Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 bg-surface-dark border-t border-slate-800 p-4 pb-safe">
                <div className="max-w-md mx-auto">
                    <Link
                        href={`/subscription/payment?plan=${selectedPlan}&cycle=${billingCycle}`}
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg bg-primary text-white hover:bg-primary-dark active:scale-[0.98] transition-all"
                    >
                        <span>متابعة للدفع</span>
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
