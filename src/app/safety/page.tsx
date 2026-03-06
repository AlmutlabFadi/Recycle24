"use client";

import { useEffect, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import Link from "next/link";

type SafetyStats = {
    incidentsOpen: number;
    trainingsUpcoming: number;
    checklistSubmissions: number;
    avgScore: number;
};

export default function SafetyPage() {
    const [stats, setStats] = useState<SafetyStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userChecklistScore, setUserChecklistScore] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, summaryRes] = await Promise.all([
                    fetch("/api/safety/overview", { cache: "no-store" }),
                    fetch("/api/safety/checklists/summary", { cache: "no-store" }),
                ]);

                const statsData = await statsRes.json();
                const summaryData = await summaryRes.json();

                if (statsRes.ok) setStats(statsData.stats || null);
                if (summaryRes.ok) setUserChecklistScore(summaryData.latestScore ?? null);
            } catch (error) {
                console.error("Safety fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="مركز السلامة والتوعية" />

            <main className="flex-1 flex flex-col gap-6 p-4">
                <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950/40 p-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#fef3c7_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_top,#1f2937_1px,transparent_1px)] [background-size:18px_18px] opacity-60"></div>
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-amber-500 text-white p-2 rounded-xl shrink-0">
                                <span className="material-symbols-outlined !text-[28px]">health_and_safety</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">بوابة السلامة الوطنية لساحات الخردة</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    مركز تفاعلي يرسل التحذيرات ويقدّم التدريب ويوثق البلاغات لحماية الأرواح والتجار والمجتمع.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/80 dark:bg-slate-900/70 rounded-2xl p-3 border border-amber-200/60 dark:border-amber-500/20">
                                <p className="text-xs text-amber-600 dark:text-amber-300">بلاغات مفتوحة</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    {stats ? stats.incidentsOpen : "—"}
                                </p>
                            </div>
                            <div className="bg-white/80 dark:bg-slate-900/70 rounded-2xl p-3 border border-emerald-200/60 dark:border-emerald-500/20">
                                <p className="text-xs text-emerald-600 dark:text-emerald-300">تدريبات قادمة</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    {stats ? stats.trainingsUpcoming : "—"}
                                </p>
                            </div>
                            <div className="bg-white/80 dark:bg-slate-900/70 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700/50">
                                <p className="text-xs text-slate-500 dark:text-slate-300">تقييمات جاهزية</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    {stats ? stats.checklistSubmissions : "—"}
                                </p>
                            </div>
                            <div className="bg-white/80 dark:bg-slate-900/70 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700/50">
                                <p className="text-xs text-slate-500 dark:text-slate-300">نتيجة جاهزيتك</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    {userChecklistScore !== null ? `${userChecklistScore}%` : "—"}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-300 px-3 py-1 rounded-full">
                                تحديثات فورية
                            </span>
                            <span className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-3 py-1 rounded-full">
                                بلاغات موثقة
                            </span>
                            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
                                شهادات تدريب معتمدة
                            </span>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 dark:text-white">بوابة الأقسام</h3>
                        <span className="text-xs text-slate-400">انتقل بسرعة لكل قسم</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { title: "البلاغات", desc: "تسجيل البلاغات وسجل الحالات", href: "/safety/incidents", icon: "assignment", color: "text-red-600", bg: "bg-red-500/10" },
                            { title: "الدورات", desc: "التدريب وطلبات الحجز", href: "/safety/trainings", icon: "school", color: "text-emerald-600", bg: "bg-emerald-500/10" },
                            { title: "التحذيرات", desc: "تنبيهات عاجلة", href: "/safety/warnings", icon: "warning", color: "text-amber-600", bg: "bg-amber-500/10" },
                            { title: "كتالوج السلامة", desc: "إرشادات للمخاطر", href: "/safety/catalog", icon: "menu_book", color: "text-emerald-700", bg: "bg-emerald-500/10" },
                            { title: "الأخبار", desc: "تحديثات وتقارير", href: "/safety/news", icon: "newspaper", color: "text-blue-600", bg: "bg-blue-500/10" },
                            { title: "مدونة السلامة", desc: "كل المحتوى بصفحة واحدة", href: "/safety/library", icon: "library_books", color: "text-indigo-600", bg: "bg-indigo-500/10" },
                        ].map((card) => (
                            <a key={card.title} href={card.href} className="bg-white dark:bg-surface-highlight p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col gap-2 hover:shadow-md transition">
                                <div className={`size-11 rounded-full ${card.bg} ${card.color} flex items-center justify-center`}>
                                    <span className="material-symbols-outlined !text-[22px]">{card.icon}</span>
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{card.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{card.desc}</p>
                            </a>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 dark:text-white">مهام فورية</h3>
                        <span className="text-xs text-slate-400">إجراءات سريعة عند الحاجة</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/safety/incidents" className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-right flex flex-col gap-2 hover:bg-red-500/15 transition">
                            <span className="material-symbols-outlined text-red-500 !text-[24px]">warning</span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">بلاغ خطر عاجل</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">سجل موقع الخطر فوراً</span>
                        </Link>
                        <Link href="/safety/trainings" className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-right flex flex-col gap-2 hover:bg-emerald-500/15 transition">
                            <span className="material-symbols-outlined text-emerald-500 !text-[24px]">school</span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">طلب تدريب ميداني</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">حجز مقعد أو طلب زيارة</span>
                        </Link>
                        <Link href="/safety/checklists" className="bg-slate-200/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-right flex flex-col gap-2 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition">
                            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 !text-[24px]">checklist</span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">تقييم الجاهزية</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">قائمة فحص تشغيلية</span>
                        </Link>
                        <Link href="/safety/library" className="bg-slate-200/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-right flex flex-col gap-2 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition">
                            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 !text-[24px]">play_circle</span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">وسائط توعوية</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">مواد إرشادية مرئية</span>
                        </Link>
                    </div>
                </section>

                <section className="bg-slate-900 dark:bg-black rounded-2xl p-5 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-amber-500/10"></div>
                    <h3 className="text-white font-bold mb-2 relative z-10">هل وجدت جسماً مشبوهاً؟</h3>
                    <p className="text-slate-400 text-sm mb-4 relative z-10">
                        لا تقترب. لا تلمس. بلغ السلطات المختصة فوراً.
                    </p>
                    <a
                        href="tel:112"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors relative z-10"
                    >
                        <span className="material-symbols-outlined !text-[20px]">call</span>
                        <span>اتصال بالطوارئ (112)</span>
                    </a>
                </section>
            </main>
        </div>
    );
}
