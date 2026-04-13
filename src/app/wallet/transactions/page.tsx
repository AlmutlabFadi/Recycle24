"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useAuth } from "@/contexts/AuthContext";

type UiTransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRANSFER"
  | "EXCHANGE"
  | "PAYMENT"
  | "REFUND";

type WalletCurrency = "SYP" | "USD";
type ActivityStatus = "PENDING" | "COMPLETED" | "REJECTED" | "FAILED";

interface WalletTransactionItem {
  id: string;
  sourceKind:
    | "LEDGER"
    | "DEPOSIT_REQUEST"
    | "PAYOUT_REQUEST"
    | "TRANSFER_REQUEST";
  type: UiTransactionType;
  rawType: string;
  status: ActivityStatus;
  direction: "CREDIT" | "DEBIT" | "NEUTRAL";
  amount: number;
  signedAmount: number;
  currency: WalletCurrency;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  entryId: string | null;
  createdAt: string;
  postedAt: string | null;
  details: Record<string, unknown> | null;
}

interface WalletApiPayload {
  success?: boolean;
  currency?: WalletCurrency;
  wallet?: {
    currency?: WalletCurrency;
    verifiedBalance?: number;
    availableBalance?: number;
    heldAmount?: number;
    isLocked?: boolean;
    accountSlug?: string | null;
  };
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
  TRANSFER: { label: "حوالة", icon: "swap_horiz", color: "text-cyan-400" },
  EXCHANGE: { label: "صرافة", icon: "currency_exchange", color: "text-violet-400" },
  PAYMENT: { label: "دفعة", icon: "payments", color: "text-orange-400" },
  REFUND: { label: "استرداد", icon: "replay", color: "text-blue-400" },
};

const statusLabels: Record<
  ActivityStatus,
  { label: string; className: string }
