"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";

type KnowledgeItem = {
    id: string;
    title: string;
    summary?: string | null;
    content?: string | null;
    mediaUrl?: string | null;
    coverImageUrl?: string | null;
    tags?: string[];
    createdAt: string;
};

export default function SafetyCatalogDetailPage() {
    const params = useParams();
    const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string | undefined);
    const [item, setItem] = useState<KnowledgeItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [shareUrl, setShareUrl] = useState("");
    const [copyMessage, setCopyMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                if (!id) return;
                const response = await fetch(`/api/knowledge/${id}`, { cache: "no-store" });
                const data = await response.json();
                if (response.ok) setItem(data.item || null);
            } catch (error) {
                console.error("Safety catalog detail error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchItem();
    }, [id]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setShareUrl(window.location.href);
        }
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopyMessage("تم نسخ رابط الدليل");
            setTimeout(() => setCopyMessage(null), 2000);
        } catch (error) {
            console.error("Copy link error:", error);
            setCopyMessage("تعذر نسخ الرابط");
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="تفاصيل إرشادات السلامة" />

            <main className="flex-1 flex flex-col gap-4 p-4">
                {isLoading && <p className="text-xs text-slate-500">جار التحميل...</p>}
                {!isLoading && !item && (
                    <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
                        العنصر غير متاح حالياً.
                    </div>
                )}
                {item && (
                    <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        {item.coverImageUrl ? (
                            <a href={item.coverImageUrl} target="_blank" rel="noreferrer">
                                <img src={item.coverImageUrl} alt={item.title} className="w-full h-44 object-cover" />
                            </a>
                        ) : (
                            <div className="h-44 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900"></div>
                        )}
                        <div className="p-5 space-y-3">
                            <h1 className="font-bold text-slate-900 dark:text-white text-lg">{item.title}</h1>
                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
                                {item.content || item.summary}
                            </p>
                            {item.mediaUrl && (
                                <div className="flex flex-wrap gap-2">
                                    <a href={item.mediaUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-600 underline">
                                        فتح المرفق
                                    </a>
                                    <a href={item.mediaUrl} download className="text-sm text-slate-600 underline">
                                        تنزيل المرفق
                                    </a>
                                </div>
                            )}
                            {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {item.tags.map((tag) => (
                                        <span key={tag} className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">مشاركة الدليل</h4>
                                {copyMessage && (
                                    <div className="text-xs text-emerald-600 mb-2">{copyMessage}</div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="text-xs px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700"
                                    >
                                        نسخ الرابط
                                    </button>
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-700"
                                    >
                                        واتساب
                                    </a>
                                    <a
                                        href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs px-3 py-2 rounded-xl bg-sky-500/10 text-sky-700"
                                    >
                                        تيليجرام
                                    </a>
                                    <a
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs px-3 py-2 rounded-xl bg-blue-500/10 text-blue-700"
                                    >
                                        فيسبوك
                                    </a>
                                    <a
                                        href={`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs px-3 py-2 rounded-xl bg-slate-200 text-slate-700"
                                    >
                                        X
                                    </a>
                                </div>
                            </div>
                        </div>
                    </article>
                )}
            </main>
        </div>
    );
}
