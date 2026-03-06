"use client";

import { useEffect, useRef, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useAuth } from "@/contexts/AuthContext";

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

type TrainingRequest = {
    id: string;
    requestedSessionTitle?: string | null;
    preferredDate?: string | null;
    participantsCount: number;
    location?: string | null;
    governorate?: string | null;
    city?: string | null;
    street?: string | null;
    locationUrl?: string | null;
    requesterCompanyName?: string | null;
    notes?: string | null;
    status: string;
    createdAt: string;
    session?: {
        title?: string | null;
        startDate?: string | null;
        location?: string | null;
    } | null;
};

const getRequestStatusLabel = (status: string) => {
    switch (status) {
        case "CONFIRMED":
            return { label: "مؤكد", badge: "bg-emerald-500/10 text-emerald-700" };
        case "REJECTED":
            return { label: "مرفوض", badge: "bg-red-500/10 text-red-700" };
        default:
            return { label: "قيد الانتظار", badge: "bg-amber-500/10 text-amber-700" };
    }
};

export default function SafetyTrainingsPage() {
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [requests, setRequests] = useState<TrainingRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [phone, setPhone] = useState("");
    const [ticketMessage, setTicketMessage] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
    const [isSubmittingTraining, setIsSubmittingTraining] = useState(false);
    const trainingFormRef = useRef<HTMLFormElement>(null);
    const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const { user } = useAuth();

    const [trainingForm, setTrainingForm] = useState({
        sessionId: "",
        requestedSessionTitle: "",
        preferredDate: "",
        participantsCount: 1,
        requesterName: "",
        requesterPhone: "",
        requesterRole: "تاجر",
        requesterCompanyName: "",
        location: "",
        governorate: "",
        city: "",
        street: "",
        locationUrl: "",
        notes: "",
    });

    const fetchRequests = async (phoneFilter?: string) => {
        try {
            const query = phoneFilter ? `?requesterPhone=${encodeURIComponent(phoneFilter)}&limit=10` : "?limit=10";
            const response = await fetch(`/api/safety/training-requests${query}`, { cache: "no-store" });
            const data = await response.json();
            if (response.ok) setRequests(data.requests || []);
        } catch (error) {
            console.error("Training requests fetch error:", error);
        }
    };

    const fetchSessions = async () => {
        try {
            const response = await fetch("/api/safety/sessions", { cache: "no-store" });
            const data = await response.json();
            if (response.ok) setSessions(data.sessions || []);
        } catch (error) {
            console.error("Training sessions fetch error:", error);
        }
    };

    useEffect(() => {
        const storedPhone = typeof window !== "undefined" ? localStorage.getItem("safetyTrainingPhone") || "" : "";
        if (storedPhone) setPhone(storedPhone);
        Promise.all([fetchSessions(), fetchRequests(storedPhone)]).finally(() => setIsLoading(false));
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
                setTrainingForm((prev) => ({
                    ...prev,
                    requesterName: prev.requesterName || fullName,
                    requesterPhone: prev.requesterPhone || settingsUser.phone || user.phone || "",
                    requesterRole: prev.requesterRole || (user.userType === "TRADER" ? "تاجر" : "مواطن"),
                    requesterCompanyName:
                        prev.requesterCompanyName || (user.userType === "TRADER" ? settingsUser.companyName || "" : ""),
                }));
            } catch (error) {
                console.error("Profile hydrate error:", error);
            }
        };

        hydrateFromProfile();
    }, [user]);

    const handleSelectSession = (session: TrainingSession) => {
        setTrainingForm((prev) => ({
            ...prev,
            sessionId: session.id,
            requestedSessionTitle: session.title,
        }));
        setActionMessage({ type: "info", text: `تم اختيار جلسة: ${session.title}` });
        trainingFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
                if (trainingForm.requesterPhone && typeof window !== "undefined") {
                    localStorage.setItem("safetyTrainingPhone", trainingForm.requesterPhone);
                }
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
                fetchRequests(trainingForm.requesterPhone);
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

    const handleLocateTraining = async () => {
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
                const { latitude, longitude } = position.coords;
                const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
                setTrainingForm((prev) => ({
                    ...prev,
                    locationUrl: mapUrl,
                }));
                void (async () => {
                    try {
                        const response = await fetch(`/api/safety/reverse-geocode?lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        if (response.ok && data.success) {
                            const { formattedAddress, governorate, city, street } = data;
                            setTrainingForm((prev) => ({
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

    const createTicketFromRequest = async (request: TrainingRequest) => {
        setTicketMessage(null);
        const content = [
            `عنوان التدريب: ${request.session?.title || request.requestedSessionTitle || "طلب تدريب مخصص"}`,
            `الموقع: ${request.session?.location || request.location || "غير محدد"}`,
            `عدد المشاركين: ${request.participantsCount}`,
            request.preferredDate ? `تاريخ مفضل: ${request.preferredDate}` : "",
            request.notes ? `ملاحظات: ${request.notes}` : "",
            `الحالة الحالية: ${request.status}`,
        ]
            .filter(Boolean)
            .join("\n");

        try {
            const response = await fetch("/api/support/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: "طلب تدريب سلامة",
                    category: "السلامة - التدريب",
                    priority: "MEDIUM",
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
            <HeaderWithBack title="الدورات والتدريب" />

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
                {ticketMessage && (
                    <div className="rounded-2xl p-4 text-sm border bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300">
                        {ticketMessage}
                    </div>
                )}
                <section className="bg-white dark:bg-surface-highlight p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm mb-2">طلبات التدريب الخاصة بك</h2>
                    <div className="flex flex-col md:flex-row gap-2">
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="رقم الهاتف"
                            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-900 dark:text-slate-100"
                        />
                        <button
                            onClick={() => {
                                if (typeof window !== "undefined") localStorage.setItem("safetyTrainingPhone", phone);
                                fetchRequests(phone);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl"
                        >
                            عرض الطلبات
                        </button>
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-white">جلسات تدريب قادمة</h3>
                    {isLoading && <p className="text-xs text-slate-500">جار التحميل...</p>}
                    {!isLoading && sessions.length === 0 && (
                        <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
                            لا توجد جلسات متاحة حالياً.
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sessions.map((session) => (
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
                </section>

                <section className="bg-white dark:bg-slate-900/80 border border-emerald-500/10 rounded-2xl p-4 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">طلب تدريب مخصص أو حجز جماعي</h4>
                    <form ref={trainingFormRef} onSubmit={handleTrainingSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                value={trainingForm.requesterName}
                                onChange={(e) => setTrainingForm({ ...trainingForm, requesterName: e.target.value })}
                                placeholder="الاسم الكامل"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                            <input
                                value={trainingForm.requesterPhone}
                                onChange={(e) => setTrainingForm({ ...trainingForm, requesterPhone: e.target.value })}
                                placeholder="رقم الهاتف"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold font-english text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                            <input
                                value={trainingForm.requesterCompanyName}
                                onChange={(e) => setTrainingForm({ ...trainingForm, requesterCompanyName: e.target.value })}
                                placeholder="اسم المنشأة أو الشركة"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                            <input
                                value={trainingForm.location}
                                onChange={(e) => setTrainingForm({ ...trainingForm, location: e.target.value })}
                                placeholder="الموقع بالتفصيل"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                            <input
                                value={trainingForm.governorate}
                                onChange={(e) => setTrainingForm({ ...trainingForm, governorate: e.target.value })}
                                placeholder="المحافظة"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                            <input
                                value={trainingForm.city}
                                onChange={(e) => setTrainingForm({ ...trainingForm, city: e.target.value })}
                                placeholder="المدينة"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                            <input
                                value={trainingForm.street}
                                onChange={(e) => setTrainingForm({ ...trainingForm, street: e.target.value })}
                                placeholder="الشارع أو الحي"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                            <button
                                type="button"
                                onClick={handleLocateTraining}
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-emerald-500/20 rounded-xl py-2.5 px-3 text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition"
                            >
                                {geoStatus === "loading" ? "جارٍ تحديد الموقع..." : "تحديد موقعي الآن"}
                            </button>
                            {trainingForm.locationUrl && (
                                <a
                                    href={trainingForm.locationUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-emerald-700 underline"
                                >
                                    فتح رابط الموقع
                                </a>
                            )}
                            <input
                                type="date"
                                value={trainingForm.preferredDate}
                                onChange={(e) => setTrainingForm({ ...trainingForm, preferredDate: e.target.value })}
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100"
                            />
                            <input
                                value={trainingForm.requestedSessionTitle}
                                onChange={(e) => setTrainingForm({ ...trainingForm, requestedSessionTitle: e.target.value })}
                                placeholder="عنوان التدريب المطلوب"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold md:col-span-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                            <select
                                value={trainingForm.requesterRole}
                                onChange={(e) => setTrainingForm({ ...trainingForm, requesterRole: e.target.value })}
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100"
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
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>
                        <textarea
                            value={trainingForm.notes}
                            onChange={(e) => setTrainingForm({ ...trainingForm, notes: e.target.value })}
                            placeholder="ملاحظات إضافية أو تفاصيل عن بيئة العمل"
                            rows={3}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
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

                <section className="space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-white">سجل طلبات التدريب</h3>
                    {!isLoading && requests.length === 0 && (
                        <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
                            لا توجد طلبات تدريب مسجلة.
                        </div>
                    )}
                    <div className="space-y-2">
                        {requests.map((request) => {
                            const status = getRequestStatusLabel(request.status);
                            return (
                                <div key={request.id} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {request.session?.title || request.requestedSessionTitle || "طلب تدريب مخصص"}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {request.session?.location || request.location || "الموقع غير محدد"}
                                            </p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-1 rounded-full ${status.badge}`}>{status.label}</span>
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-3">
                                        <span>المشاركون: {request.participantsCount}</span>
                                        {request.preferredDate && <span>تاريخ مفضل: {request.preferredDate}</span>}
                                    </div>
                                    <button
                                        onClick={() => createTicketFromRequest(request)}
                                        className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl"
                                    >
                                        تحويل إلى تذكرة دعم
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
}
