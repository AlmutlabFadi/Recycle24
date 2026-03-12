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

type IncidentFormState = {
  incidentType: string;
  severity: string;
  location: string;
  governorate: string;
  city: string;
  street: string;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  locationUrl: string;
  description: string;
  immediateAction: string;
  reporterName: string;
  reporterPhone: string;
  reporterRole: string;
  reporterCompanyName: string;
};

const incidentTypeOptions = [
  "تسرب غاز الميتان أو مواد كيميائية",
  "حريق في منشأة الخردة",
  "انكشاف مواد مشعة",
  "انهيار أكوام خردة",
  "انقطاع تيار كهربائي خطير",
  "آليات ومعدات ثقيلة تشكل خطراً",
  "إصابة عمل",
  "أخرى"
];

const immediateActionOptions = [
  "إخلاء الموقع فوراً",
  "الاتصال بالدفاع المدني / الإسعاف",
  "تقديم إسعافات أولية",
  "فصل التيار الكهربائي",
  "إبعاد العاملين وتطويق المكان",
  "أخرى"
];

const initialIncidentForm: IncidentFormState = {
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
  reporterCompanyName: "",
};

const getSeverityMeta = (severity: string) => {
  switch (severity) {
    case "LOW":
      return { label: "منخفض", badge: "bg-emerald-500/10 text-emerald-700" };
    case "HIGH":
      return { label: "عالٍ", badge: "bg-orange-500/10 text-orange-700" };
    case "CRITICAL":
      return { label: "حرج جداً", badge: "bg-red-500/10 text-red-700" };
    default:
      return { label: "متوسط", badge: "bg-amber-500/10 text-amber-700" };
  }
};

