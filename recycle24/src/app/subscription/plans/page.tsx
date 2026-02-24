"use client";

import { useState } from "react";

import HeaderWithBack from "@/components/HeaderWithBack";

interface Plan {
    id: string;
    name: string;
    price: number;
    priceYearly: number;
    currency: string;
    usdPrice: string;
    isRecommended?: boolean;
    features: { icon: string; text: string }[];
}

export default function SubscriptionPlansPage() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

    const plans: Plan[] = [
        {
            id: "silver",
            name: "التاجر الفضي",
            price: 500000,
            priceYearly: 400000,
            currency: "ل.س",
            usdPrice: "$35",
            features: [
                { icon: "analytics", text: "تحليلات أساسية" },
                { icon: "gavel", text: "٥٠ مزاد" },
                { icon: "support_agent", text: "دعم فني عبر البريد" },
            ],
        },
        {
            id: "gold",
            name: "المصنع الذهبي",
            price: 1500000,
            priceYearly: 1200000,
            currency: "ل.س",
            usdPrice: "$100",
            isRecommended: true,
            features: [
                { icon: "check_circle", text: "تحليلات Metalix24 المتقدمة" },
                { icon: "check_circle", text: "مزادات غير محدودة" },
                { icon: "check_circle", text: "شارة موثقة \"Verified\"" },
                { icon: "check_circle", text: "عقود رقمية ذكية" },
            ],
        },
        {
            id: "giant",
            name: "العملاق الصناعي",
            price: 4500000,
            priceYearly: 3600000,
            currency: "ل.س",
            usdPrice: "$300",
            features: [
                { icon: "account_balance", text: "مناقصات حكومية حصرية" },
                { icon: "manage_accounts", text: "مدير حساب خاص" },
                { icon: "api", text: "وصول API كامل" },
                { icon: "star", text: "أولوية قصوى للدعم" },
            ],
        },
    ];

    const formatPrice = (price: number) => {
        return price.toLocaleString("ar-SA");
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="باقات الأعمال" />

            <main className="flex-1 flex flex-col pb-8">
                <div className="px-4 py-6 sticky top-0 z-40 bg-background-dark/95 backdrop-blur">
                    <div className="flex h-12 w-full items-center justify-center rounded-xl bg-surface-dark p-1">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={`flex h-full flex-1 items-center justify-center rounded-lg px-2 transition-all duration-200 ${
                                billingCycle === "monthly"
                                    ? "bg-background-dark text-white shadow-sm"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            <span className="text-sm font-bold truncate">شهري</span>
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={`flex h-full flex-1 items-center justify-center rounded-lg px-2 transition-all duration-200 ${
                                billingCycle === "yearly"
                                    ? "bg-background-dark text-primary shadow-sm"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            <span className="text-sm font-bold truncate">سنوي (وفر ٢٠٪)</span>
                        </button>
                    </div>
                </div>

                <div className="px-4 pb-2 text-center">
                    <h1 className="text-white tracking-tight text-[26px] font-bold leading-tight mb-2">
                        اختر الخطة المناسبة لعملك
                    </h1>
                    <p className="text-slate-400 text-sm">وسع عمليات إعادة التدوير الخاصة بك مع أدوات متميزة</p>
                </div>

                <div className="flex flex-col gap-5 px-4 py-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative flex flex-col gap-4 rounded-2xl p-6 transition-transform active:scale-[0.98] ${
                                plan.isRecommended
                                    ? "border-2 border-primary shadow-[0_0_30px_-10px_rgba(19,91,236,0.3)] scale-[1.02] z-10"
                                    : "border border-slate-700"
                            } bg-surface-dark`}
                        >
                            {plan.isRecommended && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                    الأكثر طلباً
                                </div>
                            )}

                            <div className={`flex flex-col gap-2 ${plan.isRecommended ? "pt-2" : ""}`}>
                                <h3 className={`text-base font-bold leading-tight ${plan.isRecommended ? "text-primary" : "text-slate-300"}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex flex-col">
                                    <span className="text-white text-3xl font-black leading-tight tracking-tight">
                                        {formatPrice(billingCycle === "monthly" ? plan.price : plan.priceYearly)} ل.س
                                    </span>
                                    <span className="text-slate-400 text-sm font-medium">
                                        / {billingCycle === "monthly" ? "شهر" : "سنة"} ({plan.usdPrice})
                                    </span>
                                </div>
                            </div>

                            <button
                                className={`w-full flex items-center justify-center rounded-xl h-11 px-4 text-sm font-bold tracking-wide transition-all gap-2 ${
                                    plan.isRecommended
                                        ? "bg-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                                        : "bg-slate-700 hover:bg-slate-600 text-white"
                                }`}
                            >
                                <span>ترقية الآن</span>
                                {plan.isRecommended && (
                                    <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                                )}
                            </button>

                            <div className="h-px bg-slate-700/50 my-1"></div>

                            <div className="flex flex-col gap-3">
                                {plan.features.map((feature, idx) => (
                                    <div
                                        key={idx}
                                        className={`text-[13px] font-medium flex items-center gap-3 ${
                                            plan.isRecommended ? "text-white" : "text-slate-200"
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined text-[20px] ${plan.isRecommended ? "text-green-400" : "text-primary"}`}>
                                            {feature.icon}
                                        </span>
                                        {feature.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3 px-4 mt-2">
                    <div className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-surface-dark p-4 items-center text-center">
                        <div className="text-green-400 bg-green-400/10 p-2 rounded-full mb-1">
                            <span className="material-symbols-outlined text-[24px]">verified_user</span>
                        </div>
                        <h2 className="text-white text-xs font-bold leading-tight">دفع آمن ١٠٠٪</h2>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-surface-dark p-4 items-center text-center">
                        <div className="text-blue-400 bg-blue-400/10 p-2 rounded-full mb-1">
                            <span className="material-symbols-outlined text-[24px]">support_agent</span>
                        </div>
                        <h2 className="text-white text-xs font-bold leading-tight">دعم شركات ٢٤/٧</h2>
                    </div>
                </div>
            </main>
        </div>
    );
}
