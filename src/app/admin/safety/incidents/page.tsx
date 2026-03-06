"use client";

import { useEffect, useMemo, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

type IncidentRecord = {
    id: string;
    incidentType: string;
    severity: string;
    location: string;
    governorate?: string | null;
    city?: string | null;
    street?: string | null;
    locationUrl?: string | null;
    description: string;
    immediateAction?: string | null;
    reporterName?: string | null;
    reporterPhone?: string | null;
    reporterRole?: string | null;
    reporterCompanyName?: string | null;
    status: string;
    createdAt: string;
    statusLogs?: Array<{
        id: string;
        status: string;
        note?: string | null;
        createdAt: string;
    }>;
};

const STATUS_OPTIONS = [
    { value: "IN_REVIEW", label: "قيد المراجعة" },
    { value: "EN_ROUTE", label: "تم التحرك" },
    { value: "ARRIVED", label: "تم الوصول" },
    { value: "RESOLVED", label: "تم التعامل" },
    { value: "CLOSED", label: "مغلق" },
];

const SEVERITY_LABELS: Record<string, string> = {
    LOW: "منخفض",
    MEDIUM: "متوسط",
    HIGH: "عالي",
    CRITICAL: "حرج جداً",
};

export default function AdminSafetyIncidentsPage() {
    const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({ status: "ALL", severity: "ALL", search: "" });
    const [savingId, setSavingId] = useState<string | null>(null);
    const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

    const filteredParams = useMemo(() => {
        const params = new URLSearchParams();
        if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
        if (filters.severity && filters.severity !== "ALL") params.set("severity", filters.severity);
        if (filters.search) params.set("search", filters.search);
        return params.toString();
    }, [filters]);

    const fetchIncidents = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/admin/safety/incidents?${filteredParams}`, { cache: "no-store" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "تعذر تحميل البلاغات");
            setIncidents(data.incidents || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, [filteredParams]);

    const updateStatus = async (id: string, status: string) => {
        try {
            setSavingId(id);
            const response = await fetch(`/api/admin/safety/incidents/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, note: noteDrafts[id] || null }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "تعذر تحديث البلاغ");
            setIncidents((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
            setNoteDrafts((prev) => ({ ...prev, [id]: "" }));
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="إدارة بلاغات السلامة" />

            <main className="flex-1 flex flex-col gap-4 p-4">
                <section className="bg-white dark:bg-surface-highlight p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        >
                            <option value="ALL">كل الحالات</option>
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.severity}
                            onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value }))}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        >
                            <option value="ALL">كل الخطورة</option>
                            {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <input
                            value={filters.search}
                            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            placeholder="ابحث بالاسم، الهاتف، الموقع"
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm"
                        />
                    </div>
                </section>

                {error && (
                    <div className="rounded-2xl p-4 text-sm border bg-red-500/10 border-red-500/20 text-red-600">
                        {error}
                    </div>
                )}
                {isLoading && <p className="text-xs text-slate-500">جار التحميل...</p>}

                <section className="space-y-3">
                    {incidents.map((incident) => (
                        <div key={incident.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{incident.incidentType}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {[incident.governorate, incident.city, incident.street, incident.location]
                                            .filter(Boolean)
                                            .join("، ")}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        المبلّغ: {incident.reporterName || "غير محدد"} • {incident.reporterPhone || "لا يوجد"}
                                        {incident.reporterCompanyName ? ` • ${incident.reporterCompanyName}` : ""}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">
                                        {SEVERITY_LABELS[incident.severity] || incident.severity}
                                    </span>
                                    <select
                                        value={incident.status}
                                        onChange={(e) => updateStatus(incident.id, e.target.value)}
                                        disabled={savingId === incident.id}
                                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs"
                                    >
                                        {STATUS_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        value={noteDrafts[incident.id] || ""}
                                        onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [incident.id]: e.target.value }))}
                                        placeholder="ملاحظة الحالة (اختياري)"
                                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs"
                                    />
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                                {incident.description}
                            </div>
                            {incident.immediateAction && (
                                <div className="mt-2 text-xs text-slate-500">الإجراءات الفورية: {incident.immediateAction}</div>
                            )}
                            {incident.locationUrl && (
                                <a
                                    className="text-xs text-amber-600 dark:text-amber-300 underline mt-2 inline-block"
                                    href={incident.locationUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    فتح موقع البلاغ
                                </a>
                            )}
                            {incident.statusLogs && incident.statusLogs.length > 0 && (
                                <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">سجل الحالات</h4>
                                    <div className="space-y-2">
                                        {incident.statusLogs.map((log) => (
                                            <div key={log.id} className="text-xs text-slate-500 dark:text-slate-400">
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {STATUS_OPTIONS.find((opt) => opt.value === log.status)?.label || log.status}
                                                </span>
                                                <span> • {new Date(log.createdAt).toLocaleString("ar-SY")}</span>
                                                {log.note && <div className="text-[11px] text-slate-500 mt-1">ملاحظة: {log.note}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}
