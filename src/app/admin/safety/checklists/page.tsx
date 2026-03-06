"use client";

import { useEffect, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

type ChecklistSubmission = {
    id: string;
    checklistName: string;
    score: number;
    notes?: string | null;
    createdAt: string;
    user?: {
        id: string;
        name?: string | null;
        phone?: string | null;
        companyName?: string | null;
        userType?: string | null;
    } | null;
};

export default function AdminSafetyChecklistsPage() {
    const [submissions, setSubmissions] = useState<ChecklistSubmission[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubmissions = async (query?: string) => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (query) params.set("search", query);
            const response = await fetch(`/api/admin/safety/checklists?${params.toString()}`, { cache: "no-store" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "تعذر تحميل التقييمات");
            setSubmissions(data.submissions || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="إدارة تقييمات الجاهزية" />

            <main className="flex-1 flex flex-col gap-4 p-4">
                <section className="bg-white dark:bg-surface-highlight p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <div className="flex flex-col md:flex-row gap-2">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ابحث بالاسم أو الهاتف"
                            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        />
                        <button
                            onClick={() => fetchSubmissions(search)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl"
                        >
                            بحث
                        </button>
                    </div>
                </section>

                {error && (
                    <div className="rounded-2xl p-4 text-sm border bg-red-500/10 border-red-500/20 text-red-600">
                        {error}
                    </div>
                )}
                {isLoading && <p className="text-xs text-slate-500">جار التحميل...</p>}

                <section className="space-y-2">
                    {submissions.map((submission) => (
                        <div key={submission.id} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{submission.checklistName}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {submission.user?.name || "مستخدم"} • {submission.user?.phone || "لا يوجد"}
                                        {submission.user?.companyName ? ` • ${submission.user.companyName}` : ""}
                                    </p>
                                </div>
                                <span className="text-sm font-bold text-emerald-600">{submission.score}%</span>
                            </div>
                            {submission.notes && <p className="text-xs text-slate-500 mt-2">ملاحظات: {submission.notes}</p>}
                            <p className="text-[11px] text-slate-400 mt-2">
                                {new Date(submission.createdAt).toLocaleString("ar-SY")}
                            </p>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}
