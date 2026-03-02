"use client";

import { useEffect, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

type KnowledgeItem = {
    id: string;
    title: string;
    summary?: string | null;
    content?: string | null;
    createdAt: string;
};

const hazardCatalog = [
    {
        title: "المواد الكيميائية الخطرة",
        desc: "الرموز التحذيرية، التخزين الآمن، وخطط العزل",
        icon: "science",
        color: "text-sky-600",
        bg: "bg-sky-500/10",
    },
    {
        title: "المواد المشعة",
        desc: "مؤشرات الإشعاع، مسافات الأمان، وبروتوكولات التبليغ",
        icon: "radiation",
        color: "text-amber-600",
        bg: "bg-amber-500/10",
    },
    {
        title: "الذخائر غير المنفجرة",
        desc: "سلوكيات تجنب المخاطر ومسارات الإبلاغ الآمن",
        icon: "bomb",
        color: "text-red-600",
        bg: "bg-red-500/10",
    },
    {
        title: "الألغام والمخلفات الحربية",
        desc: "تحديد العلامات الميدانية والإخلاء الفوري",
        icon: "crisis_alert",
        color: "text-orange-600",
        bg: "bg-orange-500/10",
    },
    {
        title: "السلامة الكهربائية",
        desc: "عزل التيار، التأريض، وتعليمات العمل الآمن",
        icon: "bolt",
        color: "text-indigo-600",
        bg: "bg-indigo-500/10",
    },
    {
        title: "السلامة الميكانيكية",
        desc: "آلات القص والضغط، الحواجز، وإجراءات الإغلاق",
        icon: "precision_manufacturing",
        color: "text-emerald-600",
        bg: "bg-emerald-500/10",
    },
];

export default function SafetyCatalogPage() {
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const response = await fetch("/api/knowledge?center=SAFETY&type=INSTRUCTION&status=PUBLISHED&limit=80", {
                    cache: "no-store",
                });
                const data = await response.json();
                if (response.ok) setItems(data.items || []);
            } catch (error) {
                console.error("Safety catalog fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCatalog();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="كتالوج السلامة" />

            <main className="flex-1 flex flex-col gap-5 p-4">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {hazardCatalog.map((item) => (
                        <div
                            key={item.title}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex gap-3"
                        >
                            <div className={`size-11 rounded-full ${item.bg} ${item.color} flex items-center justify-center`}>
                                <span className="material-symbols-outlined !text-[22px]">{item.icon}</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 dark:text-white">تعليمات وإجراءات السلامة</h3>
                        <span className="text-xs text-slate-400">أدلة عملية مختصرة</span>
                    </div>
                    {isLoading && <p className="text-xs text-slate-500">جار التحميل...</p>}
                    {!isLoading && items.length === 0 && (
                        <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
                            لا توجد تعليمات منشورة حالياً.
                        </div>
                    )}
                    <div className="space-y-3">
                        {items.map((item) => (
                            <a
                                key={item.id}
                                href={`/safety/catalog/${item.id}`}
                                className="bg-white dark:bg-surface-highlight rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined !text-[20px]">fact_check</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {item.summary || item.content}
                                        </p>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
