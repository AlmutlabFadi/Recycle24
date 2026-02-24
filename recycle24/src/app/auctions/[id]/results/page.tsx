"use client";

import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

export default function AuctionResultsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-[url('https://lottie.host/embed/a9f9d789-5374-4246-8149-654320290521/11l8211119.json')] opacity-30"></div>
            </div>

            <HeaderWithBack title="نتائج المزاد" />

            <main className="flex-1 px-4 py-6 flex flex-col items-center justify-center relative z-10">
                {/* Winner Card */}
                <div className="w-full bg-surface-highlight border border-yellow-500/30 rounded-2xl p-6 text-center shadow-[0_0_30px_-5px_rgba(234,179,8,0.15)] mb-6 animate-slide-up">
                    <div className="size-20 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.4)] animate-bounce">
                        <span className="material-symbols-outlined !text-[40px]">emoji_events</span>
                    </div>

                    <h2 className="text-2xl font-black text-white mb-1">مبارك! ربحت المزاد 🎉</h2>
                    <p className="text-sm text-slate-400 mb-6">لقد قدمت أعلى عرض وتم تثبيت المزاد باسمك.</p>

                    <div className="bg-bg-dark/50 rounded-xl p-4 border border-white/5 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-12 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-slate-400 !text-[24px]">hardware</span>
                            </div>
                            <div className="text-right">
                                <h3 className="font-bold text-white text-sm">دفعة #402: 20 طن نحاس</h3>
                                <p className="text-xs text-slate-500">حلب - المنطقة الصناعية</p>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">سعر المزاد النهائي</span>
                                <span className="text-white font-bold font-english dir-ltr">45,300,000 <span className="text-xs text-primary">ل.س</span></span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">عمولة المنصة (1%)</span>
                                <span className="text-white font-bold font-english dir-ltr">453,000 <span className="text-xs text-primary">ل.س</span></span>
                            </div>
                            <div className="flex justify-between items-center text-base pt-2 border-t border-white/10 mt-2">
                                <span className="text-white font-bold">الإجمالي للمدفوعات</span>
                                <span className="text-green-500 font-bold font-english dir-ltr text-lg">45,753,000 <span className="text-xs">ل.س</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-600/20 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">payments</span>
                            دفع العربون وإتمام الصفقة
                        </button>
                        <Link href="/auctions" className="w-full bg-slate-700 text-white py-3.5 rounded-xl font-bold hover:bg-slate-600 transition">
                            تصفح مزادات أخرى
                        </Link>
                    </div>
                </div>

                {/* Important Notice */}
                <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
                    <span className="material-symbols-outlined text-blue-400 shrink-0">info</span>
                    <div>
                        <h4 className="font-bold text-white text-sm mb-1">تعليمات الاستلام</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            يرجى إتمام دفع العربون خلال 24 ساعة لضمان حقك في الشحنة. سيتم تزويدك بمعلومات الاتصال بالبائع وموقع الاستلام الدقيق بعد الدفع.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
