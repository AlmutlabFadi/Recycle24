"use client";

import { useEffect, useMemo, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

type KnowledgeItem = {
    id: string;
    type: string;
    title: string;
    summary?: string | null;
    content?: string | null;
    mediaUrl?: string | null;
    coverImageUrl?: string | null;
    tags?: string[];
    priority?: number;
    authorName?: string | null;
    sourceLabel?: string | null;
    createdAt: string;
};

const fallbackWarnings: KnowledgeItem[] = [
    {
        id: "fallback-1",
        type: "WARNING",
        title: "تحذير عالي الخطورة: مخلفات الحرب",
        summary: "يمنع منعاً باتاً التعامل مع الأجسام المشبوهة أو الذخائر غير المنفجرة.",
        content: "إذا لاحظت جسماً غريباً، ابتعد فوراً وابلغ الجهات المختصة دون لمسه.",
        createdAt: new Date().toISOString(),
    },
];

export default function SafetyPage() {
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchKnowledge = async () => {
            try {
                const response = await fetch("/api/knowledge?center=SAFETY&status=PUBLISHED&limit=60", {
                    cache: "no-store",
                });
                const data = await response.json();
                if (response.ok) {
                    setItems(data.items || []);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchKnowledge();
    }, []);

    const { warnings, instructions, articles, media } = useMemo(() => {
        const warnings = items.filter((item) => item.type === "WARNING");
        const instructions = items.filter((item) => item.type === "INSTRUCTION");
        const articles = items.filter((item) => item.type === "ARTICLE");
        const media = items.filter((item) => item.type === "VIDEO" || item.type === "IMAGE");
        return {
            warnings: warnings.length ? warnings : fallbackWarnings,
            instructions,
            articles,
            media,
        };
    }, [items]);

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="مركز السلامة والتوعية" />

            <main className="flex-1 flex flex-col gap-6 p-4">
                <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950/40 p-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#fef3c7_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_top,#1f2937_1px,transparent_1px)] [background-size:18px_18px] opacity-60"></div>
                    <div className="relative z-10 flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                            <div className="bg-amber-500 text-white p-2 rounded-xl shrink-0">
                                <span className="material-symbols-outlined !text-[28px]">health_and_safety</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">دليل السلامة المهني</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    معايير أكاديمية وإرشادات ميدانية لحماية العاملين وتقليل المخاطر في بيئات الخردة.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-300 px-3 py-1 rounded-full">
                                تحديثات أسبوعية
                            </span>
                            <span className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-3 py-1 rounded-full">
                                إشراف أكاديمي
                            </span>
                            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
                                تنبيهات عالية الدقة
                            </span>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-3">
                    {[
                        { icon: "masks", title: "معدات الوقاية", desc: "خوذات، أقنعة، قفازات معتمدة", color: "text-amber-500", bg: "bg-amber-500/10" },
                        { icon: "science", title: "المواد الخطرة", desc: "عزل البطاريات والمواد الكيميائية", color: "text-sky-500", bg: "bg-sky-500/10" },
                        { icon: "recycling", title: "الفرز الذكي", desc: "تصنيف المعادن لرفع السلامة", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { icon: "local_shipping", title: "النقل الآمن", desc: "تثبيت الأحمال والتحقق الدوري", color: "text-orange-500", bg: "bg-orange-500/10" },
                    ].map((card) => (
                        <div
                            key={card.title}
                            className="bg-white dark:bg-surface-highlight p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col gap-2"
                        >
                            <div className={`size-11 rounded-full ${card.bg} ${card.color} flex items-center justify-center`}>
                                <span className="material-symbols-outlined !text-[22px]">{card.icon}</span>
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{card.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{card.desc}</p>
                        </div>
                    ))}
                </section>

                <section className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-red-500 flex items-center gap-2">
                            <span className="material-symbols-outlined !text-[20px]">warning</span>
                            تحذيرات عاجلة
                        </h3>
                        {isLoading && <span className="text-xs text-red-300">جار التحميل</span>}
                    </div>
                    <div className="space-y-3">
                        {warnings.slice(0, 3).map((warning) => (
                            <div key={warning.id} className="bg-white/80 dark:bg-slate-900/70 rounded-xl p-3 border border-red-500/10">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{warning.title}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                    {warning.summary || warning.content}
                                </p>
                                {(warning.sourceLabel || warning.authorName) && (
                                    <p className="text-[11px] text-red-400 mt-2">
                                        {warning.sourceLabel ? `مصدر: ${warning.sourceLabel}` : `إعداد: ${warning.authorName}`}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 dark:text-white">تعليمات السلامة الميدانية</h3>
                        <span className="text-xs text-slate-400">أدلة عملية مختصرة</span>
                    </div>
                    <div className="space-y-3">
                        {(instructions.length ? instructions : [
                            {
                                id: "fallback-instruction",
                                type: "INSTRUCTION",
                                title: "بروتوكول الفحص البصري الأولي",
                                summary: "افحص الأحمال من مسافة آمنة، وحدد أي جسم غير مألوف قبل التحريك.",
                                createdAt: new Date().toISOString(),
                            },
                        ]).slice(0, 4).map((instruction) => (
                            <div
                                key={instruction.id}
                                className="bg-white dark:bg-surface-highlight rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined !text-[20px]">checklist</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{instruction.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {instruction.summary || instruction.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 dark:text-white">مقالات وتوصيات أكاديمية</h3>
                        <span className="text-xs text-slate-400">تحليل مخاطر وتحديثات تشريعية</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(articles.length ? articles : [
                            {
                                id: "fallback-article",
                                type: "ARTICLE",
                                title: "إدارة المخاطر في ساحات الخردة",
                                summary: "منهجية تقييم المخاطر وتقليل الحوادث وفق معايير السلامة الدولية.",
                                createdAt: new Date().toISOString(),
                            },
                        ]).slice(0, 4).map((article) => (
                            <div
                                key={article.id}
                                className="bg-white dark:bg-surface-highlight rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden"
                            >
                                {article.coverImageUrl ? (
                                    <img src={article.coverImageUrl} alt={article.title} className="w-full h-32 object-cover" />
                                ) : (
                                    <div className="h-32 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900"></div>
                                )}
                                <div className="p-4">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2">{article.title}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                        {article.summary || article.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 dark:text-white">وسائط توعوية</h3>
                        <span className="text-xs text-slate-400">فيديوهات وصور ميدانية</span>
                    </div>
                    {media.length === 0 ? (
                        <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
                            لا توجد وسائط منشورة حالياً.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {media.slice(0, 4).map((item) => (
                                <div key={item.id} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                    {item.type === "VIDEO" && item.mediaUrl ? (
                                        <video src={item.mediaUrl} controls className="w-full h-48 object-cover" />
                                    ) : (
                                        <img src={item.mediaUrl || ""} alt={item.title} className="w-full h-48 object-cover" />
                                    )}
                                    <div className="p-3">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.summary}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <div className="mt-auto bg-slate-900 dark:bg-black rounded-2xl p-5 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-amber-500/10"></div>
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
