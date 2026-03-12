"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useAuth } from "@/contexts/AuthContext";

type UiTransactionType = "DEPOSIT" | "WITHDRAWAL" | "PAYMENT" | "REFUND";

interface WalletTransactionItem {
  id: string;
  type: UiTransactionType;
  rawType: string;
  status: "COMPLETED";
  direction: "CREDIT" | "DEBIT";
  amount: number;
  signedAmount: number;
  currency: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  entryId: string;
  createdAt: string;
  postedAt: string;
}

interface WalletApiResponse {
  success?: boolean;
  wallet?: {
    balance?: number;
    balanceSYP?: number;
    verifiedBalance?: number;
    availableBalance?: number;
    heldAmount?: number;
  };
}

interface TransactionsApiResponse {
  success?: boolean;
  transactions?: WalletTransactionItem[];
  total?: number;
  nextCursor?: string | null;
}

const filters = ["all", "deposit", "withdrawal", "payment", "refund"] as const;

const typeLabels: Record<
  UiTransactionType,
  { label: string; icon: string; color: string }
> = {
  DEPOSIT: { label: "إيداع", icon: "add_circle", color: "text-green-400" },
  WITHDRAWAL: { label: "سحب", icon: "remove_circle", color: "text-red-400" },
  PAYMENT: { label: "دفع", icon: "payments", color: "text-orange-400" },
  REFUND: { label: "استرداد", icon: "replay", color: "text-blue-400" },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  return date.toLocaleDateString("ar-SY", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);

  return date.toLocaleTimeString("ar-SY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export default function WalletTransactionsPage() {
  const { user, isAuthenticated } = useAuth();

  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [selectedFilter, setSelectedFilter] =
    useState<(typeof filters)[number]>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) {
        setTransactions([]);
        setBalance(0);
        setIsLoading(false);
        return;
      }

      try {
        const [walletRes, txRes] = await Promise.all([
          fetch(`/api/wallet?userId=${user.id}`, { cache: "no-store" }),
          fetch(
            `/api/wallet/transactions?userId=${user.id}&type=${selectedFilter}`,
            { cache: "no-store" }
          ),
        ]);

        const walletData = (await walletRes.json()) as WalletApiResponse;
        const txData = (await txRes.json()) as TransactionsApiResponse;

        if (walletData.success && walletData.wallet) {
          const nextBalance =
            walletData.wallet.availableBalance ??
            walletData.wallet.verifiedBalance ??
            walletData.wallet.balanceSYP ??
            walletData.wallet.balance ??
            0;

          setBalance(normalizeNumber(nextBalance));
        } else {
          setBalance(0);
        }

        if (txData.success && Array.isArray(txData.transactions)) {
          setTransactions(
            txData.transactions.map((tx) => ({
              ...tx,
              amount: normalizeNumber(tx.amount),
              signedAmount: normalizeNumber(tx.signedAmount),
            }))
          );
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error("Error fetching wallet transactions:", error);
        setBalance(0);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    void fetchData();
  }, [user?.id, selectedFilter]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-bg-dark font-display">
        <HeaderWithBack title="سجل المعاملات" />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <span className="material-symbols-outlined mb-4 !text-6xl text-slate-600">
              lock
            </span>
            <p className="mb-4 text-slate-400">
              يرجى تسجيل الدخول للوصول إلى سجل المعاملات
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white"
            >
              تسجيل الدخول
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-dark font-display">
      <HeaderWithBack title="سجل المعاملات" />

      <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-white/80">الرصيد الحالي</span>
          <Link href="/wallet" className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="mb-2 text-3xl font-bold text-white">
          {normalizeNumber(balance).toLocaleString("ar-SY")}{" "}
          <span className="text-lg">ل.س</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-white/70">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-[16px]">wallet</span>
            محفظة رئيسية
          </span>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedFilter === filter
                  ? "bg-primary text-white"
                  : "border border-slate-700 bg-surface-highlight text-slate-300"
              }`}
            >
              {filter === "all" && "الكل"}
              {filter === "deposit" && "إيداعات"}
              {filter === "withdrawal" && "سحوبات"}
              {filter === "payment" && "مدفوعات"}
              {filter === "refund" && "استردادات"}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const txAmount = normalizeNumber(transaction.amount);
              const isPositive =
                transaction.type === "DEPOSIT" || transaction.type === "REFUND";

              const labelConfig =
                typeLabels[transaction.type] ?? typeLabels.PAYMENT;

              return (
                <div
                  key={transaction.id}
                  className="rounded-xl border border-slate-700 bg-surface-highlight p-4"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 ${labelConfig.color}`}
                      >
                        <span className="material-symbols-outlined">
                          {labelConfig.icon}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-white">
                          {labelConfig.label}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {transaction.description || transaction.rawType}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          النوع المحاسبي: {transaction.rawType}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          isPositive ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {isPositive ? "+" : "-"}
                        {txAmount.toLocaleString("ar-SY")} ل.س
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDate(transaction.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-700 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">رقم العملية:</span>
                      <span className="font-mono text-xs text-slate-400">
                        {transaction.id.slice(0, 12)}...
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {formatTime(transaction.createdAt)}
                      </span>
                      <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
                        مكتمل
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <span className="material-symbols-outlined mb-4 text-6xl text-slate-600">
              receipt_long
            </span>
            <h3 className="mb-2 text-lg font-bold text-white">
              لا توجد معاملات بعد
            </h3>
            <p className="mx-auto max-w-sm text-slate-400">
              لا توجد أي حركات مالية منشورة في دفتر الأستاذ لهذه المحفظة حتى الآن.
            </p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-surface-dark p-4 pb-safe">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
          <Link
            href="/wallet/deposit"
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-bold text-white transition-all hover:bg-green-700"
          >
            <span className="material-symbols-outlined">add_circle</span>
            إيداع
          </Link>

          <Link
            href="/wallet/withdraw"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-surface-highlight px-4 py-3 font-bold text-white transition-all hover:border-primary"
          >
            <span className="material-symbols-outlined">remove_circle</span>
            سحب
          </Link>
        </div>
      </div>
    </div>
  );
}