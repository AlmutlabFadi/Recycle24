"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type KnowledgeItem = {
    id: string;
    center: string;
    type: string;
    title: string;
    summary?: string | null;
    content?: string | null;
    mediaUrl?: string | null;
    coverImageUrl?: string | null;
    tags: string[];
    priority: number;
    status: string;
    authorName?: string | null;
    sourceLabel?: string | null;
    createdAt: string;
    updatedAt: string;
};

const CENTER_LABELS: Record<string, string> = {
    SAFETY: "مركز السلامة",
    CONSULTATIONS: "مركز الاستشارات",
    ACADEMY: "الأكاديمية",
};

const TYPE_LABELS: Record<string, string> = {
    ARTICLE: "مقال",
    VIDEO: "فيديو",
    IMAGE: "صورة",
    WARNING: "تحذير",
    INSTRUCTION: "تعليمات",
};

const STATUS_LABELS: Record<string, string> = {
    DRAFT: "مسودة",
    PUBLISHED: "منشور",
    ARCHIVED: "مؤرشف",
};

export default function KnowledgeAdminPage() {
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const isAuthorized = permissions.includes("MANAGE_KNOWLEDGE");

    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadingField, setUploadingField] = useState<"mediaUrl" | "coverImageUrl" | null>(null);

    const [filters, setFilters] = useState({ center: "", type: "", status: "" });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        center: "SAFETY",
        type: "ARTICLE",
        title: "",
        summary: "",
        content: "",
        mediaUrl: "",
        coverImageUrl: "",
        tags: "",
        priority: 0,
        status: "DRAFT",
        authorName: "",
        sourceLabel: "",
    });

    const allowedCenters = useMemo(() => {
        const centers: Array<{ value: string; label: string }> = [];
        if (permissions.includes("ACCESS_SAFETY")) centers.push({ value: "SAFETY", label: "مركز السلامة" });
        if (permissions.includes("ACCESS_CONSULTATIONS")) centers.push({ value: "CONSULTATIONS", label: "مركز الاستشارات" });
        if (permissions.includes("ACCESS_ACADEMY")) centers.push({ value: "ACADEMY", label: "الأكاديمية" });
        return centers;
    }, [permissions]);

    const stats = useMemo(() => {
        const counts = items.reduce(
            (acc, item) => {
                acc.total += 1;
                acc[item.type] = (acc[item.type] || 0) + 1;
                return acc;
            },
            { total: 0 } as Record<string, number>
        );
        return counts;
    }, [items]);

    useEffect(() => {
        if (!allowedCenters.length) return;
        setForm((prev) => ({
            ...prev,
            center: allowedCenters.some((c) => c.value === prev.center) ? prev.center : allowedCenters[0].value,
        }));
    }, [allowedCenters]);

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const response = await fetch("/api/admin/access/me", { cache: "no-store" });
                const data = await response.json();
                if (response.ok) {
                    setPermissions(data.permissions || []);
                }
            } finally {
                setIsAuthLoading(false);
            }
        };

        fetchPermissions();
    }, []);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!isAuthorized) {
            setIsLoading(false);
            return;
        }

        const fetchItems = async () => {
            try {
                setIsLoading(true);
                const params = new URLSearchParams();
                if (filters.center) params.set("center", filters.center);
                if (filters.type) params.set("type", filters.type);
                if (filters.status) params.set("status", filters.status);
                const response = await fetch(`/api/admin/knowledge?${params.toString()}`, {
                    cache: "no-store",
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || "تعذر تحميل البيانات");
                }
                setItems(data.items || []);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, [filters, isAuthorized, isAuthLoading]);

    const resetForm = () => {
        setEditingId(null);
        setForm({
            center: allowedCenters[0]?.value || "SAFETY",
            type: "ARTICLE",
            title: "",
            summary: "",
            content: "",
            mediaUrl: "",
            coverImageUrl: "",
            tags: "",
            priority: 0,
            status: "DRAFT",
            authorName: "",
            sourceLabel: "",
        });
    };

    const handleSubmit = async () => {
        try {
            setError(null);
            const payload = {
                ...form,
                tags: form.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                priority: Number(form.priority) || 0,
            };

            const response = await fetch(
                editingId ? `/api/admin/knowledge/${editingId}` : "/api/admin/knowledge",
                {
                    method: editingId ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "تعذر حفظ المحتوى");
            }

            resetForm();
            setFilters((prev) => ({ ...prev }));
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    const uploadFile = async (file: File, field: "mediaUrl" | "coverImageUrl") => {
        try {
            setUploadingField(field);
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "تعذر رفع الملف");
            }
            setForm((prev) => ({ ...prev, [field]: data.url }));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        } finally {
            setUploadingField(null);
        }
    };

    const handleEdit = (item: KnowledgeItem) => {
        setEditingId(item.id);
        setForm({
            center: item.center,
            type: item.type,
            title: item.title,
            summary: item.summary || "",
            content: item.content || "",
            mediaUrl: item.mediaUrl || "",
            coverImageUrl: item.coverImageUrl || "",
            tags: (item.tags || []).join(", "),
            priority: item.priority || 0,
            status: item.status || "DRAFT",
            authorName: item.authorName || "",
            sourceLabel: item.sourceLabel || "",
        });
    };

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm("هل تريد حذف هذا المحتوى؟ لا يمكن التراجع.");
        if (!confirmed) return;
        try {
            const response = await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "تعذر حذف المحتوى");
            }
            setItems((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    const handleStatusToggle = async (item: KnowledgeItem) => {
        const nextStatus = item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
        try {
            const response = await fetch(`/api/admin/knowledge/${item.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "تعذر تحديث الحالة");
            }
            setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, status: nextStatus } : entry)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-bg-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-400"></div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-bg-dark text-white flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined !text-6xl text-slate-600 mb-4">lock</span>
                <h1 className="text-xl font-bold mb-2">وصول مقيد</h1>
                <p className="text-slate-400 mb-6">
                    هذا القسم مخصص لإدارة المحتوى الأكاديمي والمعرفي.
                </p>
                <Link href="/dashboard" className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold">
                    العودة للوحة التحكم
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-dark text-white font-display">
            <header className="sticky top-0 z-40 backdrop-blur-md bg-bg-dark/80 border-b border-slate-800">
                <div className="px-4 py-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold">لوحة المحتوى الأكاديمي</h1>
                            <p className="text-xs text-slate-400">إدارة السلامة، الاستشارات، والأكاديمية بمستوى احترافي</p>
                        </div>
                        <Link href="/dashboard" className="text-xs text-emerald-400 font-bold">
                            العودة للوحة التحكم
                        </Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="text-[11px] bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-full">
                            إجمالي العناصر: {stats.total || 0}
                        </span>
                        <span className="text-[11px] bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
                            مقالات: {stats.ARTICLE || 0}
                        </span>
                        <span className="text-[11px] bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
                            تحذيرات: {stats.WARNING || 0}
                        </span>
                        <span className="text-[11px] bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
                            تعليمات: {stats.INSTRUCTION || 0}
                        </span>
                    </div>
                </div>
            </header>

            <main className="p-4 pb-20 flex flex-col gap-6">
                <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900/30 rounded-2xl border border-slate-800 p-4 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-emerald-400 !text-3xl">library_books</span>
                        <div>
                            <h2 className="font-bold">إضافة محتوى جديد</h2>
                            <p className="text-xs text-slate-400">أضف مقالات، تحذيرات، تعليمات، صور أو فيديوهات تعليمية.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col gap-1 text-xs">
                            المركز
                            <select
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                value={form.center}
                                onChange={(e) => setForm((prev) => ({ ...prev, center: e.target.value }))}
                            >
                                {allowedCenters.map((center) => (
                                    <option key={center.value} value={center.value}>
                                        {center.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="flex flex-col gap-1 text-xs">
                            نوع المحتوى
                            <select
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                value={form.type}
                                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                            >
                                <option value="ARTICLE">مقال</option>
                                <option value="WARNING">تحذير</option>
                                <option value="INSTRUCTION">تعليمات</option>
                                <option value="VIDEO">فيديو</option>
                                <option value="IMAGE">صورة</option>
                            </select>
                        </label>

                        <label className="flex flex-col gap-1 text-xs md:col-span-2">
                            العنوان
                            <input
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                value={form.title}
                                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-xs md:col-span-2">
                            ملخص تنفيذي
                            <input
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                value={form.summary}
                                onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-xs md:col-span-2">
                            النص / التعليمات التفصيلية
                            <textarea
                                rows={5}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                value={form.content}
                                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-xs">
                            رابط الوسائط (صورة/فيديو)
                            <div className="flex flex-col gap-2">
                                <input
                                    type="url"
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                    placeholder="https://..."
                                    value={form.mediaUrl}
                                    onChange={(e) => setForm((prev) => ({ ...prev, mediaUrl: e.target.value }))}
                                />
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadFile(file, "mediaUrl");
                                    }}
                                    className="text-[11px] text-slate-400"
                                />
                                {uploadingField === "mediaUrl" && (
                                    <span className="text-[11px] text-emerald-300">جاري رفع الوسائط...</span>
                                )}
                            </div>
                        </label>

                        <label className="flex flex-col gap-1 text-xs">
                            صورة الغلاف
                            <div className="flex flex-col gap-2">
                                <input
                                    type="url"
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                    placeholder="https://..."
                                    value={form.coverImageUrl}
                                    onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadFile(file, "coverImageUrl");
                                    }}
                                    className="text-[11px] text-slate-400"
                                />
                                {uploadingField === "coverImageUrl" && (
                                    <span className="text-[11px] text-emerald-300">جاري رفع صورة الغلاف...</span>
                                )}
                            </div>
                        </label>

                        <label className="flex flex-col gap-1 text-xs">
                            وسوم (مفصولة بفواصل)
                            <input
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                placeholder="سلامة, معدات, طوارئ"
                                value={form.tags}
                                onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-xs">
                            أولوية التحذير
                            <input
                                type="number"
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                value={form.priority}
                                onChange={(e) => setForm((prev) => ({ ...prev, priority: Number(e.target.value) }))}
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-xs">
                            الحالة
                            <select
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                value={form.status}
                                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="DRAFT">مسودة</option>
                                <option value="PUBLISHED">منشور</option>
                                <option value="ARCHIVED">مؤرشف</option>
                            </select>
                        </label>

                        <label className="flex flex-col gap-1 text-xs">
                            اسم المحرر/الأكاديمي
                            <input
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                value={form.authorName}
                                onChange={(e) => setForm((prev) => ({ ...prev, authorName: e.target.value }))}
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-xs">
                            مصدر المحتوى
                            <input
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                value={form.sourceLabel}
                                onChange={(e) => setForm((prev) => ({ ...prev, sourceLabel: e.target.value }))}
                            />
                        </label>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            onClick={handleSubmit}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold text-sm"
                        >
                            {editingId ? "تحديث المحتوى" : "حفظ المحتوى"}
                        </button>
                        {editingId && (
                            <button
                                onClick={resetForm}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2 rounded-lg text-sm"
                            >
                                إلغاء التعديل
                            </button>
                        )}
                        {error && <span className="text-xs text-red-400">{error}</span>}
                    </div>
                </section>

                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-amber-400">filter_alt</span>
                            <h3 className="font-bold">تصفية المحتوى</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <select
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                value={filters.center}
                                onChange={(e) => setFilters((prev) => ({ ...prev, center: e.target.value }))}
                            >
                                <option value="">كل المراكز</option>
                                {allowedCenters.map((center) => (
                                    <option key={center.value} value={center.value}>
                                        {center.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                value={filters.type}
                                onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                            >
                                <option value="">كل الأنواع</option>
                                <option value="ARTICLE">مقال</option>
                                <option value="WARNING">تحذير</option>
                                <option value="INSTRUCTION">تعليمات</option>
                                <option value="VIDEO">فيديو</option>
                                <option value="IMAGE">صورة</option>
                            </select>
                            <select
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                                value={filters.status}
                                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="">كل الحالات</option>
                                <option value="PUBLISHED">منشور</option>
                                <option value="DRAFT">مسودة</option>
                                <option value="ARCHIVED">مؤرشف</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold">سجل المحتوى</h3>
                        <span className="text-xs text-slate-400">{items.length} عنصر</span>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 bg-slate-900/60 rounded-xl border border-slate-800">
                            <span className="material-symbols-outlined !text-5xl text-slate-600 mb-3">folder_open</span>
                            <p className="text-slate-400">لا يوجد محتوى مطابق للتصفية الحالية</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {items.map((item) => (
                                <div key={item.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300">
                                                    {CENTER_LABELS[item.center] || item.center}
                                                </span>
                                                <span className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                                                    {TYPE_LABELS[item.type] || item.type}
                                                </span>
                                                <span className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                                                    {STATUS_LABELS[item.status] || item.status}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-white mb-1">{item.title}</h4>
                                            <p className="text-xs text-slate-400 line-clamp-2">{item.summary || item.content}</p>
                                        </div>
                                        {item.coverImageUrl && (
                                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                                                <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>

                                    {(item.type === "VIDEO" || item.type === "IMAGE") && item.mediaUrl && (
                                        <div className="mt-3 rounded-xl overflow-hidden border border-slate-800">
                                            {item.type === "VIDEO" ? (
                                                <video src={item.mediaUrl} controls className="w-full h-40 object-cover" />
                                            ) : (
                                                <img src={item.mediaUrl} alt={item.title} className="w-full h-40 object-cover" />
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {(item.tags || []).map((tag) => (
                                            <span key={tag} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="text-xs bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg"
                                        >
                                            تعديل
                                        </button>
                                        <button
                                            onClick={() => handleStatusToggle(item)}
                                            className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg"
                                        >
                                            {item.status === "PUBLISHED" ? "إخفاء" : "نشر"}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-xs bg-red-500/10 text-red-300 px-3 py-1.5 rounded-lg"
                                        >
                                            حذف
                                        </button>
                                        <div className="text-[10px] text-slate-500 ml-auto">
                                            تحديث: {new Date(item.updatedAt).toLocaleDateString("ar-SY")}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
