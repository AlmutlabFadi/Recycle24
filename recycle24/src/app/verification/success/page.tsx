"use client";

import Link from "next/link";

export default function VerificationSuccessPage() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-bg-dark relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl animate-pulse bg-primary/15"></div>

            <div className="relative z-10 flex flex-col items-center animate-slide-up w-full max-w-sm">
                {/* Result Icon */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full animate-ping bg-primary/20"></div>
                    <div className="relative size-24 rounded-full flex items-center justify-center shadow-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/30">
                        <span className="material-symbols-outlined !text-[48px] text-white">
                            schedule
                        </span>
                    </div>
                </div>

                <h1 className="text-2xl font-black text-white mb-2">
                    تم تقديم طلبك بنجاح!
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-[280px] mx-auto">
                    شكراً لك! سيتم مراجعة طلبك والتحقق من المستندات المقدمة.
                </p>

                {/* Processing Time Card */}
                <div className="w-full bg-primary/10 border border-primary/30 rounded-2xl p-5 mb-6 text-right">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary !text-[24px]">hourglass_top</span>
                        </div>
                        <div>
                            <h3 className="text-white font-bold">وقت المعالجة</h3>
                            <p className="text-primary text-sm font-bold">24 - 72 ساعة</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        سيتم إشعارك عبر التطبيق ورسالة SMS عند اكتمال مراجعة طلبك.
                    </p>
                </div>

                {/* What's Next */}
                <div className="w-full bg-surface-highlight border border-slate-700/50 rounded-2xl p-5 mb-6 text-right">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">info</span>
                        ماذا بعد؟
                    </h3>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-primary text-xs font-bold">1</span>
                            </div>
                            <p className="text-sm text-slate-300">مراجعة المستندات من فريق الدعم</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-primary text-xs font-bold">2</span>
                            </div>
                            <p className="text-sm text-slate-300">التحقق من صحة البيانات والصور</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-primary text-xs font-bold">3</span>
                            </div>
                            <p className="text-sm text-slate-300">إرسال إشعار بالنتيجة</p>
                        </div>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="w-full bg-surface-dark border border-slate-700 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">حالة الطلب</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            قيد المراجعة
                        </span>
                    </div>
                </div>

                <div className="w-full grid gap-3">
                    <Link
                        href="/verification/status"
                        className="w-full h-12 flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition shadow-lg shadow-primary/25"
                    >
                        متابعة حالة التوثيق
                    </Link>
                    <Link
                        href="/"
                        className="w-full h-12 flex items-center justify-center text-slate-400 hover:text-white active:bg-slate-800/50 font-medium text-sm rounded-xl transition"
                    >
                        العودة للرئيسية
                    </Link>
                </div>
            </div>
        </main>
    );
}
