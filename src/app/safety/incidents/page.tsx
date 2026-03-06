"use client";

import { useEffect, useRef, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useAuth } from "@/contexts/AuthContext";

type IncidentSummary = {
    id: string;
    incidentType: string;
    severity: string;
    location: string;
    governorate?: string | null;
    city?: string | null;
    street?: string | null;
    locationUrl?: string | null;
    description?: string | null;
    immediateAction?: string | null;
    status: string;
    createdAt: string;
};

const incidentStatusSteps = [
    { key: "IN_REVIEW", label: "قيد المراجعة" },
    { key: "EN_ROUTE", label: "تم التحرك" },
    { key: "ARRIVED", label: "تم الوصول" },
    { key: "RESOLVED", label: "تم التعامل" },
    { key: "CLOSED", label: "مغلق" },
];

const getStatusIndex = (status: string) => {
    const idx = incidentStatusSteps.findIndex((step) => step.key === status);
    return idx === -1 ? 0 : idx;
};

const getSeverityMeta = (severity: string) => {
    switch (severity) {
        case "LOW":
            return { label: "منخفض", border: "border-emerald-300", badge: "bg-emerald-500/10 text-emerald-700" };
        case "HIGH":
            return { label: "عالي", border: "border-orange-400", badge: "bg-orange-500/10 text-orange-700" };
        case "CRITICAL":
            return { label: "حرج جداً", border: "border-red-500", badge: "bg-red-500/10 text-red-700" };
        default:
            return { label: "متوسط", border: "border-amber-400", badge: "bg-amber-500/10 text-amber-700" };
    }
};

