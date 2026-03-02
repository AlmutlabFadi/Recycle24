"use client";

import { useEffect, useMemo, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

type KnowledgeItem = {
    id: string;
    center: string;
    type: string;
    title: string;
    summary?: string | null;
    content?: string | null;
    mediaUrl?: string | null;
    coverImageUrl?: string | null;
    tags?: string[];
    createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
    ARTICLE: "خبر",
    WARNING: "تحذير",
    INSTRUCTION: "كتالوج",
    VIDEO: "فيديو",
    IMAGE: "صورة",
};

const TYPE_COLORS: Record<string, string> = {
    ARTICLE: "bg-blue-500/10 text-blue-700",
    WARNING: "bg-red-500/10 text-red-700",
    INSTRUCTION: "bg-emerald-500/10 text-emerald-700",
    VIDEO: "bg-violet-500/10 text-violet-700",
    IMAGE: "bg-amber-500/10 text-amber-700",
};

const getItemLink = (item: KnowledgeItem) => {
    if (item.type === "WARNING") return `/safety/warnings/${item.id}`;
    if (item.type === "ARTICLE") return `/safety/news/${item.id}`;
    if (item.type === "INSTRUCTION") return `/safety/catalog/${item.id}`;
    return `/safety/library/${item.id}`;
};

export default function SafetyLibraryPage() {
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [tagFilter, setTagFilter] = useState("ALL");

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch("/api/knowledge?center=SAFETY&status=PUBLISHED&limit=100", {
                    cache: "no-store",
                });
                const data = await response.json();
                if (response.ok) setItems(data.items || []);
            } catch (error) {
                console.error("Safety library fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, []);

    const allTags = useMemo(() => {
        const set = new Set<string>();
        items.forEach((item) => item.tags?.forEach((tag) => set.add(tag)));
        return Array.from(set).slice(0, 25);
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
            if (tagFilter !== "ALL" && !(item.tags || []).includes(tagFilter)) return false;
            if (query) {
                const hay = `${item.title} ${item.summary || ""} ${item.content || ""}`.toLowerCase();
                if (!hay.includes(query.toLowerCase())) return false;
            }
            return true;
        });
    }, [items, typeFilter, tagFilter, query]);

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="مدونة السلامة" />

            <main className="flex-1 flex flex-col gap-4 p-4">
                <section className="bg-white dark:bg-surface-highlight p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <div className="flex flex-col md:flex-row gap-2">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="ابحث في الأخبار والتحذيرات والكتالوج"
                            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-900 dark:text-slate-100"
                        />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-900 dark:text-slate-100"
                        >
                            <option value="ALL">كل الأقسام</option>
                            <option value="ARTICLE">الأخبار</option>
                            <option value="WARNING">التحذيرات</option>
                            <option value="INSTRUCTION">الكتالوج</option>
                            <option value="VIDEO">الفيديو</option>
                            <option value="IMAGE">الصور</option>
                        </select>
                        <select
                            value={tagFilter}
                            onChange={(e) => setTagFilter(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-900 dark:text-slate-100"
                        >
                            <option value="ALL">كل الوسوم</option>
                            {allTags.map((tag) => (
                                <option key={tag} value={tag}>
                                    {tag}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                {isLoading && <p className="text-xs text-slate-500">جار التحميل...</p>}
                {!isLoading && filteredItems.length === 0 && (
                    <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
                        لا توجد نتائج مطابقة حالياً.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredItems.map((item) => (
                        <a
                            key={item.id}
                            href={getItemLink(item)}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition"
                        >
                            {item.coverImageUrl ? (
                                <img src={item.coverImageUrl} alt={item.title} className="w-full h-36 object-cover" />
                            ) : (
                                <div className="h-36 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900"></div>
                            )}
                            <div className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] px-2 py-1 rounded-full ${TYPE_COLORS[item.type] || "bg-slate-100 text-slate-600"}`}>
                                        {TYPE_LABELS[item.type] || item.type}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                        {new Date(item.createdAt).toLocaleDateString("ar-SY")}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                                    {item.summary || item.content}
                                </p>
                                {item.tags && item.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {item.tags.slice(0, 3).map((tag) => (
                                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </a>
                    ))}
                </div>
            </main>
        </div>
    );
}
