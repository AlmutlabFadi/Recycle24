"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function VerificationStatusPage() {
    // Countdown timer state
    const [hours, setHours] = useState(24);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((prev) => {
                if (prev > 0) return prev - 1;
                setMinutes((m) => {
                    if (m > 0) return m - 1;
                    setHours((h) => (h > 0 ? h - 1 : 0));
                    return m > 0 ? m - 1 : 59;
                });
                return 59;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="حالة التوثيق" />

            <main className="flex-1 p-4 pb-24">
                {/* Main Status Icon */}
                <div className="flex flex-col items-center text-center mb-8 pt-4">
                    {/* Hourglass Icon with glow */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-full blur-2xl bg-blue-500/20 scale-150"></div>
                        <div className="relative size-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-blue-400/20">
                            <span className="material-symbols-outlined !text-[48px] text-yellow-400 filled">
                                hourglass_top
                            </span>
                        </div>
                    </div>

                    <h1 className="text-xl font-black text-white mb-2">جاري التحقق من الهوية</h1>
                    <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                        يقوم فريقنا بمراجعة مستندات السجل التجاري والهوية الشخصية للتأكد من صحة البيانات.
                    </p>
                </div>

                {/* Progress Bar Section */}
                <div className="bg-surface-dark rounded-2xl p-5 border border-slate-700/50 mb-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-primary">65%</span>
                        <span className="text-sm font-bold text-white">اكتمال المراجعة</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-800 rounded-full mb-4 overflow-hidden">
                        <div className="h-full w-[65%] bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-1000"></div>
                    </div>

                    {/* Steps */}
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex flex-col items-center gap-1">
                            <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[14px]">check</span>
                            </div>
                            <span className="text-slate-400 font-medium">تم الاستلام</span>
                        </div>
                        <div className="flex-1 h-px bg-slate-700 mx-2"></div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center animate-pulse">
                                <span className="text-[10px] font-bold">⏳</span>
                            </div>
                            <span className="text-primary font-bold">المراجعة</span>
                        </div>
                        <div className="flex-1 h-px bg-slate-700 mx-2"></div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="size-6 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center">
                                <span className="text-[10px] font-bold">3</span>
                            </div>
                            <span className="text-slate-500 font-medium">القرار النهائي</span>
                        </div>
                    </div>
                </div>

                {/* Countdown Timer */}
                <div className="bg-surface-dark rounded-2xl p-5 border border-slate-700/50 mb-5">
                    <p className="text-xs text-slate-500 text-center mb-3">الوقت المتبقي (تقديري)</p>
                    <div className="flex items-center justify-center gap-2">
                        {/* Seconds */}
                        <div className="flex flex-col items-center">
                            <div className="bg-surface-highlight border border-slate-600 rounded-xl px-5 py-3 min-w-[64px] text-center">
                                <span className="text-2xl font-black text-white font-english">{String(seconds).padStart(2, '0')}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1.5">ثانية</span>
                        </div>
                        <span className="text-xl font-bold text-slate-600 mb-4">:</span>
                        {/* Minutes */}
                        <div className="flex flex-col items-center">
                            <div className="bg-surface-highlight border border-slate-600 rounded-xl px-5 py-3 min-w-[64px] text-center">
                                <span className="text-2xl font-black text-white font-english">{String(minutes).padStart(2, '0')}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1.5">دقيقة</span>
                        </div>
                        <span className="text-xl font-bold text-slate-600 mb-4">:</span>
                        {/* Hours */}
                        <div className="flex flex-col items-center">
                            <div className="bg-surface-highlight border border-slate-600 rounded-xl px-5 py-3 min-w-[64px] text-center">
                                <span className="text-2xl font-black text-white font-english">{String(hours).padStart(2, '0')}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1.5">ساعة</span>
                        </div>
                    </div>
                </div>

                {/* Benefits After Approval */}
                <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="material-symbols-outlined text-yellow-500 !text-[20px] filled">lock</span>
                        <h3 className="text-base font-bold text-white">سيتم تفعيل بعد الموافقة</h3>
                    </div>

                    <div className="bg-gradient-to-br from-surface-dark to-surface-highlight rounded-2xl p-5 border border-slate-700/50">
                        {/* Trader Badge Card */}
                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-700/50">
                            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary !text-[28px] filled">verified</span>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-white">تاجر محترف موثق</h4>
                                <p className="text-xs text-slate-500">Recycle24 Certified Trader</p>
                            </div>
                        </div>

                        {/* Benefits List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">إمكانية المزايدة على مناقصات المصانع الكبرى</span>
                                <span className="material-symbols-outlined text-primary !text-[18px]">check_circle</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">أولوية الظهور في نتائج بحث البائعين</span>
                                <span className="material-symbols-outlined text-primary !text-[18px]">check_circle</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">شارة التوثيق الرسمية بجانب الاسم</span>
                                <span className="material-symbols-outlined text-primary !text-[18px]">check_circle</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Help Section */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-primary !text-[24px] filled">support_agent</span>
                        <div>
                            <h4 className="text-sm font-bold text-white">هل تحتاج مساعدة؟</h4>
                            <p className="text-xs text-slate-500">تواصل مع فريق الدعم للاستفسارات العاجلة</p>
                        </div>
                    </div>
                </div>

                {/* Support Button */}
                <Link
                    href="/support"
                    className="w-full flex items-center justify-center py-3.5 rounded-xl border border-slate-700 text-white font-bold text-sm hover:bg-surface-highlight transition"
                >
                    تواصل مع الدعم الفني
                </Link>
            </main>
        </div>
    );
}
