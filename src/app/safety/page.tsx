"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
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

type SafetyStats = {
    incidentsOpen: number;
    trainingsUpcoming: number;
    checklistSubmissions: number;
    avgScore: number;
};

type TrainingSession = {
    id: string;
    title: string;
    description?: string | null;
    level: string;
    location: string;
    startDate: string;
    durationHours: number;
    capacity: number;
    availableSeats: number;
    instructorName?: string | null;
    status: string;
};

type IncidentSummary = {
    id: string;
    incidentType: string;
    severity: string;
    location: string;
    status: string;
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

const fallbackInstructions: KnowledgeItem[] = [
    {
        id: "fallback-instruction",
        type: "INSTRUCTION",
        title: "بروتوكول الفحص البصري الأولي",
        summary: "افحص الأحمال من مسافة آمنة، وحدد أي جسم غير مألوف قبل التحريك.",
        createdAt: new Date().toISOString(),
    },
    {
        id: "fallback-instruction-2",
        type: "INSTRUCTION",
        title: "عزل البطاريات والمواد الكيميائية",
        summary: "ضعها في منطقة مظللة ومهوّاة مع بطاقة تعريف واضحة.",
        createdAt: new Date().toISOString(),
    },
];

const fallbackArticles: KnowledgeItem[] = [
    {
        id: "fallback-article",
        type: "ARTICLE",
        title: "إدارة المخاطر في ساحات الخردة",
        summary: "منهجية تقييم المخاطر وتقليل الحوادث وفق معايير السلامة الدولية.",
        createdAt: new Date().toISOString(),
    },
];

const fallbackSessions: TrainingSession[] = [
    {
        id: "fallback-session-1",
        title: "الاستجابة لمخلفات الحرب غير المنفجرة",
        description: "تدريب عملي على التعرف والإبلاغ الآمن والتصرف الصحيح.",
        level: "BASIC",
        location: "دمشق - مركز التدريب الصناعي",
        startDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        durationHours: 4,
        capacity: 30,
        availableSeats: 12,
        instructorName: "م. رائد الحسن",
        status: "OPEN",
    },
];

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

export default function SafetyPage() {
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<SafetyStats | null>(null);
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [recentIncidents, setRecentIncidents] = useState<IncidentSummary[]>([]);
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
    const [showAllWarnings, setShowAllWarnings] = useState(false);
    const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
    const [isSubmittingTraining, setIsSubmittingTraining] = useState(false);
    const [isSavingChecklist, setIsSavingChecklist] = useState(false);

    const incidentRef = useRef<HTMLDivElement>(null);
    const trainingRef = useRef<HTMLDivElement>(null);
    const checklistRef = useRef<HTMLDivElement>(null);

    const [incidentForm, setIncidentForm] = useState({
        incidentType: "",
        severity: "MEDIUM",
        location: "",
        description: "",
        immediateAction: "",
        reporterName: "",
        reporterPhone: "",
        reporterRole: "مواطن",
    });

    const [trainingForm, setTrainingForm] = useState({
        sessionId: "",
        requestedSessionTitle: "",
        preferredDate: "",
        participantsCount: 1,
        requesterName: "",
        requesterPhone: "",
        requesterRole: "تاجر",
        location: "",
        notes: "",
    });

    const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
    const [checklistNotes, setChecklistNotes] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [knowledgeRes, statsRes, sessionsRes, incidentsRes] = await Promise.all([
                    fetch("/api/knowledge?center=SAFETY&status=PUBLISHED&limit=80", { cache: "no-store" }),
                    fetch("/api/safety/overview", { cache: "no-store" }),
                    fetch("/api/safety/sessions", { cache: "no-store" }),
                    fetch("/api/safety/incidents?limit=3", { cache: "no-store" }),
                ]);

                const knowledgeData = await knowledgeRes.json();
                const statsData = await statsRes.json();
                const sessionsData = await sessionsRes.json();
                const incidentsData = await incidentsRes.json();

                if (knowledgeRes.ok) setItems(knowledgeData.items || []);
                if (statsRes.ok) setStats(statsData.stats || null);
                if (sessionsRes.ok) setSessions(sessionsData.sessions || []);
                if (incidentsRes.ok) setRecentIncidents(incidentsData.incidents || []);
            } catch (error) {
                console.error("Safety fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const { warnings, instructions, articles, media } = useMemo(() => {
        const warnings = items.filter((item) => item.type === "WARNING");
        const instructions = items.filter((item) => item.type === "INSTRUCTION");
        const articles = items.filter((item) => item.type === "ARTICLE");
        const media = items.filter((item) => item.type === "VIDEO" || item.type === "IMAGE");
        return {
            warnings: warnings.length ? warnings : fallbackWarnings,
            instructions: instructions.length ? instructions : fallbackInstructions,
            articles: articles.length ? articles : fallbackArticles,
            media,
        };
    }, [items]);

    const sessionsToShow = sessions.length ? sessions : fallbackSessions;
    const checkedCount = checklistItems.filter((item) => checklistState[item.id]).length;
    const checklistScore = Math.round((checkedCount / checklistItems.length) * 100);
    const groupedChecklist = checklistItems.reduce<Record<string, typeof checklistItems>>((acc, item) => {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {});

    const scrollToSection = (ref: RefObject<HTMLDivElement | null>) => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleIncidentSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmittingIncident(true);
        setActionMessage(null);

        try {
            const response = await fetch("/api/safety/incidents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(incidentForm),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                setActionMessage({ type: "success", text: data.message || "تم تسجيل البلاغ" });
                setIncidentForm({
                    incidentType: "",
                    severity: "MEDIUM",
                    location: "",
                    description: "",
                    immediateAction: "",
                    reporterName: "",
                    reporterPhone: "",
                    reporterRole: "مواطن",
                });
            } else {
                setActionMessage({ type: "error", text: data.error || "تعذر إرسال البلاغ" });
            }
        } catch (error) {
            console.error("Incident submit error:", error);
            setActionMessage({ type: "error", text: "فشل الاتصال بالخادم" });
        } finally {
            setIsSubmittingIncident(false);
        }
    };

    const handleTrainingSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmittingTraining(true);
        setActionMessage(null);

        try {
            const response = await fetch("/api/safety/training-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(trainingForm),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setActionMessage({ type: "success", text: data.message || "تم إرسال طلب التدريب" });
                setTrainingForm({
                    sessionId: "",
                    requestedSessionTitle: "",
                    preferredDate: "",
                    participantsCount: 1,
                    requesterName: "",
                    requesterPhone: "",
                    requesterRole: "تاجر",
                    location: "",
                    notes: "",
                });
            } else {
                setActionMessage({ type: "error", text: data.error || "تعذر إرسال الطلب" });
            }
        } catch (error) {
            console.error("Training submit error:", error);
            setActionMessage({ type: "error", text: "فشل الاتصال بالخادم" });
        } finally {
            setIsSubmittingTraining(false);
        }
    };

    const handleChecklistSave = async () => {
        setIsSavingChecklist(true);
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
            } else {
                setActionMessage({ type: "error", text: data.error || "تعذر حفظ التقييم" });
            }
        } catch (error) {
            console.error("Checklist save error:", error);
            setActionMessage({ type: "error", text: "فشل الاتصال بالخادم" });
        } finally {
            setIsSavingChecklist(false);
        }
    };

    const handleSelectSession = (session: TrainingSession) => {
        setTrainingForm((prev) => ({
            ...prev,
            sessionId: session.id,
            requestedSessionTitle: session.title,
        }));
        setActionMessage({ type: "info", text: `تم اختيار جلسة: ${session.title}` });
        scrollToSection(trainingRef);
    };

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
                                <p className="text-xs text-slate-500 dark:text-slate-300">متوسط الالتزام</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    {stats ? `${stats.avgScore}%` : "—"}
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

                {actionMessage && (
                    <div
                        className={`rounded-2xl p-4 text-sm border ${
                            actionMessage.type === "success"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                : actionMessage.type === "error"
                                ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-300"
                                : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-300"
                        }`}
                    >
                        {actionMessage.text}
                    </div>
                )}

                <section className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => scrollToSection(incidentRef)}
                        className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-right flex flex-col gap-2 hover:bg-red-500/15 transition"
                    >
                        <span className="material-symbols-outlined text-red-500 !text-[24px]">warning</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">بلاغ خطر عاجل</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">سجل موقع الخطر فوراً</span>
                    </button>
                    <button
                        onClick={() => scrollToSection(trainingRef)}
                        className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-right flex flex-col gap-2 hover:bg-emerald-500/15 transition"
                    >
                        <span className="material-symbols-outlined text-emerald-500 !text-[24px]">school</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">طلب تدريب ميداني</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">حجز مقعد أو طلب زيارة</span>
                    </button>
                    <a
                        href="/safety/emergency-guide.txt"
                        download
                        className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-right flex flex-col gap-2 hover:bg-amber-500/15 transition"
                    >
                        <span className="material-symbols-outlined text-amber-500 !text-[24px]">download</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">تحميل دليل الطوارئ</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">PDF/نص للطباعة</span>
                    </a>
                    <button
                        onClick={() => scrollToSection(checklistRef)}
                        className="bg-slate-200/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-right flex flex-col gap-2 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition"
                    >
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 !text-[24px]">checklist</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">تقييم الجاهزية</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">قائمة فحص تشغيلية</span>
                    </button>
                </section>

                <section className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-red-500 flex items-center gap-2">
                            <span className="material-symbols-outlined !text-[20px]">siren</span>
                            تحذيرات عاجلة
                        </h3>
                        {isLoading && <span className="text-xs text-red-300">جار التحميل</span>}
                    </div>
                    <div className="space-y-3">
                        {(showAllWarnings ? warnings : warnings.slice(0, 3)).map((warning) => (
                            <div key={warning.id} className="bg-white/80 dark:bg-slate-900/70 rounded-xl p-3 border border-red-500/10">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{warning.title}</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-300">
                                            {warning.summary || warning.content}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-red-500 bg-red-500/10 px-2 py-1 rounded-full">عاجل</span>
                                </div>
                                {(warning.sourceLabel || warning.authorName) && (
                                    <p className="text-[11px] text-red-400 mt-2">
                                        {warning.sourceLabel ? `مصدر: ${warning.sourceLabel}` : `إعداد: ${warning.authorName}`}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    {warnings.length > 3 && (
                        <button
                            onClick={() => setShowAllWarnings((prev) => !prev)}
                            className="mt-3 text-xs text-red-500 font-bold"
                        >
                            {showAllWarnings ? "إظهار أقل" : "عرض كل التحذيرات"}
                        </button>
                    )}
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        {
                            icon: "masks",
                            title: "معدات الوقاية",
                            desc: "خوذات، أقنعة، قفازات، سترات عاكسة",
                            color: "text-amber-500",
                            bg: "bg-amber-500/10",
                        },
                        {
                            icon: "science",
                            title: "المواد الخطرة",
                            desc: "عزل البطاريات والمواد الكيميائية",
                            color: "text-sky-500",
                            bg: "bg-sky-500/10",
                        },
                        {
                            icon: "recycling",
                            title: "الفرز الآمن",
                            desc: "تصنيف المعادن وتقليل الشرر",
                            color: "text-emerald-500",
                            bg: "bg-emerald-500/10",
                        },
                        {
                            icon: "local_shipping",
                            title: "النقل الآمن",
                            desc: "تثبيت الأحمال والتحقق الدوري",
                            color: "text-orange-500",
                            bg: "bg-orange-500/10",
                        },
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

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 dark:text-white">تعليمات السلامة الميدانية</h3>
                        <span className="text-xs text-slate-400">أدلة عملية مختصرة</span>
                    </div>
                    <div className="space-y-3">
                        {instructions.slice(0, 4).map((instruction) => (
                            <div
                                key={instruction.id}
                                className="bg-white dark:bg-surface-highlight rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined !text-[20px]">fact_check</span>
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
                        {articles.slice(0, 4).map((article) => (
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
                                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-300">
                                        <span className="material-symbols-outlined !text-[16px]">menu_book</span>
                                        قراءة الدليل الكامل
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section ref={trainingRef} className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-emerald-700 dark:text-emerald-300">جلسات تدريب قادمة</h3>
                        <span className="text-xs text-emerald-600/70 dark:text-emerald-300/70">حجز المقاعد مباشرة</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sessionsToShow.map((session) => (
                            <div key={session.id} className="bg-white dark:bg-slate-900/70 rounded-2xl p-4 border border-emerald-500/10">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{session.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                                            {session.description}
                                        </p>
                                    </div>
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                                        {session.level === "ADVANCED" ? "متقدم" : "أساسي"}
                                    </span>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-300">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[16px]">schedule</span>
                                        {new Date(session.startDate).toLocaleDateString("ar-SY")}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[16px]">location_on</span>
                                        {session.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[16px]">timer</span>
                                        {session.durationHours} ساعات
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[16px]">event_seat</span>
                                        {session.availableSeats} مقعد متاح
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleSelectSession(session)}
                                    className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-xl"
                                >
                                    احجز مقعدك الآن
                                </button>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleTrainingSubmit} className="mt-5 bg-white dark:bg-slate-900/80 border border-emerald-500/10 rounded-2xl p-4 space-y-3">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">طلب تدريب مخصص أو حجز جماعي</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                value={trainingForm.requesterName}
                                onChange={(e) => setTrainingForm({ ...trainingForm, requesterName: e.target.value })}
                                placeholder="الاسم الكامل"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                            />
                            <input
                                value={trainingForm.requesterPhone}
                                onChange={(e) => setTrainingForm({ ...trainingForm, requesterPhone: e.target.value })}
                                placeholder="رقم الهاتف"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-english"
                            />
                            <input
                                value={trainingForm.location}
                                onChange={(e) => setTrainingForm({ ...trainingForm, location: e.target.value })}
                                placeholder="الموقع أو المدينة"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                            />
                            <input
                                type="date"
                                value={trainingForm.preferredDate}
                                onChange={(e) => setTrainingForm({ ...trainingForm, preferredDate: e.target.value })}
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                            />
                            <input
                                value={trainingForm.requestedSessionTitle}
                                onChange={(e) => setTrainingForm({ ...trainingForm, requestedSessionTitle: e.target.value })}
                                placeholder="عنوان التدريب المطلوب"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm md:col-span-2"
                            />
                            <select
                                value={trainingForm.requesterRole}
                                onChange={(e) => setTrainingForm({ ...trainingForm, requesterRole: e.target.value })}
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                            >
                                <option value="تاجر">تاجر</option>
                                <option value="مواطن">مواطن</option>
                                <option value="شركة">شركة</option>
                                <option value="جهة حكومية">جهة حكومية</option>
                            </select>
                            <input
                                type="number"
                                min={1}
                                value={trainingForm.participantsCount}
                                onChange={(e) =>
                                    setTrainingForm({
                                        ...trainingForm,
                                        participantsCount: parseInt(e.target.value || "1", 10),
                                    })
                                }
                                placeholder="عدد المشاركين"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                            />
                        </div>
                        <textarea
                            value={trainingForm.notes}
                            onChange={(e) => setTrainingForm({ ...trainingForm, notes: e.target.value })}
                            placeholder="ملاحظات إضافية أو تفاصيل عن بيئة العمل"
                            rows={3}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm resize-none"
                        />
                        <button
                            type="submit"
                            disabled={isSubmittingTraining}
                            className={`w-full py-3 rounded-xl font-bold text-white ${
                                isSubmittingTraining ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                        >
                            {isSubmittingTraining ? "جاري الإرسال..." : "إرسال طلب التدريب"}
                        </button>
                    </form>
                </section>

                <section ref={incidentRef} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-red-600 dark:text-red-300">تسجيل بلاغ خطر</h3>
                        <span className="text-xs text-red-400">بلاغ موثق ومتابعة فورية</span>
                    </div>
                    <form onSubmit={handleIncidentSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                value={incidentForm.reporterName}
                                onChange={(e) => setIncidentForm({ ...incidentForm, reporterName: e.target.value })}
                                placeholder="اسم المبلّغ"
                                className="w-full bg-white/80 dark:bg-slate-900/70 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm"
                            />
                            <input
                                value={incidentForm.reporterPhone}
                                onChange={(e) => setIncidentForm({ ...incidentForm, reporterPhone: e.target.value })}
                                placeholder="رقم الهاتف للتواصل"
                                className="w-full bg-white/80 dark:bg-slate-900/70 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm font-english"
                            />
                            <select
                                value={incidentForm.incidentType}
                                onChange={(e) => setIncidentForm({ ...incidentForm, incidentType: e.target.value })}
                                className="w-full bg-white/80 dark:bg-slate-900/70 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm"
                                required
                            >
                                <option value="">اختر نوع الخطر</option>
                                <option value="مخلفات حرب">مخلفات حرب</option>
                                <option value="مواد كيميائية">مواد كيميائية</option>
                                <option value="تسرب بطارية">تسرب بطارية</option>
                                <option value="حريق أو شرر">حريق أو شرر</option>
                                <option value="معدة غير آمنة">معدة غير آمنة</option>
                                <option value="أخرى">أخرى</option>
                            </select>
                            <select
                                value={incidentForm.severity}
                                onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                                className="w-full bg-white/80 dark:bg-slate-900/70 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm"
                            >
                                <option value="LOW">منخفض</option>
                                <option value="MEDIUM">متوسط</option>
                                <option value="HIGH">مرتفع</option>
                                <option value="CRITICAL">حرج</option>
                            </select>
                            <input
                                value={incidentForm.location}
                                onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                                placeholder="الموقع بالتفصيل"
                                className="w-full bg-white/80 dark:bg-slate-900/70 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm md:col-span-2"
                                required
                            />
                        </div>
                        <textarea
                            value={incidentForm.description}
                            onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                            placeholder="وصف البلاغ وما تم ملاحظته"
                            rows={3}
                            className="w-full bg-white/80 dark:bg-slate-900/70 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm resize-none"
                            required
                        />
                        <textarea
                            value={incidentForm.immediateAction}
                            onChange={(e) => setIncidentForm({ ...incidentForm, immediateAction: e.target.value })}
                            placeholder="الإجراءات المتخذة فوراً (إخلاء، عزل، تنبيه الفريق...)"
                            rows={2}
                            className="w-full bg-white/80 dark:bg-slate-900/70 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm resize-none"
                        />
                        <button
                            type="submit"
                            disabled={isSubmittingIncident}
                            className={`w-full py-3 rounded-xl font-bold text-white ${
                                isSubmittingIncident ? "bg-slate-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                            {isSubmittingIncident ? "جار إرسال البلاغ..." : "إرسال البلاغ"}
                        </button>
                    </form>
                </section>

                {recentIncidents.length > 0 && (
                    <section className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-slate-900 dark:text-white">نبض السلامة</h3>
                            <span className="text-xs text-slate-400">آخر البلاغات الموثقة</span>
                        </div>
                        <div className="space-y-2">
                            {recentIncidents.map((incident) => (
                                <div key={incident.id} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{incident.incidentType}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{incident.location}</p>
                                        </div>
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            {incident.severity}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section ref={checklistRef} className="bg-slate-900 dark:bg-black rounded-2xl p-5 text-white">
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
                        disabled={isSavingChecklist}
                        className={`mt-4 w-full py-3 rounded-xl font-bold ${
                            isSavingChecklist ? "bg-slate-600" : "bg-emerald-500 hover:bg-emerald-600"
                        }`}
                    >
                        {isSavingChecklist ? "جار الحفظ..." : "حفظ التقييم"}
                    </button>
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
