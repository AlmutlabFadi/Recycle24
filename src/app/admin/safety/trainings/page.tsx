"use client";

import { useEffect, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

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
    contactWhatsapp?: string | null;
};

type TrainingRequest = {
    id: string;
    requesterName?: string | null;
    requesterPhone?: string | null;
    requesterRole?: string | null;
    requesterCompanyName?: string | null;
    requestedSessionTitle?: string | null;
    preferredDate?: string | null;
    participantsCount: number;
    location?: string | null;
    governorate?: string | null;
    city?: string | null;
    street?: string | null;
    locationUrl?: string | null;
    notes?: string | null;
    status: string;
    createdAt: string;
    session?: {
        title?: string | null;
        startDate?: string | null;
        location?: string | null;
    } | null;
};

const STATUS_OPTIONS = [
    { value: "OPEN", label: "مفتوحة" },
    { value: "FULL", label: "مكتملة" },
    { value: "CANCELLED", label: "ملغاة" },
    { value: "COMPLETED", label: "منتهية" },
];

const REQUEST_STATUS_OPTIONS = [
    { value: "PENDING", label: "قيد الانتظار" },
    { value: "CONFIRMED", label: "مؤكد" },
    { value: "REJECTED", label: "مرفوض" },
];

export default function AdminSafetyTrainingsPage() {
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [requests, setRequests] = useState<TrainingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessionFilters, setSessionFilters] = useState({ status: "ALL", search: "" });
    const [requestFilters, setRequestFilters] = useState({ status: "ALL", search: "" });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: "",
        description: "",
        level: "BASIC",
        location: "",
        startDate: "",
        durationHours: 2,
        capacity: 10,
        instructorName: "",
        status: "OPEN",
        contactWhatsapp: "",
    });

    const fetchSessions = async () => {
        try {
            const params = new URLSearchParams();
            if (sessionFilters.status !== "ALL") params.set("status", sessionFilters.status);
            if (sessionFilters.search) params.set("search", sessionFilters.search);
            const response = await fetch(`/api/admin/safety/sessions?${params.toString()}`, { cache: "no-store" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "تعذر تحميل الجلسات");
            setSessions(data.sessions || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    const fetchRequests = async () => {
        try {
            const params = new URLSearchParams();
            if (requestFilters.status !== "ALL") params.set("status", requestFilters.status);
            if (requestFilters.search) params.set("search", requestFilters.search);
            const response = await fetch(`/api/admin/safety/training-requests?${params.toString()}`, { cache: "no-store" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "تعذر تحميل الطلبات");
            setRequests(data.requests || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchSessions(), fetchRequests()]).finally(() => setLoading(false));
    }, [sessionFilters, requestFilters]);

    const resetForm = () => {
        setEditingId(null);
        setForm({
            title: "",
            description: "",
            level: "BASIC",
            location: "",
            startDate: "",
            durationHours: 2,
            capacity: 10,
            instructorName: "",
            status: "OPEN",
            contactWhatsapp: "",
        });
    };

    const submitSession = async () => {
        try {
            setError(null);
            const payload = {
                ...form,
                durationHours: Number(form.durationHours),
                capacity: Number(form.capacity),
            };
            const response = await fetch(
                editingId ? `/api/admin/safety/sessions/${editingId}` : "/api/admin/safety/sessions",
                {
                    method: editingId ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "تعذر حفظ الجلسة");
            resetForm();
            fetchSessions();
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    const editSession = (session: TrainingSession) => {
        setEditingId(session.id);
        setForm({
            title: session.title,
            description: session.description || "",
            level: session.level,
            location: session.location,
            startDate: session.startDate.slice(0, 16),
            durationHours: session.durationHours,
            capacity: session.capacity,
            instructorName: session.instructorName || "",
            status: session.status,
            contactWhatsapp: session.contactWhatsapp || "",
        });
    };

    const deleteSession = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/safety/sessions/${id}`, { method: "DELETE" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "تعذر حذف الجلسة");
            fetchSessions();
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    const updateRequestStatus = async (id: string, status: string) => {
        try {
            const response = await fetch(`/api/admin/safety/training-requests/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "تعذر تحديث الطلب");
            setRequests((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="إدارة الدورات" />

            <main className="flex-1 flex flex-col gap-5 p-4">
                {error && (
                    <div className="rounded-2xl p-4 text-sm border bg-red-500/10 border-red-500/20 text-red-600">
                        {error}
                    </div>
                )}

                <section className="bg-white dark:bg-surface-highlight p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-3">
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">إضافة أو تعديل جلسة</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="عنوان الجلسة"
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        />
                        <input
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                            placeholder="الموقع"
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        />
                        <input
                            type="datetime-local"
                            value={form.startDate}
                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        />
                        <input
                            type="number"
                            min={1}
                            value={form.durationHours}
                            onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })}
                            placeholder="مدة الجلسة"
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        />
                        <input
                            type="number"
                            min={1}
                            value={form.capacity}
                            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                            placeholder="السعة"
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        />
                        <input
                            value={form.instructorName}
                            onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
                            placeholder="اسم المدرب"
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        />
                        <select
                            value={form.level}
                            onChange={(e) => setForm({ ...form, level: e.target.value })}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        >
                            <option value="BASIC">أساسي</option>
                            <option value="ADVANCED">متقدم</option>
                        </select>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <input
                            value={form.contactWhatsapp}
                            onChange={(e) => setForm({ ...form, contactWhatsapp: e.target.value })}
                            placeholder="واتساب الجهة المعلنة"
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        />
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="وصف الجلسة"
                            rows={3}
                            className="md:col-span-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={submitSession} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 px-4 rounded-xl">
                            {editingId ? "تحديث الجلسة" : "إضافة جلسة"}
                        </button>
                        {editingId && (
                            <button onClick={resetForm} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold py-2.5 px-4 rounded-xl">
                                إلغاء التعديل
                            </button>
                        )}
                    </div>
                </section>

                <section className="bg-white dark:bg-surface-highlight p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-3">
                    <div className="flex flex-col md:flex-row gap-2">
                        <select
                            value={sessionFilters.status}
                            onChange={(e) => setSessionFilters((prev) => ({ ...prev, status: e.target.value }))}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        >
                            <option value="ALL">كل الحالات</option>
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <input
                            value={sessionFilters.search}
                            onChange={(e) => setSessionFilters((prev) => ({ ...prev, search: e.target.value }))}
                            placeholder="ابحث في الجلسات"
                            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        />
                    </div>
                    {loading && <p className="text-xs text-slate-500">جار التحميل...</p>}
                    <div className="space-y-2">
                        {sessions.map((session) => (
                            <div key={session.id} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{session.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {session.location} • {new Date(session.startDate).toLocaleDateString("ar-SY")}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => editSession(session)} className="text-xs text-emerald-600 font-bold">
                                            تعديل
                                        </button>
                                        <button onClick={() => deleteSession(session.id)} className="text-xs text-red-600 font-bold">
                                            حذف
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-3">
                                    <span>المدة: {session.durationHours} ساعات</span>
                                    <span>السعة: {session.capacity}</span>
                                    <span>المقاعد المتاحة: {session.availableSeats}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white dark:bg-surface-highlight p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-3">
                    <div className="flex flex-col md:flex-row gap-2">
                        <select
                            value={requestFilters.status}
                            onChange={(e) => setRequestFilters((prev) => ({ ...prev, status: e.target.value }))}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        >
                            <option value="ALL">كل الحالات</option>
                            {REQUEST_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <input
                            value={requestFilters.search}
                            onChange={(e) => setRequestFilters((prev) => ({ ...prev, search: e.target.value }))}
                            placeholder="ابحث في الطلبات"
                            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        {requests.map((req) => (
                            <div key={req.id} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {req.session?.title || req.requestedSessionTitle || "طلب تدريب مخصص"}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {req.requesterName || "غير محدد"} • {req.requesterPhone || "لا يوجد"}
                                        </p>
                                    </div>
                                    <select
                                        value={req.status}
                                        onChange={(e) => updateRequestStatus(req.id, e.target.value)}
                                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs"
                                    >
                                        {REQUEST_STATUS_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-3">
                                    <span>المشاركون: {req.participantsCount}</span>
                                    {req.preferredDate && <span>تاريخ مفضل: {req.preferredDate}</span>}
                                    {req.location && <span>الموقع: {req.location}</span>}
                                    {req.governorate && <span>المحافظة: {req.governorate}</span>}
                                    {req.city && <span>المدينة: {req.city}</span>}
                                    {req.street && <span>الشارع: {req.street}</span>}
                                    {req.requesterCompanyName && <span>المنشأة: {req.requesterCompanyName}</span>}
                                </div>
                                {req.notes && <div className="mt-2 text-xs text-slate-500">ملاحظات: {req.notes}</div>}
                                {req.locationUrl && (
                                    <a
                                        className="text-xs text-emerald-600 underline mt-2 inline-block"
                                        href={req.locationUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        فتح موقع الطلب
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
