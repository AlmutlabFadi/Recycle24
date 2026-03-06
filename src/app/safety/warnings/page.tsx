"use client";

import { useEffect, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

type KnowledgeItem = {
    id: string;
    title: string;
    summary?: string | null;
    content?: string | null;
    createdAt: string;
    sourceLabel?: string | null;
};

export default function SafetyWarningsPage() {
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWarnings = async () => {
            try {
                const response = await fetch("/api/knowledge?center=SAFETY&type=WARNING&status=PUBLISHED&limit=80", {
                    cache: "no-store",
                });
                const data = await response.json();
                if (response.ok) setItems(data.items || []);
            } catch (error) {
                console.error("Safety warnings fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWarnings();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="التحذيرات والتنبيهات" />

            <main className="flex-1 flex flex-col gap-4 p-4">
                {isLoading && <p className="text-xs text-slate-500">جار التحميل...</p>}
                {!isLoading && items.length === 0 && (
                    <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
                        لا توجد تحذيرات منشورة حالياً.
                    </div>
                )}
                <div className="space-y-3">
                    {items.map((item) => (
                        <a
                            key={item.id}
                            href={`/safety/warnings/${item.id}`}
                            className="bg-white/90 dark:bg-slate-900/70 rounded-2xl p-4 border border-red-500/20 hover:shadow-md transition"
                        >
                            <div className="flex items-start gap-3">
                                <div className="size-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-[20px]">warning</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                        {item.summary || item.content}
                                    </p>
                                    {item.sourceLabel && (
                                        <p className="text-[11px] text-red-400 mt-2">مصدر: {item.sourceLabel}</p>
                                    )}
                                </div>
                                <span className="text-[10px] text-red-500 bg-red-500/10 px-2 py-1 rounded-full">عاجل</span>
                            </div>
                        </a>
                    ))}
                </div>
            </main>
        </div>
    );
}
