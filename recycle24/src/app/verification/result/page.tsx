"use client";

import Link from "next/link";
import { Suspense } from "react";

function ResultContent() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-bg-dark relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl animate-pulse bg-green-500/20"></div>

            <div className="relative z-10 flex flex-col items-center animate-slide-up w-full max-w-sm">
                <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full animate-ping bg-green-500/20"></div>
                    <div className="relative size-24 rounded-full flex items-center justify-center shadow-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30">
                        <span className="material-symbols-outlined !text-[48px] text-white">
                            verified
                        </span>
                    </div>
                </div>

                <h1 className="text-2xl font-black text-white mb-2">تم التوثيق بنجاح!</h1>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-[280px] mx-auto">
                    حسابك موثَّق الآن. يمكنك الاستفادة من جميع ميزات المنصة.
                </p>

                <div className="w-full bg-surface-highlight border border-slate-700/50 rounded-2xl p-5 mb-8 shadow-lg text-right">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500">folder_open</span>
                        حالة المستندات
                    </h3>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl border bg-bg-dark border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full flex items-center justify-center bg-green-500/10 text-green-500">
                                    <span className="material-symbols-outlined !text-[18px]">badge</span>
                                </div>
                                <span className="text-sm font-medium text-slate-200">الهوية الشخصية</span>
                            </div>
                            <span className="material-symbols-outlined !text-[20px] text-green-500">check_circle</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl border bg-bg-dark border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full flex items-center justify-center bg-green-500/10 text-green-500">
                                    <span className="material-symbols-outlined !text-[18px]">store</span>
                                </div>
                                <span className="text-sm font-medium text-slate-200">السجل التجاري</span>
                            </div>
                            <span className="material-symbols-outlined !text-[20px] text-green-500">check_circle</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl border bg-bg-dark border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full flex items-center justify-center bg-slate-500/10 text-slate-500">
                                    <span className="material-symbols-outlined !text-[18px]">factory</span>
                                </div>
                                <span className="text-sm font-medium text-slate-400">السجل الصناعي</span>
                            </div>
                            <span className="text-xs text-slate-500">اختياري</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl border bg-bg-dark border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full flex items-center justify-center bg-green-500/10 text-green-500">
                                    <span className="material-symbols-outlined !text-[18px]">license</span>
                                </div>
                                <span className="text-sm font-medium text-slate-200">رخصة العمل</span>
                            </div>
                            <span className="material-symbols-outlined !text-[20px] text-green-500">check_circle</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl border bg-bg-dark border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full flex items-center justify-center bg-green-500/10 text-green-500">
                                    <span className="material-symbols-outlined !text-[18px]">location_on</span>
                                </div>
                                <span className="text-sm font-medium text-slate-200">إثبات الموقع</span>
                            </div>
                            <span className="material-symbols-outlined !text-[20px] text-green-500">check_circle</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl border bg-bg-dark border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full flex items-center justify-center bg-green-500/10 text-green-500">
                                    <span className="material-symbols-outlined !text-[18px]">call</span>
                                </div>
                                <span className="text-sm font-medium text-slate-200">رقم الهاتف</span>
                            </div>
                            <span className="material-symbols-outlined !text-[20px] text-green-500">check_circle</span>
                        </div>
                    </div>
                </div>

                <div className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-6 text-right">
                    <h4 className="text-white font-bold text-sm mb-2">مزايا الحساب الموثَّق:</h4>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="material-symbols-outlined !text-[14px] text-green-500">check</span>
                            الظهور في أعلى نتائج البحث
                        </li>
                        <li className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="material-symbols-outlined !text-[14px] text-green-500">check</span>
                            شارة &quot;تاجر موثَّق&quot; على الملف الشخصي
                        </li>
                        <li className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="material-symbols-outlined !text-[14px] text-green-500">check</span>
                            الوصول إلى المزادات الحصرية
                        </li>
                        <li className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="material-symbols-outlined !text-[14px] text-green-500">check</span>
                            عمولة مخفضة على الصفقات
                        </li>
                    </ul>
                </div>

                <div className="w-full grid gap-3">
                    <Link
                        href="/"
                        className="w-full h-12 flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition shadow-lg shadow-primary/25"
                    >
                        العودة للرئيسية
                    </Link>
                    <Link
                        href="/profile"
                        className="w-full h-12 flex items-center justify-center text-slate-400 hover:text-white active:bg-slate-800/50 font-medium text-sm rounded-xl transition"
                    >
                        عرض الملف الشخصي
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default function VerificationResultPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-bg-dark"><div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>}>
            <ResultContent />
        </Suspense>
    );
}
