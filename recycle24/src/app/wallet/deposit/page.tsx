"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/contexts/ToastContext";

const paymentMethods = [
    { id: "haram", name: "حريم", icon: "🏦", description: "عبر فروع حريم" },
    { id: "syriatel", name: "سيرياتيل كاش", icon: "📱", description: "عبر تطبيق سيرياتيل" },
    { id: "mtn", name: "MTN كاش", icon: "📲", description: "عبر تطبيق MTN" },
    { id: "al_fouad", name: "الفؤاد", icon: "🏛️", description: "عبر فروع الفؤاد" },
];

const amounts = [50000, 100000, 250000, 500000, 1000000];

export default function WalletDepositPage() {
    const [selectedMethod, setSelectedMethod] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [referenceNumber, setReferenceNumber] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { deposit } = useWallet();
    const { addToast } = useToast();
    const router = useRouter();

    const handleNext = () => {
        if (step === 1 && amount) {
            setStep(2);
        } else if (step === 2 && selectedMethod) {
            setStep(3);
        }
    };

    const handleSubmit = async () => {
        if (!amount || !selectedMethod || !referenceNumber) {
            addToast("يرجى ملء جميع الحقول", "error");
            return;
        }

        setIsSubmitting(true);
        
        try {
            const success = await deposit(
                parseInt(amount),
                selectedMethod,
                referenceNumber
            );

            if (success) {
                addToast("تم إنشاء طلب الإيداع بنجاح! سيتم التحقق منه خلال 24 ساعة", "success");
                setStep(4); // Success step
                setTimeout(() => {
                    router.push("/wallet");
                }, 3000);
            } else {
                addToast("فشل إنشاء طلب الإيداع", "error");
            }
        } catch (error) {
            addToast("حدث خطأ أثناء الإيداع", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="إيداع في المحفظة" />

            {/* Progress */}
            <div className="px-4 py-4 bg-surface-dark border-b border-slate-800">
                <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                s < step || (step === 4 && s === 3)
                                    ? "bg-green-500 text-white"
                                    : s === step
                                    ? "bg-primary text-white"
                                    : "bg-slate-700 text-slate-500"
                            }`}
                        >
                            {s < step || (step === 4 && s === 3) ? (
                                <span className="material-symbols-outlined">check</span>
                            ) : (
                                s
                            )}
                        </div>
                    ))}
                </div>
                <div className="text-center mt-2 text-xs text-slate-400">
                    {step === 1 && "اختيار المبلغ"}
                    {step === 2 && "اختيار طريقة الدفع"}
                    {step === 3 && "تأكيد العملية"}
                    {step === 4 && "تم بنجاح!"}
                </div>
            </div>

            <main className="flex-1 p-4 pb-24">
                {step === 1 && (
                    <>
                        <section className="mb-6">
                            <h2 className="text-lg font-bold text-white mb-4">اختر المبلغ</h2>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {amounts.map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setAmount(amt.toString())}
                                        className={`p-4 rounded-xl border-2 transition-all ${
                                            amount === amt.toString()
                                                ? "border-primary bg-primary/10"
                                                : "border-slate-700 bg-surface-highlight hover:border-slate-600"
                                        }`}
                                    >
                                        <span className="text-xl font-bold text-white">
                                            {amt.toLocaleString()}
                                        </span>
                                        <span className="block text-xs text-slate-400 mt-1">ل.س</span>
                                    </button>
                                ))}
                            </div>
                            <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
                                <label className="block text-sm text-slate-400 mb-2">مبلغ مخصص</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="أدخل المبلغ..."
                                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg text-center focus:border-primary focus:outline-none transition-colors"
                                />
                            </div>
                        </section>
                    </>
                )}

                {step === 2 && (
                    <>
                        <section className="mb-6">
                            <h2 className="text-lg font-bold text-white mb-4">اختر طريقة الدفع</h2>
                            <div className="space-y-3">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                                            selectedMethod === method.id
                                                ? "border-primary bg-primary/10"
                                                : "border-slate-700 bg-surface-highlight hover:border-slate-600"
                                        }`}
                                    >
                                        <span className="text-3xl">{method.icon}</span>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white">{method.name}</h3>
                                            <p className="text-sm text-slate-400">{method.description}</p>
                                        </div>
                                        {selectedMethod === method.id && (
                                            <span className="material-symbols-outlined text-primary">
                                                check_circle
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                {step === 3 && (
                    <>
                        <section className="mb-6">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-4xl text-primary">receipt_long</span>
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">تأكيد العملية</h2>
                                <p className="text-slate-400">أدخل رقم العملية (Reference Number)</p>
                            </div>

                            <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700 mb-4">
                                <label className="block text-sm text-slate-400 mb-2">رقم العملية</label>
                                <input
                                    type="text"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    placeholder="مثال: TX123456789"
                                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg text-center focus:border-primary focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
                                <h3 className="font-bold text-white mb-3">ملخص العملية:</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">المبلغ:</span>
                                        <span className="text-white font-bold">{parseInt(amount).toLocaleString()} ل.س</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">طريقة الدفع:</span>
                                        <span className="text-white">
                                            {paymentMethods.find(m => m.id === selectedMethod)?.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">الرسوم:</span>
                                        <span className="text-green-400">مجاناً</span>
                                    </div>
                                    <div className="border-t border-slate-700 pt-2 mt-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">الإجمالي:</span>
                                            <span className="text-primary font-bold text-lg">
                                                {parseInt(amount).toLocaleString()} ل.س
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {step === 4 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">تم إرسال الطلب!</h2>
                        <p className="text-slate-400 mb-4">
                            سيتم التحقق من عمليتك خلال 24 ساعة وإضافة المبلغ لمحفظتك
                        </p>
                        <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700 w-full max-w-xs">
                            <p className="text-sm text-slate-400">رقم العملية:</p>
                            <p className="text-white font-mono font-bold">{referenceNumber}</p>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Actions */}
            {step !== 4 && (
                <div className="fixed bottom-0 left-0 right-0 bg-surface-dark border-t border-slate-800 p-4 pb-safe">
                    <div className="max-w-md mx-auto flex gap-3">
                        {step > 1 && (
                            <button
                                onClick={() => setStep((s) => (s - 1) as typeof step)}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-all"
                            >
                                السابق
                            </button>
                        )}
                        <button
                            onClick={step === 3 ? handleSubmit : handleNext}
                            disabled={
                                (step === 1 && !amount) ||
                                (step === 2 && !selectedMethod) ||
                                (step === 3 && !referenceNumber) ||
                                isSubmitting
                            }
                            className={`flex-[2] py-3 px-4 rounded-xl font-bold transition-all ${
                                ((step === 1 && amount) ||
                                (step === 2 && selectedMethod) ||
                                (step === 3 && referenceNumber)) && !isSubmitting
                                    ? "bg-primary text-white hover:bg-primary-dark"
                                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                            }`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    جاري الإرسال...
                                </span>
                            ) : (
                                step === 3 ? "تأكيد الإيداع" : "متابعة"
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
