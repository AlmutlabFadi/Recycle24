"use client";

import HeaderWithBack from "@/components/HeaderWithBack";

export default function AcademyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            {/* Header */}
            <HeaderWithBack title="أكاديمية ريسايكل 24" />

            <main className="flex-1 flex flex-col gap-6">
                {/* Featured Course Hero */}
                <div className="px-4 pt-4">
                    <div className="relative w-full overflow-hidden rounded-2xl bg-surface-dark shadow-lg group h-[220px]">
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/90 via-bg-dark/40 to-transparent z-10"></div>
                        {/* Background Gradient instead of Image for reliability */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 group-hover:scale-105 transition-transform duration-700"></div>
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>

                        <div className="absolute bottom-0 left-0 right-0 p-5 z-20 flex flex-col items-start gap-2">
                            <span className="inline-flex items-center rounded-md bg-primary/90 px-2 py-1 text-xs font-bold text-white ring-1 ring-inset ring-primary/20">
                                مميز
                            </span>
                            <h2 className="text-2xl font-bold text-white leading-tight">
                                السلامة والتوعية بمخلفات الحرب
                            </h2>
                            <p className="text-slate-300 text-sm line-clamp-2 mb-2">
                                دورة أساسية للعمل الآمن في مناطق الخردة وفحص المخلفات غير المنفجرة.
                            </p>
                            <button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                <span>ابدأ التعلم الآن</span>
                                <span className="material-symbols-outlined !text-[20px] rtl:rotate-180">
                                    arrow_forward
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar snap-x">
                    <button className="snap-start shrink-0 rounded-full bg-primary text-white px-5 py-2 text-sm font-bold shadow-sm ring-1 ring-primary transition-all">
                        الكل
                    </button>
                    <button className="snap-start shrink-0 rounded-full bg-white dark:bg-surface-highlight text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-5 py-2 text-sm font-medium transition-all">
                        تمييز المعادن
                    </button>
                    <button className="snap-start shrink-0 rounded-full bg-white dark:bg-surface-highlight text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-5 py-2 text-sm font-medium transition-all">
                        السلامة المهنية
                    </button>
                    <button className="snap-start shrink-0 rounded-full bg-white dark:bg-surface-highlight text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-5 py-2 text-sm font-medium transition-all">
                        اللوجستيات
                    </button>
                </div>

                {/* My Learning (Ongoing) */}
                <div className="px-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            تعليمي المستمر
                        </h3>
                        <button className="text-primary text-sm font-bold hover:underline">
                            عرض الكل
                        </button>
                    </div>
                    <div className="bg-white dark:bg-surface-highlight rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 flex gap-4 items-center">
                        <div className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <span className="material-symbols-outlined !text-[32px] text-slate-400">recycling</span>
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white !text-[28px]">play_circle</span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-slate-900 dark:text-white truncate">
                                    المعايير البيئية
                                </h4>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">
                                الوحدة ٢: فصل النفايات الخطرة
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full"
                                        style={{ width: "45%" }}
                                    ></div>
                                </div>
                                <span className="text-xs font-bold text-primary whitespace-nowrap">
                                    ٤٥٪
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course List */}
                <div className="px-4 flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        الدورات المتاحة
                    </h3>

                    {/* Course Card 1 */}
                    <div className="bg-white dark:bg-surface-highlight rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700/50 group hover:shadow-md transition-shadow">
                        <div className="h-32 w-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                            {/* Gradient Placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-80"></div>
                            <div className="absolute top-2 right-2 bg-white/90 dark:bg-bg-dark/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-900 dark:text-white flex items-center gap-1 shadow-sm z-10">
                                <span className="material-symbols-outlined !text-[14px] text-amber-500 filled">
                                    verified
                                </span>
                                شهادة معتمدة
                            </div>
                        </div>
                        <div className="p-4 relative bg-white dark:bg-surface-highlight">
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                                    تمييز المعادن المتقدم: النحاس والألمنيوم
                                </h4>
                                <span className="shrink-0 bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">
                                    مجاني
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-[16px]">
                                        schedule
                                    </span>
                                    <span>٤ ساعات</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-[16px]">
                                        person
                                    </span>
                                    <span>م. أحمد العلي</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3">
                                <div className="flex -space-x-2 space-x-reverse">
                                    <div className="size-6 rounded-full bg-slate-300 ring-2 ring-white dark:ring-surface-highlight"></div>
                                    <div className="size-6 rounded-full bg-slate-400 ring-2 ring-white dark:ring-surface-highlight"></div>
                                    <div className="size-6 rounded-full bg-slate-200 ring-2 ring-white dark:ring-surface-highlight flex items-center justify-center text-[8px] font-bold text-slate-500">+٤٠</div>
                                </div>
                                <button className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                                    التفاصيل
                                    <span className="material-symbols-outlined !text-[18px] rtl:rotate-180">
                                        arrow_forward
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Course Card 2 */}
                    <div className="bg-white dark:bg-surface-highlight rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700/50 group hover:shadow-md transition-shadow">
                        <div className="h-32 w-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                            {/* Gradient Placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-80"></div>
                            <div className="absolute top-2 right-2 bg-white/90 dark:bg-bg-dark/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-900 dark:text-white flex items-center gap-1 shadow-sm z-10">
                                <span className="material-symbols-outlined !text-[14px] text-amber-500 filled">
                                    verified
                                </span>
                                شهادة معتمدة
                            </div>
                        </div>
                        <div className="p-4 relative bg-white dark:bg-surface-highlight">
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                                    لوجستيات المستودعات وإدارة المخزون
                                </h4>
                                <span className="shrink-0 bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">
                                    ٢٥٠٠ ل.س
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-[16px]">
                                        schedule
                                    </span>
                                    <span>٦ ساعات</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-[16px]">
                                        person
                                    </span>
                                    <span>د. سامر الحلبي</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3">
                                <div className="flex -space-x-2 space-x-reverse">
                                    <div className="size-6 rounded-full bg-slate-300 ring-2 ring-white dark:ring-surface-highlight"></div>
                                    <div className="size-6 rounded-full bg-slate-400 ring-2 ring-white dark:ring-surface-highlight"></div>
                                    <div className="size-6 rounded-full bg-slate-200 ring-2 ring-white dark:ring-surface-highlight flex items-center justify-center text-[8px] font-bold text-slate-500">+١٥</div>
                                </div>
                                <button className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                                    التفاصيل
                                    <span className="material-symbols-outlined !text-[18px] rtl:rotate-180">
                                        arrow_forward
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
