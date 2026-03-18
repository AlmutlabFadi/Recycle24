"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";
import { useWallet } from "@/hooks/useWallet";

const FIXED_EXCHANGE_RATE = 15000;

export default function WalletExchangePage() {
  const [fromCurrency, setFromCurrency] = useState<"SYP" | "USD">("SYP");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { wallet, refresh } = useWallet();
  const { addToast } = useToast();
  const router = useRouter();

  const toCurrency = fromCurrency === "SYP" ? "USD" : "SYP";
  
  const numericAmount = Number.parseFloat(amount || "0") || 0;
  
  const balanceTarget = fromCurrency === "SYP" ? wallet?.availableBalanceSYP : wallet?.availableBalanceUSD;
  const balance = Number(balanceTarget ?? 0);
  const targetBalance = Number(toCurrency === "SYP" ? wallet?.availableBalanceSYP : wallet?.availableBalanceUSD);

  let expectedAmount = 0;
  if (fromCurrency === "SYP") {
     expectedAmount = numericAmount / FIXED_EXCHANGE_RATE;
  } else {
     expectedAmount = numericAmount * FIXED_EXCHANGE_RATE;
  }

  const hasEnoughBalance = balance >= numericAmount;
  const canSubmit = numericAmount > 0 && hasEnoughBalance && !isSubmitting;

  const handleSwapDirection = () => {
    setFromCurrency(fromCurrency === "SYP" ? "USD" : "SYP");
    setAmount("");
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/wallet/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCurrency,
          amount: numericAmount
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to exchange currency");
      }

      addToast("Currency exchange completed successfully.", "success");
      refresh();
      
      setTimeout(() => {
        router.push("/wallet");
      }, 1500);
      
    } catch (err) {
      addToast(err instanceof Error ? err.message : "An error occurred.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-dark font-display">
      <HeaderWithBack title="Currency Exchange (صرافة)" />

      <main className="flex-1 p-4 pb-24">
        {/* Exchange Form Card */}
        <div className="rounded-3xl border border-slate-700/50 bg-gradient-to-b from-surface-dark to-slate-900 p-6 shadow-xl relative overflow-hidden">
          
          <div className="mb-4 flex items-center justify-between text-sm">
             <span className="text-slate-400">Current Rate</span>
             <span className="font-english font-bold text-amber-400 tracking-wide bg-amber-400/10 px-3 py-1 rounded-lg">1 USD = {FIXED_EXCHANGE_RATE.toLocaleString()} SYP</span>
          </div>

          <div className="space-y-4">
            {/* From currency */}
            <div className="rounded-2xl border border-slate-700 bg-surface-highlight p-4">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-sm font-bold text-white">From</span>
                 <span className="text-xs text-slate-400">Available: <span className="text-white font-english font-bold">{balance.toLocaleString()} {fromCurrency}</span></span>
               </div>
                              <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      className="w-full bg-transparent text-3xl font-english font-bold text-white outline-none placeholder-slate-600 pr-12"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <button 
                      onClick={() => setAmount(balance.toString())}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-bold text-primary hover:text-white transition bg-primary/10 px-2 py-1 rounded-lg"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="shrink-0 rounded-xl bg-slate-800 px-4 py-2 font-english font-bold text-slate-300 border border-slate-700">
                    {fromCurrency}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {[25, 50, 75, 100].map((percent) => (
                    <button
                      key={percent}
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

            {/* Swap Button */}
            <div className="flex justify-center -my-6 relative z-10">
               <button 
                 onClick={handleSwapDirection}
                 className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg border-4 border-slate-900 hover:rotate-180 transition-transform duration-500"
               >
                 <span className="material-symbols-outlined">swap_vert</span>
               </button>
            </div>

            {/* To currency */}
            <div className="rounded-2xl border border-slate-700 bg-surface-highlight p-4">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-sm font-bold text-slate-300">To (Estimated)</span>
                 <span className="text-xs text-slate-500">Current Setup: <span className="font-english font-bold">{targetBalance.toLocaleString()} {toCurrency}</span></span>
               </div>
               
               <div className="flex items-center gap-3">
                 <div className="flex-1">
                   <input
                     type="text"
                     disabled
                     aria-label="Expected target amount"
                     title="Expected target amount"
                     className="w-full bg-transparent text-3xl font-english font-bold text-emerald-400 outline-none placeholder-slate-600"
                     value={expectedAmount ? expectedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"}
                   />
                 </div>
                 <div className="shrink-0 rounded-xl bg-slate-800 px-4 py-2 font-english font-bold text-emerald-400 border border-emerald-900/50">
                   {toCurrency}
                 </div>
               </div>
            </div>
          </div>

          {amount && !hasEnoughBalance && (
             <div className="mt-4 text-center text-sm font-bold text-rose-500 bg-rose-500/10 py-2 rounded-xl border border-rose-500/20">
               Insufficient {fromCurrency} available balance
             </div>
          )}
        </div>

      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-surface-dark p-4 pb-safe">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full rounded-2xl py-4 font-bold transition-all shadow-lg ${
            canSubmit
              ? "bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-amber-500/20"
              : "cursor-not-allowed bg-slate-800 text-slate-500"
          }`}
        >
          {isSubmitting ? "Processing Exchange..." : "Confirm Exchange"}
        </button>
      </div>
    </div>
  );
}
