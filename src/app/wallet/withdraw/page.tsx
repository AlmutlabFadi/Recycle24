"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import HeaderWithBack from "@/components/HeaderWithBack";
import OTPModal from "@/components/OTPModal";
import { useToast } from "@/contexts/ToastContext";
import { useWallet } from "@/hooks/useWallet";

type SupportedCurrency = "SYP" | "USD";

type WithdrawalMethod = {
  id: "haram" | "syriatel" | "mtn" | "al_fouad";
  name: string;
};

const withdrawalMethods: WithdrawalMethod[] = [
  { id: "haram", name: "Haram" },
  { id: "syriatel", name: "Syriatel Cash" },
  { id: "mtn", name: "MTN Cash" },
  { id: "al_fouad", name: "Al Fouad" },
];

function getMinimumWithdrawalAmount(currency: SupportedCurrency): number {
  return currency === "USD" ? 10 : 1_000;
}

function formatAmount(value: number, currency: SupportedCurrency): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  return safeValue.toLocaleString("en-US", {
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  });
}

export default function WalletWithdrawPage() {
  const [amount, setAmount] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currency, setCurrency] = useState<SupportedCurrency>("SYP");
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(120);

  const { wallet, withdraw } = useWallet();
  const { addToast } = useToast();
  const router = useRouter();

  const balanceTarget =
    currency === "SYP" ? wallet?.availableBalanceSYP : wallet?.availableBalanceUSD;
  const balance = Number(balanceTarget ?? 0);

  const numericAmount =
    currency === "USD"
      ? Number.parseFloat(amount || "0") || 0
      : Number.parseInt(amount || "0", 10) || 0;

  const selectedMethodMeta = withdrawalMethods.find(
    (method) => method.id === selectedMethod,
  );

  const minimumAmount = useMemo(
    () => getMinimumWithdrawalAmount(currency),
    [currency],
  );

  const isAmountValid = numericAmount >= minimumAmount;
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

  const presetAmounts = currency === "SYP" ? [1_000, 5_000, 45_000] : [10, 25, 50];

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
      const response = await withdraw(
        numericAmount,
        selectedMethod,
        accountNumber.trim(),
        currency,
      );

      if (response.requiresOTP) {
        setOtpExpiresIn(response.expiresIn || 120);
        setOtpOpen(true);
        return;
      }

      if (!response.success) {
        addToast(response.error || "Failed to post withdrawal.", "error");
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

  const handleOTPSubmit = async (otpCode: string) => {
    try {
      const response = await withdraw(
        numericAmount,
        selectedMethod,
        accountNumber.trim(),
        currency,
        otpCode,
      );

      if (!response.success) {
        addToast(response.error || "Failed to verify OTP.", "error");
        if (response.error?.includes("منتهي الصلاحية")) {
           setOtpOpen(false);
        }
        return;
      }

      setOtpOpen(false);
      addToast("Withdrawal posted successfully.", "success");
      setStep(4);
      setTimeout(() => { router.push("/wallet"); }, 1500);
    } catch (error) {
       addToast("An error occurred while posting.", "error");
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
            {currency === "USD" ? "$" : ""}
            {formatAmount(balance, currency)} <span className="text-sm">{currency}</span>
          </div>
        </div>

        {step === 1 && (
          <section className="mb-6">
            <h2 className="mb-4 text-lg font-bold text-white">
              Withdrawal amount & currency
            </h2>

            <div className="mb-4 flex rounded-xl bg-slate-800 p-1">
              <button
                onClick={() => {
                  setCurrency("SYP");
                  setAmount("");
                  setSelectedMethod("");
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                  currency === "SYP"
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                SYP
              </button>

              <button
                onClick={() => {
                  setCurrency("USD");
                  setAmount("");
                  setSelectedMethod("");
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                  currency === "USD"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                USD
              </button>
            </div>

            <div className="rounded-xl border border-slate-700 bg-surface-highlight p-4">
              <input
                type="number"
                inputMode="decimal"
                min={minimumAmount}
                step={currency === "USD" ? "0.01" : "1"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={
                  currency === "USD"
                    ? "Enter amount in USD"
                    : "Enter amount in SYP"
                }
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-center text-lg text-white transition-colors focus:border-primary focus:outline-none"
              />

              <div className="mt-3 flex gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-600"
                  >
                    {currency === "USD" ? "$" : ""}
                    {formatAmount(preset, currency)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 text-center text-sm text-slate-400">
              Minimum withdrawal:
              <span className="ml-1 font-bold text-white">
                {currency === "USD" ? "$" : ""}
                {formatAmount(minimumAmount, currency)} {currency}
              </span>
            </div>

            {numericAmount > 0 && (
              <div className="mt-4 rounded-xl border border-slate-700 bg-surface-highlight p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount</span>
                    <span className="text-white">
                      {currency === "USD" ? "$" : ""}
                      {formatAmount(numericAmount, currency)} {currency}
                    </span>
                  </div>

                  <div className="border-t border-slate-700 pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ledger deduction</span>
                      <span className="font-bold text-primary">
                        {currency === "USD" ? "$" : ""}
                        {formatAmount(numericAmount, currency)} {currency}
                      </span>
                    </div>
                  </div>
                </div>

                {!hasEnoughBalance && (
                  <p className="mt-2 text-center text-sm text-red-400">
                    Insufficient available balance.
                  </p>
                )}

                {numericAmount > 0 && !isAmountValid && (
                  <p className="mt-2 text-center text-sm text-red-400">
                    The entered amount is below the minimum withdrawal limit.
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
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    selectedMethod === method.id
                      ? "border-primary bg-primary/10"
                      : "border-slate-700 bg-surface-highlight hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{method.name}</h3>
                      <p className="text-sm text-slate-400">
                        Minimum: {currency === "USD" ? "$" : ""}
                        {formatAmount(minimumAmount, currency)} {currency}
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
                The amount is below the minimum for the selected currency.
              </p>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="space-y-3 rounded-xl border border-slate-700 bg-surface-highlight p-4">
            <h2 className="text-lg font-bold text-white">Confirm withdrawal</h2>

            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Amount</span>
              <span className="text-white">
                {currency === "USD" ? "$" : ""}
                {formatAmount(numericAmount, currency)} {currency}
              </span>
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
                <span className="text-primary">
                  {currency === "USD" ? "$" : ""}
                  {formatAmount(numericAmount, currency)} {currency}
                </span>
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
              The withdrawal request was submitted successfully.
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

      <OTPModal
        isOpen={otpOpen}
        expiresInSeconds={otpExpiresIn}
        onClose={() => setOtpOpen(false)}
        onSubmit={handleOTPSubmit}
      />
    </div>
  );
}