export default function SafetyIncidentsPage() {
    const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [phone, setPhone] = useState("");
    const [ticketMessage, setTicketMessage] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
    const [postSubmitAdvisory, setPostSubmitAdvisory] = useState<string | null>(null);
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
    const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const listRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    const [incidentForm, setIncidentForm] = useState({
        incidentType: "",
        severity: "MEDIUM",
        location: "",
        governorate: "",
        city: "",
        street: "",
        latitude: null as number | null,
        longitude: null as number | null,
        locationAccuracy: null as number | null,
        locationUrl: "",
        description: "",
        immediateAction: "",
        reporterName: "",
        reporterPhone: "",
        reporterRole: "مواطن",
        reporterCompanyName: "",
    });

    const fetchIncidents = async (phoneFilter?: string) => {
        setIsLoading(true);
        try {
            const query = phoneFilter ? `?reporterPhone=${encodeURIComponent(phoneFilter)}&limit=20` : "?limit=20";
            const response = await fetch(`/api/safety/incidents${query}`, { cache: "no-store" });
            const data = await response.json();
            if (response.ok) setIncidents(data.incidents || []);
        } catch (error) {
            console.error("Safety incidents page error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const storedPhone = typeof window !== "undefined" ? localStorage.getItem("safetyReporterPhone") || "" : "";
        if (storedPhone) setPhone(storedPhone);
        fetchIncidents(storedPhone);
    }, []);

    useEffect(() => {
        const hydrateFromProfile = async () => {
            try {
                if (!user) return;
                const response = await fetch("/api/user/settings", { cache: "no-store" });
                const data = await response.json();
                if (!response.ok) return;
                const settingsUser = data.user || {};
                const fullName =
                    settingsUser.firstName && settingsUser.lastName
                        ? `${settingsUser.firstName} ${settingsUser.lastName}`.trim()
                        : settingsUser.name || user.name || "";
                setIncidentForm((prev) => ({
                    ...prev,
                    reporterName: prev.reporterName || fullName,
                    reporterPhone: prev.reporterPhone || settingsUser.phone || user.phone || "",
                    reporterRole: prev.reporterRole || (user.userType === "TRADER" ? "تاجر" : "مواطن"),
                    reporterCompanyName:
                        prev.reporterCompanyName || (user.userType === "TRADER" ? settingsUser.companyName || "" : ""),
                }));
            } catch (error) {
                console.error("Profile hydrate error:", error);
            }
        };

        hydrateFromProfile();
    }, [user]);

    const handleLocateReporter = async () => {
        if (typeof window !== "undefined" && !window.isSecureContext) {
            setActionMessage({
                type: "error",
                text: "تحديد الموقع يتطلب HTTPS أو تشغيل الموقع على localhost",
            });
            return;
        }
        if (!navigator.geolocation) {
            setActionMessage({ type: "error", text: "المتصفح لا يدعم تحديد الموقع" });
            return;
        }
        setGeoStatus("loading");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
                setIncidentForm((prev) => ({
                    ...prev,
                    latitude,
                    longitude,
                    locationAccuracy: Math.round(accuracy),
                    locationUrl: mapUrl,
                }));
                void (async () => {
                    try {
                        const response = await fetch(`/api/safety/reverse-geocode?lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        if (response.ok && data.success) {
                            const { governorate, city, street, formattedAddress } = data;
                            setIncidentForm((prev) => ({
                                ...prev,
                                governorate: governorate || prev.governorate,
                                city: city || prev.city,
                                street: street || prev.street,
                                location: formattedAddress || prev.location,
                            }));
                        }
                    } catch (error) {
                        console.error("Reverse geocode error:", error);
                    }
                })();
                setGeoStatus("success");
            },
            (error) => {
                setGeoStatus("error");
                const errorText =
                    error.code === error.PERMISSION_DENIED
                        ? "تم رفض إذن الموقع. يرجى السماح من إعدادات المتصفح"
                        : error.code === error.POSITION_UNAVAILABLE
                        ? "الموقع غير متاح حالياً، تحقق من إعدادات GPS"
                        : error.code === error.TIMEOUT
                        ? "انتهت مهلة تحديد الموقع، حاول مرة أخرى"
                        : "تعذر تحديد الموقع، يرجى المحاولة لاحقاً";
                setActionMessage({ type: "error", text: errorText });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleIncidentSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmittingIncident(true);
        setActionMessage(null);
        setPostSubmitAdvisory(null);

        try {
            const response = await fetch("/api/safety/incidents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(incidentForm),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                setActionMessage({
                    type: "success",
                    text:
                        "شكراً على الإبلاغ. تم إيصال البلاغ وسيتم التعامل معه في أقرب وقت. يرجى إبقاء رقم الهاتف مفعلاً وعلى الشبكة لتلقي اتصال الفريق المختص.",
                });
                setPostSubmitAdvisory(
                    "إرشادات السلامة: ابقَ على مسافة آمنة، لا تلمس الجسم المشبوه، امنع الاقتراب، وأبلغ الموجودين حتى وصول الفريق المختص."
                );
                if (incidentForm.reporterPhone && typeof window !== "undefined") {
                    localStorage.setItem("safetyReporterPhone", incidentForm.reporterPhone);
                }
                setShowIncidentModal(true);
                fetchIncidents(incidentForm.reporterPhone);
                setIncidentForm({
                    incidentType: "",
                    severity: "MEDIUM",
                    location: "",
                    governorate: "",
                    city: "",
                    street: "",
                    latitude: null,
                    longitude: null,
                    locationAccuracy: null,
                    locationUrl: "",
                    description: "",
                    immediateAction: "",
                    reporterName: "",
                    reporterPhone: "",
                    reporterRole: "مواطن",
                });
                setGeoStatus("idle");
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

    const createTicketFromIncident = async (incident: IncidentSummary) => {
        setTicketMessage(null);
        const priority = incident.severity === "CRITICAL" || incident.severity === "HIGH" ? "HIGH" : incident.severity === "LOW" ? "LOW" : "MEDIUM";
        const content = [
            `نوع البلاغ: ${incident.incidentType}`,
            `الموقع: ${[incident.governorate, incident.city, incident.street, incident.location].filter(Boolean).join("، ")}`,
            incident.locationUrl ? `الرابط: ${incident.locationUrl}` : "",
            incident.description ? `الوصف: ${incident.description}` : "",
            incident.immediateAction ? `الإجراءات الفورية: ${incident.immediateAction}` : "",
            `الحالة الحالية: ${incident.status}`,
        ]
            .filter(Boolean)
            .join("\n");

        try {
            const response = await fetch("/api/support/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: `بلاغ سلامة: ${incident.incidentType}`,
                    category: "السلامة - البلاغات",
                    priority,
                    content,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                if (response.status === 401) {
                    setTicketMessage("يلزم تسجيل الدخول لإنشاء تذكرة دعم.");
                } else {
                    setTicketMessage(data.error || "تعذر إنشاء تذكرة الدعم.");
                }
                return;
            }

            setTicketMessage(`تم إنشاء تذكرة الدعم بنجاح: ${data.ticket?.ticketId || ""}`);
        } catch (error) {
            console.error("Create support ticket error:", error);
            setTicketMessage("تعذر إنشاء تذكرة الدعم حالياً.");
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="سجل البلاغات" />

            <main className="flex-1 flex flex-col gap-4 p-4">
                {showIncidentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-md border border-slate-200 dark:border-slate-800">
                            <div className="flex items-start gap-3">
                                <div className="bg-emerald-500 text-white p-2 rounded-xl shrink-0">
                                    <span className="material-symbols-outlined !text-[24px]">check_circle</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">تم إيصال البلاغ</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                        تم استلام البلاغ وسيتم التعامل معه في أقرب وقت. يرجى إبقاء رقم الهاتف مفعلاً وعلى الشبكة لتلقي اتصال الفريق المختص.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        setShowIncidentModal(false);
                                        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl"
                                >
                                    الذهاب إلى سجل البلاغات
                                </button>
                                <button
                                    onClick={() => setShowIncidentModal(false)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-xl"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

                {postSubmitAdvisory && (
                    <div className="rounded-2xl p-4 text-sm border bg-amber-500/10 border-amber-500/20 text-amber-700">
                        {postSubmitAdvisory}
                    </div>
                )}

                <section className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-red-600">تسجيل بلاغ خطر</h3>
                        <span className="text-xs text-red-400">بلاغ موثق ومتابعة فورية</span>
                    </div>
                    <form onSubmit={handleIncidentSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                value={incidentForm.reporterName}
                                onChange={(e) => setIncidentForm({ ...incidentForm, reporterName: e.target.value })}
                                placeholder="اسم المبلّغ"
                                className="w-full bg-white/80 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400"
                            />
                            <input
                                value={incidentForm.reporterPhone}
                                onChange={(e) => setIncidentForm({ ...incidentForm, reporterPhone: e.target.value })}
                                placeholder="رقم الهاتف للتواصل"
                                className="w-full bg-white/80 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm font-semibold font-english text-slate-900 placeholder:text-slate-400"
                            />
                            <input
                                value={incidentForm.reporterCompanyName}
                                onChange={(e) => setIncidentForm({ ...incidentForm, reporterCompanyName: e.target.value })}
                                placeholder="اسم المنشأة أو الشركة"
                                className="w-full bg-white/80 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400"
                            />
                            <select
                                value={incidentForm.incidentType}
                                onChange={(e) => setIncidentForm({ ...incidentForm, incidentType: e.target.value })}
                                className="w-full bg-white/80 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900"
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
                                className="w-full bg-white/80 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900"
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
                                className="w-full bg-white/80 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm font-semibold md:col-span-2 text-slate-900 placeholder:text-slate-400"
                                required
                            />
                            <input
                                value={incidentForm.governorate}
                                onChange={(e) => setIncidentForm({ ...incidentForm, governorate: e.target.value })}
                                placeholder="المحافظة"
                                className="w-full bg-white/80 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400"
                            />
                            <input
                                value={incidentForm.city}
                                onChange={(e) => setIncidentForm({ ...incidentForm, city: e.target.value })}
                                placeholder="المدينة"
                                className="w-full bg-white/80 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400"
                            />
                            <input
                                value={incidentForm.street}
                                onChange={(e) => setIncidentForm({ ...incidentForm, street: e.target.value })}
                                placeholder="الشارع أو الحي"
                                className="w-full bg-white/80 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm font-semibold md:col-span-2 text-slate-900 placeholder:text-slate-400"
                            />
                            <div className="md:col-span-2 flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={handleLocateReporter}
                                    className="w-full bg-white/80 border border-red-500/20 rounded-xl py-2.5 px-3 text-sm font-bold text-red-600 hover:bg-red-500/10 transition"
                                >
                                    {geoStatus === "loading" ? "جارٍ تحديد الموقع..." : "تحديد موقعي الآن"}
                                </button>
                                {incidentForm.latitude && incidentForm.longitude && (
                                    <div className="text-xs text-slate-600 flex flex-wrap gap-2">
                                        <span>خط العرض: {incidentForm.latitude.toFixed(6)}</span>
                                        <span>خط الطول: {incidentForm.longitude.toFixed(6)}</span>
                                        {incidentForm.locationAccuracy && <span>دقة: {incidentForm.locationAccuracy}م</span>}
                                        {incidentForm.locationUrl && (
                                            <a className="text-red-600 underline" href={incidentForm.locationUrl} target="_blank" rel="noreferrer">
                                                فتح رابط الموقع
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <textarea
                            value={incidentForm.description}
                            onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                            placeholder="وصف البلاغ وما تم ملاحظته"
                            rows={3}
                            className="w-full bg-white/80 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm font-semibold resize-none text-slate-900 placeholder:text-slate-400"
                            required
                        />
                        <textarea
                            value={incidentForm.immediateAction}
                            onChange={(e) => setIncidentForm({ ...incidentForm, immediateAction: e.target.value })}
                            placeholder="الإجراءات المتخذة فوراً (إخلاء، عزل، تنبيه الفريق...)"
                            rows={2}
                            className="w-full bg-white/80 border border-red-500/10 rounded-xl py-2.5 px-3 text-sm font-semibold resize-none text-slate-900 placeholder:text-slate-400"
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
                {ticketMessage && (
                    <div className="rounded-2xl p-4 text-sm border bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300">
                        {ticketMessage}
                    </div>
                )}
                <section className="bg-white dark:bg-surface-highlight p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm mb-2">ابحث برقم الهاتف</h2>
                    <div className="flex flex-col md:flex-row gap-2">
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="رقم الهاتف"
                            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-900 dark:text-slate-100"
                        />
                        <button
                            onClick={() => {
                                if (typeof window !== "undefined") localStorage.setItem("safetyReporterPhone", phone);
                                fetchIncidents(phone);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl"
                        >
                            عرض البلاغات
                        </button>
                    </div>
                </section>

                <section ref={listRef} className="space-y-3">
                    {isLoading && <p className="text-xs text-slate-500">جار التحميل...</p>}
                    {!isLoading && incidents.length === 0 && (
                        <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
                            لا توجد بلاغات مطابقة حالياً.
                        </div>
                    )}
                    {incidents.map((incident) => {
                        const severityMeta = getSeverityMeta(incident.severity);
                        return (
                            <div
                                key={incident.id}
                                className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border ${severityMeta.border} dark:border-slate-800`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{incident.incidentType}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {[incident.governorate, incident.city, incident.street, incident.location]
                                                .filter(Boolean)
                                                .join("، ")}
                                        </p>
                                    </div>
                                    <div className={`text-[10px] px-2 py-1 rounded-full ${severityMeta.badge}`}>
                                        {severityMeta.label}
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {incidentStatusSteps.map((step, index) => {
                                        const active = index <= getStatusIndex(incident.status);
                                        return (
                                            <span
                                                key={step.key}
                                                className={`text-[10px] px-2 py-1 rounded-full border ${
                                                    active
                                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                                                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                                                }`}
                                            >
                                                {step.label}
                                            </span>
                                        );
                                    })}
                                </div>

                                {incident.locationUrl && (
                                    <a
                                        className="text-xs text-amber-600 dark:text-amber-300 underline mt-3 inline-block"
                                        href={incident.locationUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        فتح موقع البلاغ
                                    </a>
                                )}
                                <button
                                    onClick={() => createTicketFromIncident(incident)}
                                    className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl"
                                >
                                    تحويل إلى تذكرة دعم
                                </button>
                            </div>
                        );
                    })}
                </section>
            </main>
        </div>
    );
}
