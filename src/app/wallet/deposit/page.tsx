"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";
import { useWallet } from "@/hooks/useWallet";

const paymentMethods = [
  { id: "haram", name: "Haram", icon: "🏦", description: "Cash branch transfer" },
  { id: "syriatel", name: "Syriatel Cash", icon: "📱", description: "Syriatel wallet transfer" },
  { id: "mtn", name: "MTN Cash", icon: "📲", description: "MTN wallet transfer" },
  { id: "al_fouad", name: "Al Fouad", icon: "🏪", description: "Branch transfer" },
] as const;

const presetAmountsSYP = [50000, 100000, 250000, 500000, 1000000];
const presetAmountsUSD = [10, 50, 100, 500, 1000];

export default function WalletDepositPage() {
  const [currency, setCurrency] = useState<"SYP" | "USD">("SYP");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { deposit } = useWallet();
  const { addToast } = useToast();
  const router = useRouter();

  const numericAmount = Number.parseInt(amount || "0", 10) || 0;
  const selectedMethodMeta = paymentMethods.find((method) => method.id === selectedMethod);

  const canGoFromStep1 = numericAmount > 0;
  const canGoFromStep2 = selectedMethod.length > 0;
  const canSubmit =
    numericAmount > 0 &&
    selectedMethod.length > 0 &&
    referenceNumber.trim().length > 0 &&
    !isSubmitting;

  const handleNext = () => {
    if (step === 1 && canGoFromStep1) {
      setStep(2);
      return;
    }

    if (step === 2 && canGoFromStep2) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      addToast("Please complete all required fields.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await deposit(numericAmount, selectedMethod, referenceNumber, currency);

      if (!success) {
        addToast("Failed to post deposit.", "error");
        return;
      }

      addToast("Deposit posted successfully.", "success");
      setStep(4);

      setTimeout(() => {
        router.push("/wallet");
      }, 1500);
    } catch (error) {
      console.error("Deposit submission error:", error);
      addToast("An error occurred while posting the deposit.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-dark font-display">
      <HeaderWithBack title="Wallet Deposit" />

      <div className="border-b border-slate-800 bg-surface-dark px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                s < step || (step === 4 && s === 3)
                  ? "bg-green-500 text-white"
                  : s === step
                  ? "bg-primary text-white"
                  : "bg-slate-700 text-slate-500"
              }`}
            >
              {s < step || (step === 4 && s === 3) ? (
                <span className="material-symbols-outlined">check</span>
              ) : (
                s
              )}
            </div>
          ))}
        </div>

        <div className="mt-2 text-center text-xs text-slate-400">
          {step === 1 && "Amount"}
          {step === 2 && "Method"}
          {step === 3 && "Confirmation"}
          {step === 4 && "Completed"}
        </div>
      </div>

      <main className="flex-1 p-4 pb-24">
        {step === 1 && (
          <section className="mb-6">
            <h2 className="mb-4 text-lg font-bold text-white">Choose amount & currency</h2>

            <div className="mb-4 flex rounded-xl bg-slate-800 p-1">
              <button
                onClick={() => { setCurrency("SYP"); setAmount(""); }}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                  currency === "SYP" ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                SYP (ل.س)
              </button>
              <button
                onClick={() => { setCurrency("USD"); setAmount(""); }}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                  currency === "USD" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                USD ($)
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              {(currency === "SYP" ? presetAmountsSYP : presetAmountsUSD).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    amount === String(preset)
                      ? "border-primary bg-primary/10"
                      : "border-slate-700 bg-surface-highlight hover:border-slate-600"
                  }`}
                >
                  <span className="text-xl font-bold text-white">
                    {currency === "USD" ? "$" : ""}
                    {preset.toLocaleString()}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">{currency}</span>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-slate-700 bg-surface-highlight p-4">
              <label className="mb-2 block text-sm text-slate-400">Custom amount ({currency})</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-center text-lg text-white transition-colors focus:border-primary focus:outline-none"
              />
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mb-6">
            <h2 className="mb-4 text-lg font-bold text-white">Choose method</h2>

            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full rounded-xl border-2 p-4 text-right transition-all ${
                    selectedMethod === method.id
                      ? "border-primary bg-primary/10"
                      : "border-slate-700 bg-surface-highlight hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{method.icon}</span>

                    <div className="flex-1">
                      <h3 className="font-bold text-white">{method.name}</h3>
                      <p className="text-sm text-slate-400">{method.description}</p>
                    </div>

                    {selectedMethod === method.id && (
                      <span className="material-symbols-outlined text-primary">
                        check_circle
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="mb-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                <span className="material-symbols-outlined text-4xl text-primary">
                  receipt_long
                </span>
              </div>

              <h2 className="mb-2 text-xl font-bold text-white">Confirm deposit</h2>
              <p className="text-slate-400">
                This action posts the deposit immediately to the wallet ledger.
              </p>
            </div>

            <div className="mb-4 rounded-xl border border-slate-700 bg-surface-highlight p-4">
              <label className="mb-2 block text-sm text-slate-400">
                Transfer reference number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Example: TX123456789"
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-center text-lg text-white transition-colors focus:border-primary focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-slate-700 bg-surface-highlight p-4">
              <h3 className="mb-3 font-bold text-white">Summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount</span>
                  <span className="font-bold text-white">
                    {numericAmount.toLocaleString()} {currency}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Method</span>
                  <span className="text-white">{selectedMethodMeta?.name ?? "-"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Reference</span>
                  <span className="text-white">{referenceNumber || "-"}</span>
                </div>

                <div className="mt-2 border-t border-slate-700 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Posted amount</span>
                    <span className="text-lg font-bold text-primary">
                      {numericAmount.toLocaleString()} {currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20">
              <span className="material-symbols-outlined text-5xl text-green-500">
                check_circle
              </span>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-white">Deposit posted</h2>
            <p className="mb-4 text-slate-400">
              The wallet balance has been updated immediately.
            </p>

            <div className="w-full max-w-xs rounded-xl border border-slate-700 bg-surface-highlight p-4">
              <p className="text-sm text-slate-400">Reference number</p>
              <p className="font-mono font-bold text-white">{referenceNumber}</p>
            </div>
          </div>
        )}
      </main>

      {step !== 4 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-surface-dark p-4 pb-safe">
          <div className="mx-auto flex max-w-md gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as typeof step)}
                className="flex-1 rounded-xl bg-slate-700 px-4 py-3 font-bold text-slate-300 transition-all hover:bg-slate-600"
              >
                Back
              </button>
            )}

            <button
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={
                isSubmitting ||
                (step === 1 && !canGoFromStep1) ||
                (step === 2 && !canGoFromStep2) ||
                (step === 3 && !canSubmit)
              }
              className={`flex-[2] rounded-xl px-4 py-3 font-bold transition-all ${
                !isSubmitting &&
                ((step === 1 && canGoFromStep1) ||
                  (step === 2 && canGoFromStep2) ||
                  (step === 3 && canSubmit))
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "cursor-not-allowed bg-slate-700 text-slate-500"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                  Posting...
                </span>
              ) : step === 3 ? (
                "Confirm deposit"
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}