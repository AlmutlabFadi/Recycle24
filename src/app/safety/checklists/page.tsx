"use client";

import { useEffect, useMemo, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

const checklistItems = [
    { id: "ppe-helmet", label: "خوذة واقية معتمدة لكل عامل", group: "معدات الوقاية" },
    { id: "ppe-gloves", label: "قفازات مقاومة للقطع والحرارة", group: "معدات الوقاية" },
    { id: "ppe-mask", label: "كمامة أو قناع عند الغبار أو الأبخرة", group: "معدات الوقاية" },
    { id: "hazard-segregation", label: "فصل المواد الخطرة عن المعادن النظيفة", group: "المواد الخطرة" },
    { id: "hazard-labels", label: "بطاقات تعريف وتحذير على الحاويات", group: "المواد الخطرة" },
    { id: "fire-ext", label: "طفايات حريق صالحة وسهلة الوصول", group: "الطوارئ" },
    { id: "emergency-exit", label: "مخارج إخلاء واضحة ومضاءة", group: "الطوارئ" },
    { id: "machine-guards", label: "واقيات سلامة على آلات القص والضغط", group: "المعدات" },
    { id: "load-secure", label: "تثبيت الأحمال قبل النقل الداخلي", group: "النقل الداخلي" },
    { id: "daily-brief", label: "إيجاز سلامة يومي للفريق", group: "الإدارة" },
];

const getScoreLabel = (score: number) => {
    if (score >= 85) return { label: "ممتاز", color: "text-emerald-400" };
    if (score >= 70) return { label: "جيد", color: "text-emerald-300" };
    if (score >= 50) return { label: "متوسط", color: "text-amber-300" };
    return { label: "بحاجة لتحسين", color: "text-red-300" };
};

export default function SafetyChecklistPage() {
    const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
    const [checklistNotes, setChecklistNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
    const [latestScore, setLatestScore] = useState<number | null>(null);

    const checkedCount = checklistItems.filter((item) => checklistState[item.id]).length;
    const checklistScore = Math.round((checkedCount / checklistItems.length) * 100);
    const groupedChecklist = useMemo(() => {
        return checklistItems.reduce<Record<string, typeof checklistItems>>((acc, item) => {
            if (!acc[item.group]) acc[item.group] = [];
            acc[item.group].push(item);
            return acc;
        }, {});
    }, []);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await fetch("/api/safety/checklists/summary", { cache: "no-store" });
                const data = await response.json();
                if (response.ok) setLatestScore(data.latestScore ?? null);
            } catch (error) {
                console.error("Checklist summary error:", error);
            }
        };
        fetchSummary();
    }, []);

    const handleChecklistSave = async () => {
        setIsSaving(true);
        setActionMessage(null);

        try {
            const response = await fetch("/api/safety/checklists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    checklistName: "تقييم الجاهزية الميدانية",
                    score: checklistScore,
                    responses: checklistItems.map((item) => ({
                        id: item.id,
                        label: item.label,
                        checked: !!checklistState[item.id],
                    })),
                    notes: checklistNotes,
                }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setActionMessage({ type: "success", text: data.message || "تم حفظ التقييم" });
                setLatestScore(checklistScore);
            } else {
                setActionMessage({ type: "error", text: data.error || "تعذر حفظ التقييم" });
            }
        } catch (error) {
            console.error("Checklist save error:", error);
            setActionMessage({ type: "error", text: "فشل الاتصال بالخادم" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="تقييم الجاهزية" />

            <main className="flex-1 flex flex-col gap-4 p-4">
                {actionMessage && (
                    <div
                        className={`rounded-2xl p-4 text-sm border ${
                            actionMessage.type === "success"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                                : actionMessage.type === "error"
                                ? "bg-red-500/10 border-red-500/20 text-red-600"
                                : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                        }`}
                    >
                        {actionMessage.text}
                    </div>
                )}

                <section className="bg-slate-900 dark:bg-black rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold">قائمة فحص الجاهزية</h3>
                        <span className="text-xs text-slate-300">النقاط: {checklistScore}%</span>
                    </div>
                    <div className="bg-slate-800/70 rounded-full h-2 mb-4">
                        <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${checklistScore}%` }}></div>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(groupedChecklist).map(([group, items]) => (
                            <div key={group}>
                                <h4 className="text-sm font-bold text-emerald-300 mb-2">{group}</h4>
                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <label key={item.id} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={!!checklistState[item.id]}
                                                onChange={(e) =>
                                                    setChecklistState((prev) => ({
                                                        ...prev,
                                                        [item.id]: e.target.checked,
                                                    }))
                                                }
                                                className="size-4 rounded border-slate-500"
                                            />
                                            <span className="text-slate-100">{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <textarea
                        value={checklistNotes}
                        onChange={(e) => setChecklistNotes(e.target.value)}
                        placeholder="ملاحظات المشرف أو نقاط التحسين"
                        rows={3}
                        className="mt-4 w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white resize-none"
                    />
                    <button
                        onClick={handleChecklistSave}
                        disabled={isSaving}
                        className={`mt-4 w-full py-3 rounded-xl font-bold ${
                            isSaving ? "bg-slate-600" : "bg-emerald-500 hover:bg-emerald-600"
                        }`}
                    >
                        {isSaving ? "جار الحفظ..." : "حفظ التقييم"}
                    </button>
                </section>

                {latestScore !== null && (
                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">نتيجة التقييم الأخيرة</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">تعكس جاهزيتك الحالية للسلامة</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{latestScore}%</p>
                                <p className={`text-xs font-bold ${getScoreLabel(latestScore).color}`}>
                                    {getScoreLabel(latestScore).label}
                                </p>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
