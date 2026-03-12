"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type VerificationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "UNDER_REVIEW"
  | "NOT_STARTED"
  | "VERIFIED"
  | "ACTIVE"
  | "RESUBMIT";

type FieldStatuses = Record<string, { status: string }>;

type VerificationDocument = {
  id: string;
  type: string;
  status?: string;
  fileUrl?: string;
};

interface VerificationData {
  status: VerificationStatus;
  rejectionReason?: string;
  missingDocuments?: string[];
  submittedAt: string;
  fieldStatuses?: FieldStatuses;
  documents?: VerificationDocument[];
  isDriver?: boolean;
}

const docTypeMap: Record<string, string> = {
  IDENTITY_FRONT: "الهوية (وجه)",
  IDENTITY_BACK: "الهوية (خلف)",
  BUSINESS_LICENSE: "السجل التجاري",
  TRADER_REGISTRATION: "شهادة مزاولة المهنة",
  CHAMBER_MEMBERSHIP: "شهادة غرفة التجارة",
  LOCATION_PROOF: "إثبات موقع المستودع",
  DRIVING_LICENSE: "رخصة القيادة",
  ID_CARD: "الهوية الوطنية",
  LICENSE: "رخصة القيادة",
  VEHICLE_REG: "ملكية المركبة",
  INSURANCE: "تأمين المركبة",
  SELFIE: "صورة شخصية",
};

const fieldLabelMap: Record<string, string> = {
  name: "الاسم الكامل",
  businessName: "اسم المنشأة",
  licenseNumber: "رقم الترخيص",
  taxNumber: "الرقم الضريبي",
  governorate: "المحافظة",
};

function StatusBadge({ status }: { status?: string }) {
  const safeStatus = status || "PENDING";

  switch (safeStatus) {
    case "APPROVED":
    case "VERIFIED":
    case "ACTIVE":
      return (
        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
          مقبول
        </span>
      );

    case "RESUBMIT":
      return (
        <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
          يرجى التعديل
        </span>
      );

    case "REJECTED":
      return (
        <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20 font-bold">
          مرفوض
        </span>
      );

    default:
      return (
        <span className="text-[10px] bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 font-bold">
          قيد المراجعة
        </span>
      );
  }
}

function VerificationStatusContent() {
  const searchParams = useSearchParams();
  const targetRole = searchParams.get("role");
  const { user, activeRole } = useAuth();

  const [data, setData] = useState<VerificationData>({
    status: "PENDING",
    submittedAt: new Date().toISOString(),
    fieldStatuses: {},
    documents: [],
    isDriver: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/verification?userId=${user.id}`);
        const result = await response.json();

        if (result.success && result.trader) {
          setData({
            status:
              result.trader.verificationStatus ||
              result.trader.status ||
              "PENDING",
            rejectionReason: result.trader.rejectionReason,
            missingDocuments: result.trader.missingDocuments,
            submittedAt: result.trader.createdAt || new Date().toISOString(),
            fieldStatuses: result.trader.fieldStatuses || {},
            documents: result.trader.documents || [],
            isDriver: Boolean(result.trader.isDriver),
          });
        }
      } catch (error) {
        console.error("Error fetching verification status:", error);
      } finally {
        setLoading(false);
      }
    };

    void checkStatus();
  }, [user?.id]);

  const isDriver = data.isDriver || targetRole === "DRIVER" || activeRole === "DRIVER";
  const isTraderContext = !isDriver && (targetRole === "TRADER" || activeRole === "TRADER");
  const pageTitle = isDriver
    ? "توثيق حساب السائق"
    : isTraderContext
    ? "توثيق حساب التاجر"
    : "توثيق حساب العميل";

  const statusTitle =
    data.status === "APPROVED"
      ? "مبروك، تم توثيق الحساب"
      : data.status === "REJECTED"
      ? "تم رفض الطلب"
      : data.status === "UNDER_REVIEW"
      ? "الطلب قيد المراجعة"
      : "تم استلام الطلب";

  return (
    <div className="flex flex-col min-h-screen bg-bg-dark font-display">
      <HeaderWithBack title={pageTitle} />

      <main className="flex-1 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="bg-surface-dark rounded-2xl p-6 border border-slate-700/50 text-center">
            {loading ? (
              <div className="text-slate-400">جاري التحميل...</div>
            ) : (
              <>
                <h1 className="text-xl font-black text-white mb-2">{statusTitle}</h1>
                <p className="text-sm text-slate-400">
                  تاريخ التقديم:{" "}
                  {new Date(data.submittedAt).toLocaleString("ar-SY")}
                </p>
              </>
            )}
          </div>

          {!loading && data.status === "APPROVED" && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
              <h2 className="text-emerald-400 font-bold mb-2">الحساب موثق</h2>
              <p className="text-slate-300 text-sm mb-4">
                يمكنك الآن الاستفادة من كامل صلاحيات الحساب داخل المنصة.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold"
              >
                العودة للرئيسية
              </Link>
            </div>
          )}

          {!loading && data.status === "REJECTED" && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
              <h2 className="text-red-400 font-bold mb-3">أسباب الرفض</h2>

              {data.rejectionReason ? (
                <p className="text-slate-300 text-sm mb-4">{data.rejectionReason}</p>
              ) : (
                <p className="text-slate-300 text-sm mb-4">
                  لم يتم توفير سبب تفصيلي. راجع المستندات والبيانات ثم أعد الإرسال.
                </p>
              )}

              {Array.isArray(data.missingDocuments) && data.missingDocuments.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-white mb-2">المستندات الناقصة</p>
                  <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
                    {data.missingDocuments.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Link
                href={`/verification?role=${targetRole || activeRole || "CLIENT"}&resubmit=true`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-bold"
              >
                إعادة تقديم الطلب
              </Link>
            </div>
          )}

          {!loading && (
            <div className="bg-surface-dark rounded-2xl p-5 border border-slate-700/50">
              <h2 className="text-white font-bold mb-4">تفاصيل المراجعة</h2>

              <div className="space-y-2 mb-4">
                {Object.entries(data.fieldStatuses || {}).length > 0 ? (
                  Object.entries(data.fieldStatuses || {}).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm bg-white/5 p-3 rounded-xl"
                    >
                      <span className="text-slate-300">{fieldLabelMap[key] || key}</span>
                      <StatusBadge status={val.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">لا توجد مراجعات حقول مسجلة بعد.</p>
                )}
              </div>

              <div className="space-y-2">
                {(data.documents || []).length > 0 ? (
                  data.documents!.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between text-sm bg-white/5 p-3 rounded-xl"
                    >
                      <span className="text-slate-300">{docTypeMap[doc.type] || doc.type}</span>
                      <StatusBadge status={doc.status || "PENDING"} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">لا توجد مستندات معروضة حالياً.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function VerificationStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-dark" />}>
      <VerificationStatusContent />
    </Suspense>
  );
}