"use client";

import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

export default function VerificationPage() {
    return (
        <>
            <HeaderWithBack title="تحقق التاجر" />

            <main className="flex-col pb-24">
                {/* Stepper Progress */}
                <div className="w-full px-6 py-6 bg-white dark:bg-bg-dark">
                    <div className="relative flex items-center justify-between">
                        {/* Connecting Line */}
                        <div className="absolute top-[14px] left-4 right-4 h-[2px] bg-slate-100 dark:bg-slate-800 -z-0">
                            {/* Active Line Progress (0% for start) */}
                            <div className="h-full w-[0%] bg-primary rounded-full"></div>
                        </div>
                        {/* Step 1: Identity */}
                        <div className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white shadow-[0_0_0_4px_rgba(255,255,255,1)] dark:shadow-[0_0_0_4px_rgba(16,25,34,1)] ring-2 ring-primary/20 ring-offset-2 ring-offset-white dark:ring-offset-bg-dark transition-all">
                                <span className="text-sm font-bold">1</span>
                            </div>
                            <span className="text-xs font-bold text-primary">الهوية</span>
                        </div>
                        {/* Step 2: License */}
                        <div className="relative z-10 flex flex-col items-center gap-2 group opacity-50">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-[0_0_0_4px_rgba(255,255,255,1)] dark:shadow-[0_0_0_4px_rgba(16,25,34,1)] transition-all">
                                <span className="text-sm font-bold">2</span>
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                الرخصة
                            </span>
                        </div>
                        {/* Step 3: Location */}
                        <div className="relative z-10 flex flex-col items-center gap-2 group opacity-50">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-[0_0_0_4px_rgba(255,255,255,1)] dark:shadow-[0_0_0_4px_rgba(16,25,34,1)] transition-all">
                                <span className="text-sm font-bold">3</span>
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                الموقع
                            </span>
                        </div>
                    </div>
                </div>

                {/* Hero Card */}
                <div className="px-4 mb-2">
                    <div className="relative w-full overflow-hidden rounded-2xl bg-surface-dark group shadow-lg ring-1 ring-white/5">
                        {/* Background Gradient - Brightened for better visibility */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 transition-transform duration-700 group-hover:scale-105"></div>

                        {/* Texture/Pattern */}
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>

                        {/* Light flare for better text contrast */}
                        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent"></div>

                        {/* Content */}
                        <div className="relative flex flex-col justify-end min-h-[200px] p-6">
                            <div className="flex items-center gap-2 mb-3 bg-blue-500/20 w-fit px-3 py-1.5 rounded-full border border-blue-400/30">
                                <span className="material-symbols-outlined filled text-yellow-400 !text-[18px] drop-shadow-md">
                                    verified
                                </span>
                                <span className="text-blue-100 text-xs font-bold tracking-wide drop-shadow-sm">
                                    كن شريكاً معتمداً
                                </span>
                            </div>
                            <h2 className="text-white text-2xl font-black leading-tight mb-2 tracking-tight drop-shadow-md">
                                افتح صفقات المصانع الحصرية وعزز سمعتك
                            </h2>
                            <p className="text-slate-200 text-sm font-medium leading-relaxed max-w-[95%] drop-shadow-sm">
                                أكمل إجراءات التحقق لتصبح تاجراً موثوقاً في السوق السوري.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="px-4 py-6 flex flex-col gap-5">
                    <div className="flex flex-col gap-1 px-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            لماذا يجب عليك التحقق؟
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            احصل على هذه المزايا الحصرية فور الانتهاء
                        </p>
                    </div>
                    <div className="grid gap-3">
                        {/* Benefit Card 1 */}
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-surface-highlight border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/50 transition-colors">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-primary shrink-0">
                                <span className="material-symbols-outlined filled !text-[24px]">
                                    trending_up
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                    ظهور أعلى في البحث
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-normal">
                                    يتم إعطاء الأولوية لملفك الشخصي في نتائج البحث للمشترين والمصانع.
                                </p>
                            </div>
                        </div>
                        {/* Benefit Card 2 */}
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-surface-highlight border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/50 transition-colors">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 shrink-0">
                                <span className="material-symbols-outlined filled !text-[24px]">
                                    verified_user
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                    شارة التاجر الموثوق
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-normal">
                                    تظهر شارة الثقة بجانب اسمك لزيادة مصداقيتك ومبيعاتك.
                                </p>
                            </div>
                        </div>
                        {/* Benefit Card 3 */}
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-surface-highlight border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/50 transition-colors">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 shrink-0">
                                <span className="material-symbols-outlined filled !text-[24px]">
                                    factory
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                    صفقات المصانع المباشرة
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-normal">
                                    الوصول إلى المزادات المغلقة والعروض الحصرية من كبرى المصانع.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trust Footer */}
                <div className="mt-auto px-6 py-4 flex flex-col items-center justify-center text-center gap-2 opacity-80">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 !text-[16px]">
                            lock
                        </span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            بياناتك مشفرة ومحمية بنسبة 100%
                        </span>
                    </div>
                </div>
            </main>

            {/* Sticky Action Button */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-bg-dark/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto">
                <Link
                    href="/verification/identity"
                    className="relative w-full group overflow-hidden bg-primary hover:bg-primary/90 active:bg-primary/95 text-white font-bold text-base py-4 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <span className="relative z-10">ابدأ التحقق الآن</span>
                    <span className="material-symbols-outlined relative z-10 !text-[20px] rtl:-scale-x-100 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                        arrow_right_alt
                    </span>
                </Link>
            </div>
        </>
    );
}
