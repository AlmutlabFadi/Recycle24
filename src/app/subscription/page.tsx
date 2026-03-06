"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Package {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    benefits: string[];
    isActive: boolean;
}

export default function SubscriptionPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const res = await fetch("/api/subscriptions/packages");
                const data = await res.json();
                if (data.success) {
                    setPackages(data.packages);
                    if (data.packages.length > 0) {
                        setSelectedPkgId(data.packages[0].id);
                    }
                }
            } catch (error) {
                console.error("Error fetching packages:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, []);

    const getDisplayPrice = (price: number) => {
        if (billingCycle === "yearly") {
            return Math.floor(price * 12 * 0.8); // 20% discount
        }
        return price;
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="خطط الاشتراك" />

            <main className="flex-1 p-4 pb-24">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">اختر خطتك الاحترافية</h1>
                    <p className="text-slate-400">ارتقِ بتجارتك مع مميزات حصرية من خلال باقاتنا المطورة</p>
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
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mx-auto"></div>
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined !text-5xl text-slate-700 mb-4 flex justify-center">inventory_2</span>
                            <p className="text-slate-400">لا توجد باقات اشتراك متاحة حالياً.</p>
                        </div>
                    ) : packages.map((pkg) => (
                        <div
                            key={pkg.id}
                            onClick={() => setSelectedPkgId(pkg.id)}
                            className={`relative rounded-2xl border-2 transition-all cursor-pointer ${
                                selectedPkgId === pkg.id
                                    ? "border-primary bg-primary/5"
                                    : "border-slate-700 bg-surface-highlight hover:border-slate-600"
                            }`}
                        >
                            <div className="p-5">
                                {/* Plan Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                                        <p className="text-sm text-slate-400">{pkg.durationDays} يوم من المميزات</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary italic">
                                            {pkg.price === 0 ? "مجاني" : `${getDisplayPrice(pkg.price).toLocaleString()} ل.س`}
                                        </div>
                                        <div className="text-xs text-slate-500">{billingCycle === "monthly" ? "شهرياً" : "سنوياً"}</div>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="space-y-2 mb-4">
                                    {pkg.benefits.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                            <span className="material-symbols-outlined text-green-500 !text-[18px]">
                                                check_circle
                                            </span>
                                            {feature}
                                        </div>
                                    ))}
                                </div>

                                {/* Selection */}
                                <div className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                                    selectedPkgId === pkg.id
                                        ? "bg-primary text-white"
                                        : "bg-slate-700 text-slate-300"
                                }`}>
                                    {selectedPkgId === pkg.id ? (
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

                {/* Help Link */}
                <div className="mt-8 text-center text-xs text-slate-500 px-6">
                    <p className="mb-2">بالمتابعة فإنك توافق على شروط الخدمة وسياسة الخصوصية.</p>
                    <Link href="/help" className="text-primary hover:underline">
                        لديك أسئلة؟ زر مركز المساعدة
                    </Link>
                </div>
            </main>

            {/* Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 bg-surface-dark border-t border-slate-800 p-4 pb-safe z-50">
                <div className="max-w-md mx-auto">
                    <Link
                        href={`/subscription/payment?packageId=${selectedPkgId}&cycle=${billingCycle}`}
                        className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg bg-primary text-white hover:bg-primary-dark active:scale-[0.98] transition-all ${!selectedPkgId ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <span>متابعة للدفع</span>
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

