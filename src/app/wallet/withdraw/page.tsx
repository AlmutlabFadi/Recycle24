"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/contexts/ToastContext";

const withdrawalMethods = [
    { id: "haram", name: "حريم", icon: "🏦", minAmount: 50000 },
    { id: "syriatel", name: "سيرياتيل كاش", icon: "📱", minAmount: 10000 },
    { id: "mtn", name: "MTN كاش", icon: "📲", minAmount: 10000 },
    { id: "al_fouad", name: "الفؤاد", icon: "🏛️", minAmount: 50000 },
];

export default function WalletWithdrawPage() {
    const [amount, setAmount] = useState<string>("");
    const [selectedMethod, setSelectedMethod] = useState<string>("");
    const [accountNumber, setAccountNumber] = useState<string>("");
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { wallet, withdraw } = useWallet();
    const { addToast } = useToast();
    const router = useRouter();

    const balance = wallet?.balance || 0;
    const fee = parseInt(amount || "0") * 0.01; // 1% fee
    const total = parseInt(amount || "0") + fee;

    const isAmountValid = parseInt(amount) >= (withdrawalMethods.find(m => m.id === selectedMethod)?.minAmount || 0);
    const hasEnoughBalance = balance >= total;

    const handleNext = () => {
        if (step === 1 && amount && hasEnoughBalance) {
            setStep(2);
        } else if (step === 2 && selectedMethod && accountNumber && isAmountValid) {
            setStep(3);
        }
    };

    const handleSubmit = async () => {
        if (!amount || !selectedMethod || !accountNumber) {
            addToast("يرجى ملء جميع الحقول", "error");
            return;
        }

        setIsSubmitting(true);
        
        try {
            const success = await withdraw(
                parseInt(amount),
                selectedMethod,
                accountNumber
            );

            if (success) {
                addToast("تم إنشاء طلب السحب بنجاح! سيتم معالجته خلال 24 ساعة", "success");
                setStep(4); // Success step
                setTimeout(() => {
                    router.push("/wallet");
                }, 3000);
            } else {
                addToast("فشل إنشاء طلب السحب", "error");
            }
        } catch (error) {
            addToast("حدث خطأ أثناء السحب", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="سحب من المحفظة" />

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
                    {step === 1 && "المبلغ"}
                    {step === 2 && "طريقة السحب"}
                    {step === 3 && "تأكيد"}
                    {step === 4 && "تم بنجاح!"}
                </div>
            </div>

            <main className="flex-1 p-4 pb-24">
                {/* Balance */}
                <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700 mb-6">
                    <span className="text-slate-400 text-sm">الرصيد المتاح</span>
                    <div className="text-2xl font-bold text-white">
                        {balance.toLocaleString()} <span className="text-sm">ل.س</span>
                    </div>
                </div>

                {step === 1 && (
                    <>
                        <section className="mb-6">
                            <h2 className="text-lg font-bold text-white mb-4">المبلغ</h2>
                            <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700 mb-4">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="أدخل المبلغ..."
                                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg text-center focus:border-primary focus:outline-none transition-colors"
                                />
                                <div className="flex gap-2 mt-3">
                                    {[50000, 100000, 250000].map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => setAmount(amt.toString())}
                                            className="flex-1 py-2 px-3 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors"
                                        >
                                            {amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {amount && (
                                <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">المبلغ:</span>
                                            <span className="text-white">{parseInt(amount).toLocaleString()} ل.س</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">الرسوم (1%):</span>
                                            <span className="text-orange-400">{fee.toLocaleString()} ل.س</span>
                                        </div>
                                        <div className="border-t border-slate-700 pt-2">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">الإجمالي:</span>
                                                <span className="text-primary font-bold">{total.toLocaleString()} ل.س</span>
                                            </div>
                                        </div>
                                    </div>
                                    {!hasEnoughBalance && (
                                        <p className="text-red-400 text-sm mt-2 text-center">
                                            الرصيد غير كافٍ
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>
                    </>
                )}

                {step === 2 && (
                    <>
                        <section className="mb-6">
                            <h2 className="text-lg font-bold text-white mb-4">اختر طريقة السحب</h2>
                            <div className="space-y-3 mb-6">
                                {withdrawalMethods.map((method) => (
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
                                            <p className="text-sm text-slate-400">
                                                الحد الأدنى: {method.minAmount.toLocaleString()} ل.س
                                            </p>
                                        </div>
                                        {selectedMethod === method.id && (
                                            <span className="material-symbols-outlined text-primary">
                                                check_circle
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {selectedMethod && (
                                <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
                                    <label className="block text-sm text-slate-400 mb-2">
                                        رقم الحساب / رقم الهاتف
                                    </label>
                                    <input
                                        type="text"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        placeholder="أدخل رقم الحساب..."
                                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-center focus:border-primary focus:outline-none transition-colors"
                                    />
                                    {!isAmountValid && amount && (
                                        <p className="text-red-400 text-sm mt-2">
                                            المبلغ أقل من الحد الأدنى ({withdrawalMethods.find(m => m.id === selectedMethod)?.minAmount.toLocaleString()} ل.س)
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>
                    </>
                )}

                {step === 3 && (
                    <>
                        <section className="mb-6">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-4xl text-orange-400">warning</span>
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">تأكيد السحب</h2>
                                <p className="text-slate-400">يرجى مراجعة البيانات قبل التأكيد</p>
                            </div>

                            <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
                                <h3 className="font-bold text-white mb-3">ملخص العملية:</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">المبلغ:</span>
                                        <span className="text-white font-bold">{parseInt(amount).toLocaleString()} ل.س</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">طريقة السحب:</span>
                                        <span className="text-white">
                                            {withdrawalMethods.find(m => m.id === selectedMethod)?.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">الحساب:</span>
                                        <span className="text-white font-mono">{accountNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">الرسوم:</span>
                                        <span className="text-orange-400">{fee.toLocaleString()} ل.س</span>
                                    </div>
                                    <div className="border-t border-slate-700 pt-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">سيتم خصم:</span>
                                            <span className="text-red-400 font-bold text-lg">{total.toLocaleString()} ل.س</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-4">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-red-400">warning</span>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">تنبيه</h3>
                                        <p className="text-sm text-slate-400">
                                            العملية نهائية ولا يمكن التراجع عنها. تأكد من صحة رقم الحساب.
                                        </p>
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
                            سيتم معالجة طلبك خلال 24 ساعة
                        </p>
                        <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700 w-full max-w-xs">
                            <p className="text-sm text-slate-400">المبلغ:</p>
                            <p className="text-white font-bold">{parseInt(amount).toLocaleString()} ل.س</p>
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
                                (step === 1 && (!amount || !hasEnoughBalance)) ||
                                (step === 2 && (!selectedMethod || !accountNumber || !isAmountValid)) ||
                                isSubmitting
                            }
                            className={`flex-[2] py-3 px-4 rounded-xl font-bold transition-all ${
                                ((step === 1 && amount && hasEnoughBalance) ||
                                (step === 2 && selectedMethod && accountNumber && isAmountValid)) && !isSubmitting
                                    ? "bg-primary text-white hover:bg-primary-dark"
                                    : step === 3
                                    ? "bg-red-600 text-white hover:bg-red-700"
                                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                            }`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    جاري الإرسال...
                                </span>
                            ) : (
                                step === 3 ? "تأكيد السحب" : "متابعة"
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
