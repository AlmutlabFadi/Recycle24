"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useWallet } from "@/hooks/useWallet";

export default function WalletTransferPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const { wallet } = useWallet();
  
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("SYP");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableBalance = currency === "SYP" ? wallet?.availableBalanceSYP : wallet?.availableBalanceUSD;
  const balance = Number(availableBalance ?? 0);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-dark font-display">
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-white">يجب تسجيل الدخول لإجراء تحويل.</p>
        </div>
      </div>
    );
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!receiver || !amount) {
      setError("الرجاء إدخال رقم الهاتف/البريد الإلكتروني للمستلم والمبلغ.");
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
        body: JSON.stringify({
          receiverPhoneOrEmail: receiver,
          amount,
          currency,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ غير معروف أثناء التحويل.");
      }

      addToast("تم إرسال طلب التحويل بنجاح، بانتظار موافقة الإدارة.", "success");
      
      setTimeout(() => {
        router.push("/wallet");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-dark font-display relative">
      <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center justify-between p-4">
          <Link
            href="/wallet"
            className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition"
          >
            <span className="material-symbols-outlined text-white">arrow_forward</span>
          </Link>
          <h1 className="text-base font-bold text-white">تحويل رصيد داخلي</h1>
          <div className="size-10"></div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-md mx-auto">
          {error && (
            <div className="mb-4 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-sm font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleTransfer} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">إلى من (رقم الهاتف أو البريد)</label>
              <input 
                type="text" 
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                autoComplete="off"
                placeholder="ex: 09XXXXXXX or test@test.com"
                className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition" 
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-white block">المبلغ</label>
                <span className="text-xs text-slate-400">
                  المتاح: <span className="font-english font-bold text-white">{balance.toLocaleString()} {currency}</span>
                </span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="أدخل المبلغ"
                  min="10"
                  className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition dir-ltr pr-16" 
                  required
                />
                <button 
                  type="button"
                  onClick={() => setAmount(balance.toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary hover:text-white transition bg-primary/10 px-2 py-1 rounded-lg"
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
                    className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-white transition"
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">العملة</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCurrency("SYP")}
                  className={`py-3 rounded-xl border font-bold transition flex items-center justify-center gap-2 ${
                    currency === "SYP"
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "bg-surface-dark border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                  }`}
                >
                  الليرة (SYP)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`py-3 rounded-xl border font-bold transition flex items-center justify-center gap-2 ${
                    currency === "USD"
                      ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                      : "bg-surface-dark border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                  }`}
                >
                  الدولار (USD)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                isLoading 
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed" 
                  : "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/30"
              }`}
            >
               {isLoading ? (
                 <>
                   <span className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></span>
                   "جاري التحويل..."
                 </>
               ) : (
                 <>
                   <span className="material-symbols-outlined">send</span>
                   "تأكيد التحويل"
                 </>
               )}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}
