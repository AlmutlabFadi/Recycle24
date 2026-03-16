"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";

type VerificationApiResponse = {
  success?: boolean;
  verificationStatus?: string;
  trader?: {
    verificationStatus?: string;
    status?: string;
    isDriver?: boolean;
  } | null;
};

function VerificationBlockedView() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-dark font-display">
      <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center justify-between p-4">
          <Link
            href="/"
            className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition"
          >
            <span className="material-symbols-outlined text-white">arrow_forward</span>
          </Link>
          <h1 className="text-base font-bold text-white">المحفظة الرقمية</h1>
          <div className="size-10"></div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">
            gpp_bad
          </span>
          <h2 className="text-xl font-bold text-white mb-2">حساب غير موثق</h2>
          <p className="text-slate-400 mb-4 text-sm leading-relaxed px-4">
            عذرًا، لا يمكنك استخدام المحفظة الرقمية وإجراء المعاملات المالية حتى يتم
            توثيق حسابك بشكل كامل.
          </p>
          <Link
            href="/verification"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
          >
            توثيق الحساب الآن
            <span className="material-symbols-outlined">verified_user</span>
          </Link>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function WalletPage() {
  const { wallet, isLoading, error, refresh } = useWallet();
  const { user, isAuthenticated } = useAuth();

  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVerification() {
      if (!isAuthenticated || !user?.id) {
        setVerificationStatus(null);
        setVerificationError(null);
        setVerificationLoading(false);
        return;
      }

      try {
        setVerificationLoading(true);
        setVerificationError(null);

        const response = await fetch(
          `/api/verification?userId=${encodeURIComponent(user.id)}`,
          { cache: "no-store" }
        );

        const data: VerificationApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            typeof (data as { error?: string })?.error === "string"
              ? (data as { error?: string }).error!
              : "فشل في جلب حالة التوثيق"
          );
        }

        if (cancelled) return;

        const liveStatus =
          data.verificationStatus ||
          data.trader?.verificationStatus ||
          data.trader?.status ||
          null;

        setVerificationStatus(liveStatus);
      } catch (err) {
        if (cancelled) return;
        setVerificationError(
          err instanceof Error ? err.message : "تعذر التحقق من حالة التوثيق"
        );
        setVerificationStatus(null);
      } finally {
        if (!cancelled) {
          setVerificationLoading(false);
        }
      }
    }

    void loadVerification();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const isWalletAllowed = useMemo(() => {
    if (!isAuthenticated) return false;
    if (verificationStatus === "APPROVED") return true;
    if (verificationStatus === "VERIFIED") return true;
    if (verificationStatus === "ACTIVE") return true;
    return false;
  }, [isAuthenticated, verificationStatus]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-dark font-display">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">
              lock
            </span>
            <h2 className="text-xl font-bold text-white mb-2">يجب تسجيل الدخول</h2>
            <p className="text-slate-400 mb-4">سجل الدخول لعرض محفظتك</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
            >
              تسجيل الدخول
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (verificationLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-dark font-display">
        <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center justify-between p-4">
            <Link
              href="/"
              className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition"
            >
              <span className="material-symbols-outlined text-white">arrow_forward</span>
            </Link>
            <h1 className="text-base font-bold text-white">المحفظة الرقمية</h1>
            <div className="size-10"></div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin block mx-auto mb-4"></span>
            <p className="text-slate-400">جارٍ التحقق من حالة التوثيق...</p>
          </div>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  if (verificationError && !isWalletAllowed) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-dark font-display">
        <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center justify-between p-4">
            <Link
              href="/"
              className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition"
            >
              <span className="material-symbols-outlined text-white">arrow_forward</span>
            </Link>
            <h1 className="text-base font-bold text-white">المحفظة الرقمية</h1>
            <div className="size-10"></div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <span className="material-symbols-outlined text-6xl text-red-500 mb-4">
              error
            </span>
            <h2 className="text-xl font-bold text-white mb-2">تعذر التحقق من التوثيق</h2>
            <p className="text-slate-400 mb-4 text-sm">{verificationError}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
            >
              إعادة المحاولة
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  if (!isWalletAllowed) {
    return <VerificationBlockedView />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-dark font-display">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin block mx-auto mb-4"></span>
            <p className="text-slate-400">جاري تحميل المحفظة...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-dark font-display">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-red-500 mb-4">
              error
            </span>
            <h2 className="text-xl font-bold text-white mb-2">حدث خطأ</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
            >
              إعادة المحاولة
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center justify-between p-4">
          <Link
            href="/"
            className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition"
          >
            <span className="material-symbols-outlined text-white">arrow_forward</span>
          </Link>
          <h1 className="text-base font-bold text-white">المحفظة الرقمية</h1>
          <Link
            href="/wallet/transactions"
            className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition"
          >
            <span className="material-symbols-outlined text-white">history</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 pb-24">
        {wallet?.isLocked && (
          <div className="mx-4 mt-4 p-4 rounded-xl bg-slate-900 border border-red-500/50 text-red-500 animate-pulse">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-red-500">lock</span>
              <p className="text-sm font-bold">الحساب مجمد</p>
            </div>
            <p className="text-xs leading-relaxed">
              {wallet.lockReason || "تم تجميد حسابك بسبب عدم تسديد الديون في الوقت المحدد."}
            </p>
          </div>
        )}

        {!wallet?.isLocked && wallet?.debtDetails && wallet.debtDetails.length > 0 && (
          <div className="mx-4 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined">warning</span>
              <p className="text-sm font-bold">تنبيه: يوجد رصيد مستحق (دين)</p>
            </div>
            <p className="text-xs leading-relaxed mb-3 text-red-400/80">
              لديك رصيد سالب في محفظتك. يرجى تسديد المبلغ المطلوب خلال المهلة المحددة لتجنب
              تجميد حسابك تلقائيًا.
            </p>
            <div className="flex flex-col gap-2">
              {wallet.debtDetails.map((debt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-black/20 p-2 px-3 rounded-lg border border-red-500/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-red-500/20 px-1.5 py-0.5 rounded text-red-300 font-english uppercase tracking-tight">
                      {debt.slug.split("_").pop()}
                    </span>
                    <span className="text-sm font-bold font-english dir-ltr">
                      {Math.abs(debt.balance).toLocaleString()} ل.س
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-white">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    باقي {debt.remainingDays} يوم
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mx-4 mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-blue-600 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-white/70 font-medium font-display">
                    الرصيد القابل للاستخدام (ل.س)
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-4xl font-bold font-english dir-ltr tracking-tight">
                      {wallet?.availableBalanceSYP?.toLocaleString() || "0"}
                    </p>
                    <span className="text-lg font-bold text-white/80">ل.س</span>
                  </div>
                </div>

                <div className="text-left bg-white/10 rounded-lg p-2 px-3 backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] text-white/60 mb-1 font-display">
                    رصيد محجوز (تأمينات)
                  </p>
                  <p className="text-sm font-bold font-english dir-ltr">
                    {wallet?.heldAmountSYP?.toLocaleString() || "0"} ل.س
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                <p className="text-xs text-white/60 font-display">إجمالي الرصيد الموثق:</p>
                <p className="text-xs font-bold font-english dir-ltr text-white/90">
                  {wallet?.verifiedBalanceSYP?.toLocaleString() || "0"} ل.س
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-emerald-100 font-medium font-display">
                    الرصيد القابل للاستخدام (USD)
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-4xl font-bold font-english dir-ltr tracking-tight text-white drop-shadow-md">
                      ${wallet?.availableBalanceUSD?.toLocaleString() || "0"}
                    </p>
                  </div>
                </div>

                <div className="text-left bg-white/10 rounded-lg p-2 px-3 backdrop-blur-sm border border-emerald-400/30">
                  <p className="text-[10px] text-emerald-100 mb-1 font-display">
                    رصيد محجوز (تأمينات)
                  </p>
                  <p className="text-sm font-bold font-english dir-ltr drop-shadow-sm">
                    ${wallet?.heldAmountUSD?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-emerald-400/30 flex justify-between items-center">
                <p className="text-xs text-emerald-100 font-display">إجمالي الرصيد الموثق:</p>
                <p className="text-xs font-bold font-english dir-ltr text-white drop-shadow-sm">
                  ${wallet?.verifiedBalanceUSD?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-4">
          <div className="flex gap-3 mt-6">
            <Link
              href="/wallet/deposit"
              className="flex-1 h-12 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition active:scale-95 border border-primary/20"
            >
              <span className="material-symbols-outlined !text-[18px]">arrow_downward</span>
              إيداع
            </Link>
            <Link
              href="/wallet/withdraw"
              className="flex-1 h-12 bg-primary text-white hover:bg-primary-dark rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-sm shadow-primary/30"
            >
              <span className="material-symbols-outlined !text-[18px]">arrow_upward</span>
              سحب
            </Link>
            <Link href="/wallet/transfer" className="flex-1 h-12 bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-sm">
              <span className="material-symbols-outlined !text-[18px]">send</span>
              تحويل
            </Link>
          </div>
        </div>

        <div className="mt-6 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">المعاملات الأخيرة</h2>
            <Link href="/wallet/transactions" className="text-sm font-bold text-primary">
              عرض الكل
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {!wallet?.history || wallet.history.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                <p>لا توجد معاملات حتى الآن</p>
              </div>
            ) : (
              wallet.history.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-highlight border border-slate-700/50"
                >
                  <div
                    className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.amount > 0
                        ? "text-green-400 bg-green-400/10"
                        : tx.metadata?.isExempt
                        ? "text-blue-400 bg-blue-400/10"
                        : "text-orange-400 bg-orange-400/10"
                    }`}
                  >
                    <span className="material-symbols-outlined !text-[20px]">
                      {tx.amount > 0
                        ? "arrow_downward"
                        : tx.metadata?.isExempt
                        ? "verified"
                        : "payments"}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{tx.description}</p>
                      {tx.metadata?.isExempt && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-md font-bold">
                          معفى
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(tx.date).toLocaleDateString("ar-SA")}
                    </p>
                  </div>

                  <div className="text-left">
                    <p
                      className={`text-sm font-bold font-english dir-ltr ${
                        tx.metadata?.isExempt
                          ? "text-slate-500 line-through"
                          : tx.amount > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.metadata?.isExempt
                        ? tx.metadata.originalAmount?.toLocaleString()
                        : tx.amount.toLocaleString()}{" "}
                      ل.س
                    </p>

                    {tx.metadata?.isExempt && (
                      <p className="text-[10px] font-bold text-blue-400 font-english dir-ltr">
                        0 ل.س
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mx-4 mt-6 p-4 rounded-xl bg-surface-dark border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-secondary">store</span>
            <div>
              <p className="text-sm font-bold text-white">شبكة الوكلاء المعتمدين</p>
              <p className="text-xs text-slate-400">إيداع وسحب نقدي عبر أقرب وكيل</p>
            </div>
          </div>
          <button className="w-full h-10 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg text-sm font-bold hover:bg-secondary/20 transition active:scale-[0.98]">
            البحث عن أقرب وكيل
          </button>
        </div>
      </main>

      <BottomNavigation />
    </>
  );
}