> = {
  COMPLETED: {
    label: "مكتمل",
    className: "bg-green-500/20 text-green-400",
  },
  PENDING: {
    label: "قيد المراجعة",
    className: "bg-amber-500/20 text-amber-400",
  },
  REJECTED: {
    label: "مرفوض",
    className: "bg-red-500/20 text-red-400",
  },
  FAILED: {
    label: "فشل",
    className: "bg-red-500/20 text-red-400",
  },
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleDateString("ar-SY", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatTime(dateString: string | null): string {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleTimeString("ar-SY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatAmount(amount: number, currency: WalletCurrency): string {
  const normalized = normalizeNumber(amount).toLocaleString("ar-SY");
  return currency === "USD" ? `${normalized} USD` : `${normalized} ل.س`;
}

function getDetailValue(
  details: Record<string, unknown> | null | undefined,
  key: string
): string {
  if (!details) return "-";

  const value = details[key];

  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return `${value}`;
  if (typeof value === "boolean") return value ? "نعم" : "لا";

  return "-";
}

function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-dark font-display">
      <HeaderWithBack title="سجل المعاملات" />
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </main>
    </div>
  );
}

function WalletTransactionsPageContent() {
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();

  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [selectedFilter, setSelectedFilter] =
    useState<(typeof filters)[number]>("all");
  const [selectedCurrency, setSelectedCurrency] =
    useState<WalletCurrency>("SYP");
  const [isLoading, setIsLoading] = useState(true);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [verifiedBalance, setVerifiedBalance] = useState(0);
  const [heldAmount, setHeldAmount] = useState(0);
  const [accountSlug, setAccountSlug] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<WalletTransactionItem | null>(null);

  const focusId = searchParams.get("focus");

  const currentBalanceLabel = useMemo(() => {
    return formatAmount(availableBalance, selectedCurrency);
  }, [availableBalance, selectedCurrency]);

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) {
        setTransactions([]);
        setAvailableBalance(0);
        setVerifiedBalance(0);
        setHeldAmount(0);
        setAccountSlug(null);
        setSelectedTransaction(null);
        setIsLoading(false);
        return;
      }

      try {
        const txRes = await fetch(
          `/api/wallet/transactions?userId=${encodeURIComponent(
            user.id
          )}&type=${selectedFilter}&currency=${selectedCurrency}`,
          { cache: "no-store" }
        );

        const txData = (await txRes.json()) as WalletApiPayload;

        if (txData.success && txData.wallet) {
          setAvailableBalance(normalizeNumber(txData.wallet.availableBalance));
          setVerifiedBalance(normalizeNumber(txData.wallet.verifiedBalance));
          setHeldAmount(normalizeNumber(txData.wallet.heldAmount));
          setAccountSlug(txData.wallet.accountSlug ?? null);
        } else {
          setAvailableBalance(0);
          setVerifiedBalance(0);
          setHeldAmount(0);
          setAccountSlug(null);
        }

        if (txData.success && Array.isArray(txData.transactions)) {
          const normalized = txData.transactions.map((tx) => ({
            ...tx,
            amount: normalizeNumber(tx.amount),
            signedAmount: normalizeNumber(tx.signedAmount),
            currency:
              tx.currency === "USD" || tx.currency === "SYP"
                ? tx.currency
                : selectedCurrency,
          }));

          setTransactions(normalized);

          if (focusId) {
            const found = normalized.find(
              (tx) => tx.referenceId === focusId || tx.id === focusId
            );
            setSelectedTransaction(found ?? null);
          } else {
            setSelectedTransaction(null);
          }
        } else {
          setTransactions([]);
          setSelectedTransaction(null);
        }
      } catch (error) {
        console.error("Error fetching wallet transactions:", error);
        setTransactions([]);
        setAvailableBalance(0);
        setVerifiedBalance(0);
        setHeldAmount(0);
        setAccountSlug(null);
        setSelectedTransaction(null);
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    void fetchData();
  }, [user?.id, selectedFilter, selectedCurrency, focusId]);

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
          <span className="text-white/80">الرصيد المتاح الحالي</span>
          <Link href="/wallet" className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="mb-2 text-3xl font-bold text-white">
          {currentBalanceLabel}
        </div>

        <div className="space-y-1 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[16px]">
              account_balance_wallet
            </span>
            <span>
              دفتر الأستاذ: {formatAmount(verifiedBalance, selectedCurrency)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[16px]">
              hourglass_top
            </span>
            <span>
              المبلغ المحجوز: {formatAmount(heldAmount, selectedCurrency)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[16px]">
              badge
            </span>
            <span className="font-mono text-xs">
              {accountSlug || "NO_LEDGER_ACCOUNT"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="mb-3 flex gap-2">
          <button
            onClick={() => setSelectedCurrency("SYP")}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              selectedCurrency === "SYP"
                ? "bg-primary text-white"
                : "border border-slate-700 bg-surface-highlight text-slate-300"
            }`}
          >
            SYP
          </button>

          <button
            onClick={() => setSelectedCurrency("USD")}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              selectedCurrency === "USD"
                ? "bg-primary text-white"
                : "border border-slate-700 bg-surface-highlight text-slate-300"
            }`}
          >
            USD
          </button>
        </div>

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
              {filter === "payment" && "مدفوعات / تحويل / صرافة"}
              {filter === "refund" && "استردادات"}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const txAmount = normalizeNumber(transaction.amount);
              const isPositive = transaction.direction === "CREDIT";
              const labelConfig =
                typeLabels[transaction.type] ?? typeLabels.PAYMENT;
              const statusConfig =
                statusLabels[transaction.status] ?? statusLabels.PENDING;
              const dateLabel = transaction.postedAt ?? transaction.createdAt;

              return (
                <button
                  key={transaction.id}
                  type="button"
                  onClick={() => setSelectedTransaction(transaction)}
                  className="block w-full rounded-xl border border-slate-700 bg-surface-highlight p-4 text-right transition hover:border-primary"
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
                          المصدر: {transaction.sourceKind}
                        </p>

                        {transaction.referenceId && (
                          <p className="mt-1 font-mono text-[11px] text-slate-500">
                            REF: {transaction.referenceId}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          isPositive
                            ? "text-green-400"
                            : transaction.direction === "DEBIT"
                            ? "text-red-400"
                            : "text-slate-300"
                        }`}
                      >
                        {transaction.direction === "CREDIT"
                          ? "+"
                          : transaction.direction === "DEBIT"
                          ? "-"
                          : ""}
                        {formatAmount(txAmount, transaction.currency)}
                      </div>

                      <div className="text-xs text-slate-500">
                        {formatDate(dateLabel)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-700 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        رقم العملية:
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        {transaction.id.slice(0, 24)}...
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {formatTime(dateLabel)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${statusConfig.className}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </button>
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
              لا توجد أي حركات مالية أو طلبات مالية معروضة لهذه المحفظة حتى الآن.
            </p>
          </div>
        )}
      </main>

      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-surface-dark p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  تفاصيل العملية
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {typeLabels[selectedTransaction.type]?.label ??
                    selectedTransaction.type}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="rounded-xl border border-slate-700 px-3 py-2 text-slate-300 hover:border-primary hover:text-white"
              >
                إغلاق
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailItem
                label="الحالة"
                value={
                  statusLabels[selectedTransaction.status]?.label ??
                  selectedTransaction.status
                }
              />
              <DetailItem
                label="المبلغ"
                value={formatAmount(
                  selectedTransaction.amount,
                  selectedTransaction.currency
                )}
              />
              <DetailItem label="العملة" value={selectedTransaction.currency} />
              <DetailItem label="النوع الخام" value={selectedTransaction.rawType} />
              <DetailItem label="المرجع" value={selectedTransaction.referenceId ?? "-"} />
              <DetailItem label="نوع المرجع" value={selectedTransaction.referenceType ?? "-"} />
              <DetailItem
                label="تاريخ الإنشاء"
                value={`${formatDate(selectedTransaction.createdAt)} ${formatTime(
                  selectedTransaction.createdAt
                )}`}
              />
              <DetailItem
                label="تاريخ التنفيذ"
                value={
                  selectedTransaction.postedAt
                    ? `${formatDate(selectedTransaction.postedAt)} ${formatTime(
                        selectedTransaction.postedAt
                      )}`
                    : "-"
                }
              />
              <DetailItem label="الوصف" value={selectedTransaction.description ?? "-"} />
              <DetailItem label="المصدر" value={selectedTransaction.sourceKind} />
              <DetailItem label="اسم المرسل" value={getDetailValue(selectedTransaction.details, "senderName")} />
              <DetailItem label="هاتف المرسل" value={getDetailValue(selectedTransaction.details, "senderPhone")} />
              <DetailItem label="بريد المرسل" value={getDetailValue(selectedTransaction.details, "senderEmail")} />
              <DetailItem label="عنوان محفظة المرسل" value={getDetailValue(selectedTransaction.details, "senderWalletAddress")} />
              <DetailItem label="اسم المتلقي" value={getDetailValue(selectedTransaction.details, "receiverName")} />
              <DetailItem label="هاتف المتلقي" value={getDetailValue(selectedTransaction.details, "receiverPhone")} />
              <DetailItem label="بريد المتلقي" value={getDetailValue(selectedTransaction.details, "receiverEmail")} />
              <DetailItem label="عنوان محفظة المتلقي" value={getDetailValue(selectedTransaction.details, "receiverWalletAddress")} />
              <DetailItem label="وسيلة العملية" value={getDetailValue(selectedTransaction.details, "method")} />
              <DetailItem label="الوجهة" value={getDetailValue(selectedTransaction.details, "destination")} />
              <DetailItem label="ملاحظة المراجعة" value={getDetailValue(selectedTransaction.details, "reviewNote")} />
              <DetailItem label="مرحلة الاعتماد" value={getDetailValue(selectedTransaction.details, "approvalStage")} />
              <DetailItem label="سبب الفشل" value={getDetailValue(selectedTransaction.details, "failureReason")} />
            </div>
          </div>
        </div>
      )}

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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-surface-highlight p-3">
      <p className="mb-1 text-xs text-slate-500">{label}</p>
      <p className="break-all text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function WalletTransactionsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <WalletTransactionsPageContent />
    </Suspense>
  );
}
