"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useWallet } from "@/hooks/useWallet";
import OTPModal from "@/components/OTPModal";

function isWalletAddress(value: string): boolean {
  return /^R24-(SYP|USD)-\d{4}-\d{4}-\d{4}$/i.test(value.trim());
}

export default function WalletTransferPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const { wallet } = useWallet();

  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"SYP" | "USD">("SYP");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(120);

  const availableBalance =
    currency === "SYP" ? wallet?.availableBalanceSYP : wallet?.availableBalanceUSD;

  const balance = Number(availableBalance ?? 0);

  const payloadBase = useMemo(() => {
    const normalizedReceiver = receiver.trim();
    const base: Record<string, unknown> = {
      amount: Number(amount),
      currency,
    };

    if (isWalletAddress(normalizedReceiver)) {
      base.receiverWalletId = normalizedReceiver.toUpperCase();
    } else {
      base.receiverPhoneOrEmail = normalizedReceiver;
    }

    return base;
  }, [receiver, amount, currency]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-bg-dark font-display">
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <p className="text-white">يجب تسجيل الدخول لإجراء تحويل.</p>
        </div>
      </div>
    );
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();

    if (!receiver.trim() || !amount) {
      setError("الرجاء إدخال Wallet ID أو رقم الهاتف أو البريد الإلكتروني مع المبلغ.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payloadBase),
      });

      const data = await res.json();

      if (data.requiresOTP) {
        setOtpExpiresIn(data.expiresIn || 120);
        setOtpOpen(true);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ غير معروف أثناء التحويل.");
      }

      addToast(
        data?.data?.status === "COMPLETED"
          ? "تم التحويل بنجاح."
          : "تم إرسال طلب التحويل بنجاح بانتظار الموافقة.",
        "success"
      );

      setTimeout(() => {
        router.push("/wallet");
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء التحويل.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOTPSubmit(otpCode: string) {
    try {
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...payloadBase,
          otpCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast(data.error || "فشل التحقق من الرمز.", "error");
        if (typeof data.error === "string" && data.error.includes("منتهي")) {
          setOtpOpen(false);
        }
        return;
      }

      setOtpOpen(false);
      addToast(
        data?.data?.status === "COMPLETED"
          ? "تم التحويل بنجاح."
          : "تم إرسال طلب التحويل بنجاح بانتظار الموافقة.",
        "success"
      );

      setTimeout(() => {
        router.push("/wallet");
      }, 1200);
    } catch {
      addToast("حدث خطأ أثناء الاتصال.", "error");
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-bg-dark font-display">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-bg-dark/90 backdrop-blur-md">
        <div className="flex items-center justify-between p-4">
          <Link
            href="/wallet"
            className="flex size-10 items-center justify-center rounded-full transition hover:bg-surface-highlight"
          >
            <span className="material-symbols-outlined text-white">arrow_forward</span>
          </Link>
          <h1 className="text-base font-bold text-white">تحويل رصيد داخلي</h1>
          <div className="size-10" />
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-md">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleTransfer} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-white">
                إلى من (Wallet ID أو رقم الهاتف أو البريد الإلكتروني)
              </label>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                autoComplete="off"
                placeholder="R24-SYP-0000-0000-0000 أو 09XXXXXXX أو test@test.com"
                className="w-full rounded-xl border border-slate-700 bg-surface-dark px-4 py-3 text-white transition focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-white">المبلغ</label>
                <span className="text-xs text-slate-400">
                  المتاح:{" "}
                  <span className="font-english font-bold text-white">
                    {balance.toLocaleString()} {currency}
                  </span>
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="أدخل المبلغ"
                  min="10"
                  className="dir-ltr w-full rounded-xl border border-slate-700 bg-surface-dark px-4 py-3 pr-16 text-white transition focus:border-primary focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setAmount(balance.toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary transition hover:text-white"
                >
                  MAX
                </button>
              </div>

              <div className="mt-2 flex gap-2">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => {
                      const calculated = (balance * percent) / 100;
                      setAmount(calculated.toString());
                    }}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 py-2 text-xs font-bold text-slate-400 transition hover:border-slate-500 hover:text-white"
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-white">العملة</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCurrency("SYP")}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 font-bold transition ${
                    currency === "SYP"
                      ? "border-blue-500 bg-blue-600/20 text-blue-400"
                      : "border-slate-700 bg-surface-dark text-slate-400 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  الليرة (SYP)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 font-bold transition ${
                    currency === "USD"
                      ? "border-emerald-500 bg-emerald-600/20 text-emerald-400"
                      : "border-slate-700 bg-surface-dark text-slate-400 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  الدولار (USD)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold transition ${
                isLoading
                  ? "cursor-not-allowed bg-slate-700 text-slate-400"
                  : "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-dark"
              }`}
            >
              {isLoading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-400" />
                  جاري التحويل...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  تأكيد التحويل
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <OTPModal
        isOpen={otpOpen}
        expiresInSeconds={otpExpiresIn}
        onClose={() => setOtpOpen(false)}
        onSubmit={handleOTPSubmit}
      />
    </div>
  );
}
