"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";

function PaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const packageId = searchParams.get("packageId");
    const billingCycle = searchParams.get("cycle") || "monthly";

    type SubscriptionPackage = {
        id: string;
        name: string;
        price: number;
        description?: string | null;
    };

    const [pkg, setPkg] = useState<SubscriptionPackage | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!packageId) {
            router.push("/subscription");
            return;
        }

        const fetchPackages = async () => {
            try {
                const res = await fetch("/api/subscriptions/packages");
                const data = await res.json();
                if (data.success) {
                    const packages = Array.isArray(data.packages)
                        ? (data.packages as SubscriptionPackage[])
                        : [];
                    const found = packages.find((p) => p.id === packageId);
                    if (found) {
                        setPkg(found);
                    } else {
                        setError("الباقة غير موجودة");
                    }
                }
            } catch (err) {
                setError("فشل تحميل بيانات الباقة");
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, [packageId, router]);

    const calculateTotal = () => {
        if (!pkg) return 0;
        if (billingCycle === "yearly") {
            return Math.floor(pkg.price * 12 * 0.8);
        }
        return pkg.price;
    };

    const handleConfirmPayment = async () => {
        setProcessing(true);
        setError("");
        try {
            const res = await fetch("/api/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageId, billingCycle }),
            });
            const data = await res.json();
            if (data.success) {
                router.push("/dashboard?notif=subscribed");
            } else {
                setError(data.error || "فشل إتمام عملية الدفع");
            }
        } catch (err) {
            setError("حدث خطأ أثناء التواصل مع السيرفر");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-bg-dark flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;

    if (error && !pkg) return (
        <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 text-center">
            <span className="material-symbols-outlined !text-6xl text-red-500 mb-4">error</span>
            <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
            <button onClick={() => router.push("/subscription")} className="bg-primary text-white px-6 py-2 rounded-xl">العودة للباقات</button>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="تأكيد الدفع" />
            
            <main className="flex-1 p-6 max-w-md mx-auto w-full">
                <div className="bg-surface-highlight rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl mb-6">
                    <h2 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">ملخص الطلب</h2>
                    
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                            <p className="text-xs text-slate-400">نظام الفوترة: {billingCycle === "monthly" ? "شهري" : "سنوي"}</p>
                        </div>
                        <div className="bg-primary/10 text-primary p-3 rounded-2xl">
                            <span className="material-symbols-outlined">workspace_premium</span>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-800/50">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">سعر الباقة</span>
                            <span className="text-white font-english">{(pkg.price * (billingCycle === "yearly" ? 12 : 1)).toLocaleString()} ل.س</span>
                        </div>
                        {billingCycle === "yearly" && (
                            <div className="flex justify-between text-sm">
                                <span className="text-green-500 font-bold">خصم السنوي (20%)</span>
                                <span className="text-green-500 font-english">- {(pkg.price * 12 * 0.2).toLocaleString()} ل.س</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold pt-4 border-t border-slate-800">
                            <span className="text-white">الإجمالي</span>
                            <span className="text-primary font-english">{calculateTotal().toLocaleString()} ل.س</span>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-highlight rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl">
                    <h2 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">طريقة الدفع</h2>
                    <div className="space-y-3">
                        {['الرصيد في المحفظة', 'بطاقة ائتمان', 'دفع عند نقطة توزيع'].map((method, idx) => (
                            <label key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-primary transition">
                                <input type="radio" name="payment" defaultChecked={idx === 0} className="accent-primary" />
                                <span className="text-sm text-slate-300 font-bold">{method}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {error && <p className="text-red-500 text-xs text-center mt-4 font-bold">{error}</p>}

                <button
                    onClick={handleConfirmPayment}
                    disabled={processing}
                    className="w-full bg-primary text-white font-bold py-5 rounded-[2rem] mt-8 hover:scale-[1.02] transition active:scale-[0.98] shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                    {processing ? "جاري المعالجة..." : "تأكيد الدفع والتفعيل الآن"}
                </button>
            </main>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-bg-dark flex items-center justify-center animate-pulse text-primary italic">Recycle24 Payment Gateway Loading...</div>}>
            <PaymentContent />
        </Suspense>
    );
}
