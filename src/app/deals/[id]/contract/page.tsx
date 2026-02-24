"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DealContractPage() {
    const router = useRouter();
    const [signature, setSignature] = useState("");
    const [isSigned, setIsSigned] = useState(false);
    const [isSealed, setIsSealed] = useState(false);

    const handleSign = () => {
        if (!signature) return;
        setIsSigned(true);
        // Simulate processing
        setTimeout(() => {
            setIsSealed(true);
        }, 1500);
    };

    if (isSealed) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark font-display relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="w-full h-full bg-[url('https://lottie.host/embed/98692795-385d-452f-9642-167822b37803/7K9X2Q9X2Q.json')] opacity-20"></div>
                </div>
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="size-24 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-6 border border-green-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
                        <span className="material-symbols-outlined !text-[48px]">verified_user</span>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">تم توثيق العقد بنجاح!</h2>
                    <p className="text-slate-400 mb-8 max-w-xs mx-auto">تم إرسال نسخة من العقد إلى بريدك الإلكتروني وحفظه في سجلك التجاري.</p>
                    <div className="bg-surface-highlight border border-white/10 rounded-xl p-4 w-full max-w-sm mb-6 text-right">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-500">رقم العقد</span>
                            <span className="font-mono text-white">CTR-2024-8892</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">تاريخ التوثيق</span>
                            <span className="font-english text-white">12 Feb 2026, 10:45 AM</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full max-w-sm">
                        <button className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">download</span>
                            تحميل العقد (PDF)
                        </button>
                        <Link href="/" className="w-full bg-slate-700 text-white py-4 rounded-xl font-bold hover:bg-slate-600 transition">
                            العودة للرئيسية
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="توثيق العقد #8892" />

            <main className="flex-1 px-4 py-4 flex flex-col gap-4">
                {/* Deal Summary */}
                <div className="bg-white dark:bg-surface-highlight rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">receipt_long</span>
                        ملخص الصفقة
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                            <span className="text-slate-500">البائع</span>
                            <span className="text-slate-900 dark:text-white font-bold">شركة المعادن السورية</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                            <span className="text-slate-500">المشتري</span>
                            <span className="text-slate-900 dark:text-white font-bold">مؤسسة الأمل</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                            <span className="text-slate-500">المادة</span>
                            <span className="text-slate-900 dark:text-white">حديد صناعي (Heavy Melt)</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                            <span className="text-slate-500">الوزن الصافي</span>
                            <span className="text-slate-900 dark:text-white font-english dir-ltr">5.250 Ton</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-slate-500 font-bold">القيمة الإجمالية</span>
                            <span className="text-green-600 font-bold font-english dir-ltr text-base">245,000,000 SYP</span>
                        </div>
                    </div>
                </div>

                {/* Terms Scroll */}
                <div className="bg-white dark:bg-surface-highlight rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400">gavel</span>
                        الشروط والأحكام
                    </h3>
                    <div className="h-40 overflow-y-auto bg-slate-50 dark:bg-bg-dark rounded-lg p-3 text-xs text-slate-500 leading-relaxed border border-slate-100 dark:border-slate-700">
                        <p className="mb-2">1. يقر الطرفان بأهليتهما القانونية للتعاقد والتصرف.</p>
                        <p className="mb-2">2. يضمن البائع أن البضاعة المباعة (الخردة) خالية من أي مواد محظورة أو متفجرات أو مواد مشعة، ويتحمل المسؤولية القانونية الكاملة خلاف ذلك.</p>
                        <p className="mb-2">3. يتم سداد المبلغ كاملاً عبر المحفظة الرقمية لمنصة Metalix24 فور توقيع هذا العقد.</p>
                        <p className="mb-2">4. تنتقل ملكية البضاعة للمشتري فور استلام رمز التسليم.</p>
                        <p className="mb-2">5. يخضع هذا العقد لقوانين التجارة الإلكترونية المعمول بها في الجمهورية العربية السورية.</p>
                        <p>6. تعتبر منصة Metalix24 وسيطاً تقنياً ولا تتحمل مسؤولية جودة البضاعة إلا في حال اختيار خدمة &quot;الفحص المعتمد&quot;.</p>
                    </div>
                </div>

                {/* Signature Area */}
                <div className="bg-white dark:bg-surface-highlight rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">التوقيع الرقمي</h3>
                    <div className="relative">
                        <input
                            type="text"
                            disabled={isSigned}
                            value={signature}
                            onChange={(e) => setSignature(e.target.value)}
                            placeholder="اكتب اسمك الثلاثي هنا..."
                            className="w-full bg-slate-50 dark:bg-bg-dark border border-slate-200 dark:border-slate-700 rounded-xl py-4 px-4 text-center font-handwriting text-xl text-primary focus:ring-2 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ fontFamily: 'cursive' }}
                        />
                        {isSigned && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 flex items-center gap-1 animate-scale-in">
                                <span className="material-symbols-outlined filled">verified</span>
                            </div>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                        بالتوقيع أعلاه، أنت توافق نهائياً على إتمام هذه الصفقة وشروطها.
                    </p>
                </div>
            </main>

            {/* Sticky Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-bg-dark border-t border-slate-200 dark:border-slate-800 z-20">
                <button
                    onClick={handleSign}
                    disabled={!signature || isSigned}
                    className={`w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 ${isSigned
                            ? "bg-green-600 text-white cursor-wait"
                            : !signature
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
                        }`}
                >
                    {isSigned ? (
                        <>
                            <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            جاري التوثيق...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">ink_pen</span>
                            توقيع وتوثيق العقد
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
