"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";
import { useWallet } from "@/hooks/useWallet";

const withdrawalMethods = [
  { id: "haram", name: "Haram", icon: "🏦", minAmount: 50000 },
  { id: "syriatel", name: "Syriatel Cash", icon: "📱", minAmount: 10000 },
  { id: "mtn", name: "MTN Cash", icon: "📲", minAmount: 10000 },
  { id: "al_fouad", name: "Al Fouad", icon: "🏪", minAmount: 50000 },
] as const;

export default function WalletWithdrawPage() {
  const [amount, setAmount] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { wallet, withdraw } = useWallet();
  const { addToast } = useToast();
  const router = useRouter();

  const walletAny = wallet as Record<string, unknown> | null | undefined;
  const balance = Number(
    walletAny?.availableBalance ??
      walletAny?.balance ??
      walletAny?.balanceSYP ??
      walletAny?.currentBalance ??
      walletAny?.amount ??
      0
  );

  const numericAmount = Number.parseInt(amount || "0", 10) || 0;
  const selectedMethodMeta = withdrawalMethods.find((method) => method.id === selectedMethod);

  const isAmountValid = numericAmount >= (selectedMethodMeta?.minAmount ?? 0);
  const hasEnoughBalance = balance >= numericAmount;

  const canGoFromStep1 = numericAmount > 0 && hasEnoughBalance;
  const canGoFromStep2 =
    selectedMethod.length > 0 &&
    accountNumber.trim().length > 0 &&
    isAmountValid;
  const canSubmit =
    numericAmount > 0 &&
    selectedMethod.length > 0 &&
    accountNumber.trim().length > 0 &&
    isAmountValid &&
    hasEnoughBalance &&
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
      const success = await withdraw(numericAmount, selectedMethod, accountNumber);

      if (!success) {
        addToast("Failed to post withdrawal.", "error");
        return;
      }

      addToast("Withdrawal posted successfully.", "success");
      setStep(4);

      setTimeout(() => {
        router.push("/wallet");
      }, 1500);
    } catch (error) {
      console.error("Withdrawal submission error:", error);
      addToast("An error occurred while posting the withdrawal.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-dark font-display">
      <HeaderWithBack title="Wallet Withdrawal" />

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
        <div className="mb-6 rounded-xl border border-slate-700 bg-surface-highlight p-4">
          <span className="text-sm text-slate-400">Available balance</span>
          <div className="text-2xl font-bold text-white">
            {balance.toLocaleString()} <span className="text-sm">SYP</span>
          </div>
        </div>

        {step === 1 && (
          <section className="mb-6">
            <h2 className="mb-4 text-lg font-bold text-white">Withdrawal amount</h2>

            <div className="rounded-xl border border-slate-700 bg-surface-highlight p-4">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-center text-lg text-white transition-colors focus:border-primary focus:outline-none"
              />

              <div className="mt-3 flex gap-2">
                {[50000, 100000, 250000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-600"
                  >
                    {preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {numericAmount > 0 && (
              <div className="mt-4 rounded-xl border border-slate-700 bg-surface-highlight p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount</span>
                    <span className="text-white">
                      {numericAmount.toLocaleString()} SYP
                    </span>
                  </div>

                  <div className="border-t border-slate-700 pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ledger deduction</span>
                      <span className="font-bold text-primary">
                        {numericAmount.toLocaleString()} SYP
                      </span>
                    </div>
                  </div>
                </div>

                {!hasEnoughBalance && (
                  <p className="mt-2 text-center text-sm text-red-400">
                    Insufficient available balance.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="mb-6">
            <div className="mb-6 space-y-3">
              {withdrawalMethods.map((method) => (
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
                      <p className="text-sm text-slate-400">
                        Minimum: {method.minAmount.toLocaleString()} SYP
                      </p>
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

            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Account number / wallet number"
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-primary focus:outline-none"
            />

            {selectedMethod && !isAmountValid && (
              <p className="mt-3 text-sm text-red-400">
                The amount is below the minimum for the selected method.
              </p>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="space-y-3 rounded-xl border border-slate-700 bg-surface-highlight p-4">
            <h2 className="text-lg font-bold text-white">Confirm withdrawal</h2>

            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Amount</span>
              <span className="text-white">{numericAmount.toLocaleString()} SYP</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Method</span>
              <span className="text-white">{selectedMethodMeta?.name || "-"}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Destination</span>
              <span className="text-white">{accountNumber}</span>
            </div>

            <div className="border-t border-slate-700 pt-3">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-300">Posted withdrawal</span>
                <span className="text-primary">{numericAmount.toLocaleString()} SYP</span>
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
            <h2 className="mb-2 text-xl font-bold text-emerald-400">
              Withdrawal posted
            </h2>
            <p className="text-sm text-slate-300">
              The wallet balance was updated immediately.
            </p>
          </section>
        )}
      </main>

      {step !== 4 && (
        <div className="border-t border-slate-800 bg-bg-dark p-4">
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && !canGoFromStep1) ||
                (step === 2 && !canGoFromStep2)
              }
              className="w-full rounded-2xl bg-primary py-4 font-bold text-white disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-primary py-4 font-bold text-white disabled:opacity-50"
            >
              {isSubmitting ? "Posting..." : "Confirm withdrawal"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}