export default function SafetyIncidentsPage() {
  const { user } = useAuth();
  const listRef = useRef<HTMLDivElement>(null);

  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
  const [phone, setPhone] = useState("");
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [postSubmitAdvisory, setPostSubmitAdvisory] = useState<string | null>(null);
  const [ticketMessage, setTicketMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const [incidentForm, setIncidentForm] = useState<IncidentFormState>(initialIncidentForm);
  const [incidentCategory, setIncidentCategory] = useState("");
  const [actionCategory, setActionCategory] = useState("");

  const fetchIncidents = async (phoneFilter?: string) => {
    setIsLoading(true);
    try {
      const query = phoneFilter
        ? `?reporterPhone=${encodeURIComponent(phoneFilter)}&limit=20`
        : "?limit=20";
      const response = await fetch(`/api/safety/incidents${query}`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setIncidents(Array.isArray(data.incidents) ? data.incidents : []);
      }
    } catch (error) {
      console.error("Safety incidents page error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedPhone =
      typeof window !== "undefined" ? localStorage.getItem("safetyReporterPhone") || "" : "";
    if (storedPhone) setPhone(storedPhone);
    void fetchIncidents(storedPhone);
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
            prev.reporterCompanyName ||
            (user.userType === "TRADER" ? settingsUser.companyName || "" : ""),
        }));
      } catch (error) {
        console.error("Profile hydrate error:", error);
      }
    };

    void hydrateFromProfile();
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
            const response = await fetch(
              `/api/safety/reverse-geocode?lat=${latitude}&lon=${longitude}`
            );
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
          text: "تم استلام البلاغ بنجاح وسيتم التواصل معك عند الحاجة.",
        });

        setPostSubmitAdvisory(
          "إرشادات السلامة: ابقَ على مسافة آمنة، لا تلمس الجسم المشبوه، امنع الاقتراب، وانتظر الفريق المختص."
        );

        if (incidentForm.reporterPhone && typeof window !== "undefined") {
          localStorage.setItem("safetyReporterPhone", incidentForm.reporterPhone);
          setPhone(incidentForm.reporterPhone);
        }

        setShowIncidentModal(true);
        void fetchIncidents(incidentForm.reporterPhone);
        setIncidentForm(initialIncidentForm);
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

    const priority =
      incident.severity === "CRITICAL" || incident.severity === "HIGH"
        ? "HIGH"
        : incident.severity === "LOW"
        ? "LOW"
        : "MEDIUM";

    const content = [
      `نوع البلاغ: ${incident.incidentType}`,
      `الموقع: ${[incident.governorate, incident.city, incident.street, incident.location]
        .filter(Boolean)
        .join("، ")}`,
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
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">تم إيصال البلاغ</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                تم استلام البلاغ وسيتم التعامل معه في أقرب وقت.
              </p>

              {postSubmitAdvisory && (
                <div className="text-xs rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-amber-700 dark:text-amber-300 mb-4">
                  {postSubmitAdvisory}
                </div>
              )}

              <div className="flex flex-col gap-2">
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
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                : actionMessage.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
                : "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300"
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

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">إرسال بلاغ سلامة</h2>

          <form onSubmit={handleIncidentSubmit} className="space-y-3">
            <select
              value={incidentCategory}
              onChange={(e) => {
                setIncidentCategory(e.target.value);
                if (e.target.value !== "أخرى") {
                  setIncidentForm((prev) => ({ ...prev, incidentType: e.target.value }));
                } else {
                  setIncidentForm((prev) => ({ ...prev, incidentType: "" }));
                }
              }}
              className="w-full appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="" disabled>اختر نوع البلاغ...</option>
              {incidentTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>

            {incidentCategory === "أخرى" && (
              <input
                value={incidentForm.incidentType}
                onChange={(e) => setIncidentForm((prev) => ({ ...prev, incidentType: e.target.value }))}
                placeholder="اكتب نوع البلاغ"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 animate-fade-in"
              />
            )}

            <select
              value={incidentForm.severity}
              onChange={(e) => setIncidentForm((prev) => ({ ...prev, severity: e.target.value }))}
              className="w-full appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="LOW">خطورة عادية</option>
              <option value="MEDIUM">خطورة متوسطة</option>
              <option value="HIGH">خطورة عالية</option>
              <option value="CRITICAL">الأمور حرجة</option>
            </select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={incidentForm.governorate}
                onChange={(e) => setIncidentForm((prev) => ({ ...prev, governorate: e.target.value }))}
                placeholder="المحافظة"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                value={incidentForm.city}
                onChange={(e) => setIncidentForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="المدينة"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <input
              value={incidentForm.street}
              onChange={(e) => setIncidentForm((prev) => ({ ...prev, street: e.target.value }))}
              placeholder="الشارع / الحي"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <input
              value={incidentForm.location}
              onChange={(e) => setIncidentForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="العنوان التفصيلي"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <button
              type="button"
              onClick={handleLocateReporter}
              className="w-full rounded-xl bg-primary hover:bg-primary-dark text-white px-4 py-3 text-base font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined !text-[20px]">my_location</span>
              {geoStatus === "loading"
                ? "جاري تحديد الموقع..."
                : geoStatus === "success"
                ? "تم تحديد الموقع"
                : "استخدام موقعي الحالي"}
            </button>

            <textarea
              value={incidentForm.description}
              onChange={(e) => setIncidentForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="وصف البلاغ"
              rows={4}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <select
              value={actionCategory}
              onChange={(e) => {
                setActionCategory(e.target.value);
                if (e.target.value !== "أخرى") {
                  setIncidentForm((prev) => ({ ...prev, immediateAction: e.target.value }));
                } else {
                  setIncidentForm((prev) => ({ ...prev, immediateAction: "" }));
                }
              }}
              className="w-full appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="" disabled>الإجراءات الفورية المتخذة...</option>
              {immediateActionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>

            {actionCategory === "أخرى" && (
              <textarea
                value={incidentForm.immediateAction}
                onChange={(e) =>
                  setIncidentForm((prev) => ({ ...prev, immediateAction: e.target.value }))
                }
                placeholder="اكتب الإجراءات الفورية تم اتخاذها"
                rows={3}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 animate-fade-in"
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={incidentForm.reporterName}
                onChange={(e) => setIncidentForm((prev) => ({ ...prev, reporterName: e.target.value }))}
                placeholder="اسم المبلّغ"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                value={incidentForm.reporterPhone}
                onChange={(e) => setIncidentForm((prev) => ({ ...prev, reporterPhone: e.target.value }))}
                placeholder="رقم الهاتف"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <input
              value={incidentForm.reporterRole}
              onChange={(e) => setIncidentForm((prev) => ({ ...prev, reporterRole: e.target.value }))}
              placeholder="صفة المبلّغ"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <input
              value={incidentForm.reporterCompanyName}
              onChange={(e) =>
                setIncidentForm((prev) => ({ ...prev, reporterCompanyName: e.target.value }))
              }
              placeholder="اسم المنشأة (اختياري)"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <button
              type="submit"
              disabled={isSubmittingIncident}
              className="w-full rounded-xl bg-primary text-white py-3 font-bold disabled:opacity-50"
            >
              {isSubmittingIncident ? "جاري الإرسال..." : "إرسال البلاغ"}
            </button>
          </form>
        </section>

        <section
          ref={listRef}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white">البلاغات السابقة</h2>
            <button
              onClick={() => void fetchIncidents(phone)}
              className="text-sm font-bold text-primary"
            >
              تحديث
            </button>
          </div>

          {isLoading ? (
            <div className="text-sm text-slate-500">جاري التحميل...</div>
          ) : incidents.length === 0 ? (
            <div className="text-sm text-slate-500">لا توجد بلاغات حالياً.</div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => {
                const severityMeta = getSeverityMeta(incident.severity);

                return (
                  <div
                    key={incident.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {incident.incidentType}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {new Date(incident.createdAt).toLocaleString("ar-SY")}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${severityMeta.badge}`}>
                        {severityMeta.label}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                      {incident.location}
                    </p>

                    {incident.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {incident.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {incident.locationUrl && (
                        <a
                          href={incident.locationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs rounded-lg px-3 py-2 bg-slate-100 dark:bg-slate-800"
                        >
                          فتح الموقع
                        </a>
                      )}

                      <button
                        onClick={() => void createTicketFromIncident(incident)}
                        className="text-xs rounded-lg px-3 py-2 bg-primary text-white"
                      >
                        إنشاء تذكرة دعم
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}