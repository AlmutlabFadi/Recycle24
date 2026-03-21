"use client";

import React from "react";

interface FinanceOpsHeaderProps {
  lastRefreshedAt: Date | null;
  criticalAlerts: number;
  highRiskAccounts: number;
  currentUserLabel: string;
}

function formatDateTime(value: Date | null) {
  if (!value) return "لم يتم التحديث بعد";
  return value.toLocaleString("ar-SY");
}

export function FinanceOpsHeader({
  lastRefreshedAt,
  criticalAlerts,
  highRiskAccounts,
  currentUserLabel,
}: FinanceOpsHeaderProps) {
  const systemHealthy = criticalAlerts === 0;

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.25fr_0.95fr]">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#08142b_0%,#0d1f44_55%,#16346f_100%)] p-8 text-white">
          <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-blue-400/10 blur-2xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${
                systemHealthy
                  ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/25"
                  : "bg-rose-400/15 text-rose-200 ring-1 ring-rose-300/25"
              }`}>
                {systemHealthy ? "النظام المالي مستقر" : "يوجد ضغط أو مخاطر حرجة"}
              </span>

              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-100 ring-1 ring-white/10">
                وحدة الإدارة المالية العربية
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight lg:text-4xl">
                مركز القيادة المالية والتدقيق التشغيلي
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-200 lg:text-base">
                منصة تشغيل عربية موحدة لإدارة الطلبات المالية الموافقات متعددة المراحل
                الأرصدة المحجوزة والمجمدة الديون والعمولات والحسابات الحساسة مع
                واجهة مهيأة لعمل فريق إداري كامل ضمن بيئة رقابية عالية الانضباط.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-bold text-slate-300">آخر تحديث فعلي</div>
                <div className="mt-2 text-sm font-black text-white">{formatDateTime(lastRefreshedAt)}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-bold text-slate-300">المستخدم الحالي</div>
                <div className="mt-2 text-sm font-black text-cyan-200">{currentUserLabel}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-bold text-slate-300">وضع غرفة العمليات</div>
                <div className="mt-2 text-sm font-black text-white">
                  {criticalAlerts > 0 ? "تتطلب متابعة فورية" : "تحت السيطرة"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-slate-50 p-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-black text-slate-400">تنبيهات حرجة</div>
            <div className="mt-2 text-4xl font-black text-rose-600">{criticalAlerts.toLocaleString("ar-SY")}</div>
            <div className="mt-2 text-xs font-medium text-slate-500">
              عناصر تتطلب تحقيقا أو قرارا تنفيذيا سريعا
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-black text-slate-400">حسابات عالية المخاطر</div>
            <div className="mt-2 text-4xl font-black text-amber-600">{highRiskAccounts.toLocaleString("ar-SY")}</div>
            <div className="mt-2 text-xs font-medium text-slate-500">
              محافظ أو كيانات تحمل مؤشرات تهديد أو سلوك مالي غير طبيعي
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-slate-400">جاهزية الفريق المالي</div>
                <div className="mt-2 text-lg font-black text-slate-900">تشغيل إداري مشترك</div>
              </div>
              <div className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
                متعدد الأدوار
              </div>
            </div>
            <div className="mt-3 text-xs leading-6 text-slate-500">
              الواجهة مصممة لتسمح للمراجعة الأولى والاعتماد النهائي والمخاطر والتدقيق
              بالعمل ضمن نفس وحدة القيادة.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinanceOpsHeader;
