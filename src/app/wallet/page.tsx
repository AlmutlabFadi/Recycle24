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

        <div className="mx-4 mt-4">
          <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6 shadow-2xl relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>

            <div className="relative z-10 flex flex-col gap-6">
              {/* SYP Balance */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-display mb-1 tracking-wide">الرصيد المتاح (ليرة سورية)</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl sm:text-5xl font-bold text-white font-english tracking-tight drop-shadow-md">
                      {wallet?.availableBalanceSYP?.toLocaleString() || "0"}
                    </h2>
                    <span className="text-white/60 text-sm font-bold">SYP</span>
                  </div>
                </div>
                
                {wallet?.heldAmountSYP && wallet.heldAmountSYP > 0 ? (
                  <div className="text-left bg-white/5 rounded-xl p-2 px-3 backdrop-blur-sm border border-white/10">
                    <p className="text-[10px] text-white/50 mb-1 font-display uppercase tracking-wider">محجوز (تأمينات)</p>
                    <p className="text-sm font-bold text-white/80 font-english dir-ltr">
                      {wallet.heldAmountSYP.toLocaleString()} SYP
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50"></div>

              {/* USD Balance */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-display mb-1 tracking-wide">الرصيد المتاح (دولار أمريكي)</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-emerald-400 font-english tracking-tight drop-shadow-md">
                      ${wallet?.availableBalanceUSD?.toLocaleString() || "0"}
                    </h2>
                    <span className="text-emerald-400/60 text-xs font-bold">USD</span>
                  </div>
                </div>

                {wallet?.heldAmountUSD && wallet.heldAmountUSD > 0 ? (
                  <div className="text-left bg-emerald-500/5 rounded-xl p-2 px-3 backdrop-blur-sm border border-emerald-500/10">
                    <p className="text-[10px] text-emerald-400/60 mb-1 font-display uppercase tracking-wider">محجوز (تأمينات)</p>
                    <p className="text-sm font-bold text-emerald-400/90 font-english dir-ltr">
                      ${wallet.heldAmountUSD.toLocaleString()}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mx-4 mt-6 grid grid-cols-4 gap-3">
          <Link href="/wallet/deposit" className="group flex flex-col items-center justify-center gap-2 py-4 px-2 bg-surface-dark border border-slate-700/50 rounded-2xl hover:bg-surface-highlight hover:border-slate-600 transition-all active:scale-95 shadow-lg shadow-black/20">
            <div className="size-12 rounded-full bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-110 flex items-center justify-center transition-all">
              <span className="material-symbols-outlined !text-[22px]">arrow_downward</span>
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">إيداع</span>
          </Link>

          <Link href="/wallet/withdraw" className="group flex flex-col items-center justify-center gap-2 py-4 px-2 bg-surface-dark border border-slate-700/50 rounded-2xl hover:bg-surface-highlight hover:border-slate-600 transition-all active:scale-95 shadow-lg shadow-black/20">
            <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 flex items-center justify-center transition-all">
              <span className="material-symbols-outlined !text-[22px]">arrow_upward</span>
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">سحب</span>
          </Link>

          <Link href="/wallet/transfer" className="group flex flex-col items-center justify-center gap-2 py-4 px-2 bg-surface-dark border border-slate-700/50 rounded-2xl hover:bg-surface-highlight hover:border-slate-600 transition-all active:scale-95 shadow-lg shadow-black/20">
            <div className="size-12 rounded-full bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:scale-110 flex items-center justify-center transition-all">
              <span className="material-symbols-outlined !text-[22px]">send</span>
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">تحويل</span>
          </Link>

          <Link href="/wallet/exchange" className="group flex flex-col items-center justify-center gap-2 py-4 px-2 bg-surface-dark border border-slate-700/50 rounded-2xl hover:bg-surface-highlight hover:border-slate-600 transition-all active:scale-95 shadow-lg shadow-black/20">
            <div className="size-12 rounded-full bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-110 flex items-center justify-center transition-all">
              <span className="material-symbols-outlined !text-[22px]">currency_exchange</span>
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">صرافة</span>
          </Link>
        </div>

        {/* Monthly Statement & Detailed Ledger Link */}
        <div className="mx-4 mt-6 grid grid-cols-2 gap-3">
          <Link
            href="/wallet/statement"
            className="group flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-all active:scale-[0.98]"
          >
            <div className="size-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-400 !text-[20px]">description</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">كشف الحساب</p>
              <p className="text-[10px] text-slate-400">شهري مفصل بالعملتين</p>
            </div>
          </Link>

          <Link
            href="/wallet/transactions"
            className="group flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all active:scale-[0.98]"
          >
            <div className="size-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-cyan-400 !text-[20px]">history</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">سجل المعاملات</p>
              <p className="text-[10px] text-slate-400">كافة الحركات المالية</p>
            </div>
          </Link>
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
          <Link href="/wallet/dealers" className="block w-full h-10 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg text-sm font-bold hover:bg-secondary/20 transition active:scale-[0.98] flex items-center justify-center">
            البحث عن أقرب وكيل
          </Link>
        </div>
      </main>

      <BottomNavigation />
    </>
  );
}