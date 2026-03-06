"use client";

import { useEffect, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

type KnowledgeItem = {
    id: string;
    title: string;
    summary?: string | null;
    content?: string | null;
    coverImageUrl?: string | null;
    createdAt: string;
};

export default function SafetyNewsPage() {
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch("/api/knowledge?center=SAFETY&type=ARTICLE&status=PUBLISHED&limit=50", {
                    cache: "no-store",
                });
                const data = await response.json();
                if (response.ok) setItems(data.items || []);
            } catch (error) {
                console.error("Safety news fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNews();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="الأخبار والتحديثات" />

            <main className="flex-1 flex flex-col gap-4 p-4">
                {isLoading && <p className="text-xs text-slate-500">جار التحميل...</p>}
                {!isLoading && items.length === 0 && (
                    <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
                        لا توجد أخبار منشورة حالياً.
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((item) => (
                        <a
                            key={item.id}
                            href={`/safety/news/${item.id}`}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition"
                        >
                            {item.coverImageUrl ? (
                                <img src={item.coverImageUrl} alt={item.title} className="w-full h-36 object-cover" />
                            ) : (
                                <div className="h-36 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900"></div>
                            )}
                            <div className="p-4">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">{item.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                                    {item.summary || item.content}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            </main>
        </div>
    );
}
