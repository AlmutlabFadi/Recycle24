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

type TrainingFormState = {
  sessionId: string;
  requestedSessionTitle: string;
  preferredDate: string;
  participantsCount: number;
  requesterName: string;
  requesterPhone: string;
  requesterRole: string;
  requesterCompanyName: string;
  location: string;
  governorate: string;
  city: string;
  street: string;
  locationUrl: string;
  notes: string;
};

const initialTrainingForm: TrainingFormState = {
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
  const { user } = useAuth();
  const trainingFormRef = useRef<HTMLFormElement>(null);

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [ticketMessage, setTicketMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [isSubmittingTraining, setIsSubmittingTraining] = useState(false);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [trainingForm, setTrainingForm] = useState<TrainingFormState>(initialTrainingForm);

  const fetchRequests = async (phoneFilter?: string) => {
    try {
      const query = phoneFilter
        ? `?requesterPhone=${encodeURIComponent(phoneFilter)}&limit=10`
        : "?limit=10";
      const response = await fetch(`/api/safety/training-requests${query}`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      }
    } catch (error) {
      console.error("Training requests fetch error:", error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/safety/sessions", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      }
    } catch (error) {
      console.error("Training sessions fetch error:", error);
    }
  };

  useEffect(() => {
    const storedPhone =
      typeof window !== "undefined" ? localStorage.getItem("safetyTrainingPhone") || "" : "";
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
            prev.requesterCompanyName ||
            (user.userType === "TRADER" ? settingsUser.companyName || "" : ""),
        }));
      } catch (error) {
        console.error("Profile hydrate error:", error);
      }
    };

    void hydrateFromProfile();
  }, [user]);

  const handleSelectSession = (session: TrainingSession) => {
    setTrainingForm((prev) => ({
      ...prev,
      sessionId: session.id,
      requestedSessionTitle: session.title,
      location: prev.location || session.location || "",
    }));

    setActionMessage({ type: "info", text: `تم اختيار جلسة: ${session.title}` });
    trainingFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            const response = await fetch(
              `/api/safety/reverse-geocode?lat=${latitude}&lon=${longitude}`
            );
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
          setPhone(trainingForm.requesterPhone);
        }

        const preservedName = trainingForm.requesterName;
        const preservedPhone = trainingForm.requesterPhone;
        const preservedRole = trainingForm.requesterRole;
        const preservedCompany = trainingForm.requesterCompanyName;

        setTrainingForm({
          ...initialTrainingForm,
          requesterName: preservedName,
          requesterPhone: preservedPhone,
          requesterRole: preservedRole,
          requesterCompanyName: preservedCompany,
        });

        setGeoStatus("idle");
        void fetchRequests(trainingForm.requesterPhone);
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
          subject: `طلب تدريب: ${request.session?.title || request.requestedSessionTitle || "جلسة تدريب"}`,
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
      <HeaderWithBack title="التدريبات والسلامة" />

      <main className="flex-1 flex flex-col gap-4 p-4">
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
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">الجلسات المتاحة</h2>

          {isLoading ? (
            <div className="text-sm text-slate-500">جاري التحميل...</div>
          ) : sessions.length === 0 ? (
            <div className="text-sm text-slate-500">لا توجد جلسات متاحة حالياً.</div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{session.title}</h3>
                      <p className="text-xs text-slate-500">
                        {new Date(session.startDate).toLocaleString("ar-SY")}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                      {session.level}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{session.location}</p>

                  {session.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {session.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span>المدة: {session.durationHours} ساعة</span>
                    <span>المقاعد المتاحة: {session.availableSeats}</span>
                  </div>

                  <button
                    onClick={() => handleSelectSession(session)}
                    className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-bold"
                  >
                    اختيار هذه الجلسة
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">طلب تدريب</h2>

          <form ref={trainingFormRef} onSubmit={handleTrainingSubmit} className="space-y-3">
            <input
              value={trainingForm.requestedSessionTitle}
              onChange={(e) =>
                setTrainingForm((prev) => ({ ...prev, requestedSessionTitle: e.target.value }))
              }
              placeholder="عنوان التدريب"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <input
              type="date"
              value={trainingForm.preferredDate}
              onChange={(e) =>
                setTrainingForm((prev) => ({ ...prev, preferredDate: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <input
              type="number"
              min={1}
              value={trainingForm.participantsCount}
              onChange={(e) =>
                setTrainingForm((prev) => ({
                  ...prev,
                  participantsCount: Math.max(1, Number(e.target.value || 1)),
                }))
              }
              placeholder="عدد المشاركين"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={trainingForm.requesterName}
                onChange={(e) =>
                  setTrainingForm((prev) => ({ ...prev, requesterName: e.target.value }))
                }
                placeholder="اسم مقدم الطلب"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                value={trainingForm.requesterPhone}
                onChange={(e) =>
                  setTrainingForm((prev) => ({ ...prev, requesterPhone: e.target.value }))
                }
                placeholder="رقم الهاتف"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <input
              value={trainingForm.requesterRole}
              onChange={(e) => setTrainingForm((prev) => ({ ...prev, requesterRole: e.target.value }))}
              placeholder="الصفة"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <input
              value={trainingForm.requesterCompanyName}
              onChange={(e) =>
                setTrainingForm((prev) => ({ ...prev, requesterCompanyName: e.target.value }))
              }
              placeholder="اسم المنشأة"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={trainingForm.governorate}
                onChange={(e) => setTrainingForm((prev) => ({ ...prev, governorate: e.target.value }))}
                placeholder="المحافظة"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                value={trainingForm.city}
                onChange={(e) => setTrainingForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="المدينة"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <input
              value={trainingForm.street}
              onChange={(e) => setTrainingForm((prev) => ({ ...prev, street: e.target.value }))}
              placeholder="الشارع / الحي"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <input
              value={trainingForm.location}
              onChange={(e) => setTrainingForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="موقع التدريب"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <button
              type="button"
              onClick={handleLocateTraining}
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
              value={trainingForm.notes}
              onChange={(e) => setTrainingForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="ملاحظات إضافية"
              rows={4}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base font-bold shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <button
              type="submit"
              disabled={isSubmittingTraining}
              className="w-full rounded-xl bg-primary text-white py-3 font-bold disabled:opacity-50"
            >
              {isSubmittingTraining ? "جاري الإرسال..." : "إرسال الطلب"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white">طلباتي السابقة</h2>
            <button
              onClick={() => void fetchRequests(phone)}
              className="text-sm font-bold text-primary"
            >
              تحديث
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="text-sm text-slate-500">لا توجد طلبات سابقة.</div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => {
                const meta = getRequestStatusLabel(request.status);

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {request.session?.title || request.requestedSessionTitle || "طلب تدريب"}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {new Date(request.createdAt).toLocaleString("ar-SY")}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                      {request.location || request.session?.location || "غير محدد"}
                    </p>

                    <div className="text-xs text-slate-500 mb-3">
                      المشاركون: {request.participantsCount}
                    </div>

                    <button
                      onClick={() => void createTicketFromRequest(request)}
                      className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-bold"
                    >
                      إنشاء تذكرة دعم
                    </button>
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