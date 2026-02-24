"use client";

import HeaderWithBack from "@/components/HeaderWithBack";

export default function SafetyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="مركز السلامة والتوعية" />

            <main className="flex-1 flex flex-col gap-6 p-4">
                {/* Hero Warning */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-red-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>

                    <div className="flex items-start gap-3 relative z-10">
                        <div className="bg-red-500 text-white p-2 rounded-lg shrink-0">
                            <span className="material-symbols-outlined !text-[28px] filled">warning</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-red-500 mb-1">تحذير هام: مخلفات الحرب!</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                يمنع منعاً باتاً التعامل مع الأجسام المشبوهة أو الذخائر غير المنفجرة. سلامتك هي أولويتنا القصوى.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Safety Guidelines Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-surface-highlight p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center text-center gap-2">
                        <div className="size-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1">
                            <span className="material-symbols-outlined !text-[24px]">masks</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">أدوات الوقاية</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">ارتدِ القفازات والأقنعة دائماً</p>
                    </div>

                    <div className="bg-white dark:bg-surface-highlight p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center text-center gap-2">
                        <div className="size-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-1">
                            <span className="material-symbols-outlined !text-[24px]">science</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">المواد الكيميائية</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">افصل البطاريات والسوائل</p>
                    </div>

                    <div className="bg-white dark:bg-surface-highlight p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center text-center gap-2">
                        <div className="size-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-1">
                            <span className="material-symbols-outlined !text-[24px]">recycle</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">الفرز الصحيح</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">افصل المعادن لزيادة القيمة</p>
                    </div>

                    <div className="bg-white dark:bg-surface-highlight p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center text-center gap-2">
                        <div className="size-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-1">
                            <span className="material-symbols-outlined !text-[24px]">local_shipping</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">النقل الآمن</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">تأكد من تثبيت الحمولة</p>
                    </div>
                </div>

                {/* Visual Guide: Dangerous Items */}
                <section>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500 !text-[20px]">block</span>
                        أجسام محظورة (خطر الموت)
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 bg-white dark:bg-surface-highlight p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <div className="size-16 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-slate-400 !text-[32px]">bomb</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">الذخائر والقذائف</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    أي جسم معدني اسطواني أو مخروطي الشكل قد يكون قذيفة غير منفجرة. لا تلمسها!
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white dark:bg-surface-highlight p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <div className="size-16 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-slate-400 !text-[32px]">propane_tank</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">اسطوانات الغاز المضغوطة</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    خطر الانفجار عند الكبس. يجب التأكد من أنها فارغة ومفتوحة تماماً.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Emergency Contact */}
                <div className="mt-auto bg-slate-900 dark:bg-black rounded-2xl p-5 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/10"></div>
                    <h3 className="text-white font-bold mb-2 relative z-10">هل وجدت جسماً مشبوهاً؟</h3>
                    <p className="text-slate-400 text-sm mb-4 relative z-10">
                        لا تقترب. لا تلمس. بلغ السلطات المختصة فوراً.
                    </p>
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors relative z-10">
                        <span className="material-symbols-outlined !text-[20px]">call</span>
                        <span>اتصال بالطوارئ (112)</span>
                    </button>
                </div>
            </main>
        </div>
    );
}
