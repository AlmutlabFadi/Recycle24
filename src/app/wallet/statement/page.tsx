"use client";

import { useEffect, useState, useCallback } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useAuth } from "@/contexts/AuthContext";

type BreakdownEntry = { credit: number; debit: number; count: number };

type HoldItem = {
  id: string;
  amount: number;
  referenceType: string;
  referenceId: string;
  createdAt: string;
  expiresAt: string | null;
};

type StatementEntry = {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  metadata: Record<string, unknown> | null;
};

type RequestItem = {
  id: string;
  amount: number;
  status: string;
  method?: string;
  destination?: string;
  createdAt: string;
};

type StatementData = {
  year: number;
  month: number;
  currency: string;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  entries: StatementEntry[];
  breakdown: Record<string, BreakdownEntry>;
  activeHolds: HoldItem[];
  depositRequests: RequestItem[];
  payoutRequests: RequestItem[];
  transferRequestsSent: RequestItem[];
  transferRequestsReceived: RequestItem[];
};

const TYPE_LABELS: Record<string, string> = {
  WALLET_DEPOSIT: "إيداع في المحفظة",
  WALLET_WITHDRAWAL: "سحب من المحفظة",
  AUCTION_JOIN_DEPOSIT: "تأمين مشاركة مزاد",
  AUCTION_JOIN_FEE: "رسوم مشاركة مزاد",
  AUCTION_REFUND: "استرداد تأمين مزاد",
  AUCTION_WIN_PAYMENT: "دفع معاملة فوز بمزاد",
  DEAL_PAYMENT: "دفع معاملة صفقة",
  FEE_COLLECTION: "رسوم النظام",
  PLATFORM_COMMISSION: "عمولة المنصة",
  REWARD_PAYMENT: "دفع مكافأة",
  EXCHANGE: "تبديل عملة",
  UNKNOWN: "غير محدد",
};

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function statusBadge(status: string) {
  if (status === "COMPLETED" || status === "APPROVED") return "bg-emerald-500/20 text-emerald-400";
  if (status === "PENDING") return "bg-amber-500/20 text-amber-400";
  if (status === "REJECTED" || status === "FAILED") return "bg-rose-500/20 text-rose-400";
  return "bg-slate-500/20 text-slate-400";
}

export default function WalletStatementPage() {
  const { token } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [currency, setCurrency] = useState<"SYP" | "USD">("SYP");
  const [statement, setStatement] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"overview" | "entries" | "holds" | "requests">("overview");

  const fetchStatement = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/wallet/statement?year=${year}&month=${month}&currency=${currency}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load statement");
      setStatement(data.statement);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [year, month, currency, token]);

  useEffect(() => {
    void fetchStatement();
  }, [fetchStatement]);

  const yearsAvailable = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="flex min-h-screen flex-col bg-bg-dark font-display">
      <HeaderWithBack title="كشف الحساب الشهري" />

      {/* Filters */}
      <div className="border-b border-slate-800 bg-surface-dark px-4 py-3 space-y-3">
        {/* Currency Toggle */}
        <div className="flex rounded-xl bg-slate-800 p-1">
          <button
            onClick={() => setCurrency("SYP")}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
              currency === "SYP" ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            ليرة سورية (SYP)
          </button>
          <button
            onClick={() => setCurrency("USD")}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
              currency === "USD" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            دولار أمريكي (USD)
          </button>
        </div>

        {/* Year and Month selectors */}
        <div className="flex gap-2">
          <select
            value={year}
            aria-label="Year"
            title="Year"
            onChange={(e) => setYear(Number(e.target.value))}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
          >
            {yearsAvailable.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={month}
            aria-label="Month"
            title="Month"
            onChange={(e) => setMonth(Number(e.target.value))}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
          >
            {MONTHS_AR.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
        {(["overview", "entries", "holds", "requests"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-all ${
              activeSection === tab
                ? "bg-primary text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {tab === "overview" ? "نظرة عامة" : tab === "entries" ? "القيود المحاسبية" : tab === "holds" ? "المبالغ المحجوزة" : "الطلبات"}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 pb-24">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
            {error}
          </div>
        )}

        {!loading && statement && activeSection === "overview" && (
          <div className="space-y-4">
            {/* Balance Summary Card */}
            <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-b from-surface-dark to-slate-900 p-5">
              <h3 className="text-sm font-bold text-slate-400 mb-4">
                ملخص {MONTHS_AR[month - 1]} {year} ({currency})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">رصيد أول المدة</p>
                  <p className="text-lg font-bold text-white font-english">{statement.openingBalance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">رصيد آخر المدة</p>
                  <p className="text-lg font-bold text-white font-english">{statement.closingBalance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider">إجمالي الوارد</p>
                  <p className="text-lg font-bold text-emerald-400 font-english">+{statement.totalCredits.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-rose-400/70 uppercase tracking-wider">إجمالي الصادر</p>
                  <p className="text-lg font-bold text-rose-400 font-english">-{statement.totalDebits.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Type Breakdown */}
            <div className="rounded-2xl border border-slate-700/50 bg-surface-dark p-5">
              <h3 className="text-sm font-bold text-white mb-3">تفصيل حسب نوع العملية</h3>
              {Object.keys(statement.breakdown).length === 0 ? (
                <p className="text-sm text-slate-500">لا توجد عمليات في هذا الشهر</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(statement.breakdown).map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between rounded-xl bg-slate-800/50 p-3">
                      <div>
                        <p className="text-sm font-bold text-white">{TYPE_LABELS[type] || type}</p>
                        <p className="text-[10px] text-slate-500">{data.count} عملية</p>
                      </div>
                      <div className="text-left">
                        {data.credit > 0 && (
                          <p className="text-sm font-bold text-emerald-400 font-english">+{data.credit.toLocaleString()}</p>
                        )}
                        {data.debit > 0 && (
                          <p className="text-sm font-bold text-rose-400 font-english">-{data.debit.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Holds Summary */}
            {statement.activeHolds.length > 0 && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                <h3 className="text-sm font-bold text-amber-400 mb-2">المبالغ المحجوزة حالياً</h3>
                <p className="text-2xl font-bold text-white font-english">
                  {statement.activeHolds.reduce((sum, h) => sum + h.amount, 0).toLocaleString()} {currency}
                </p>
                <p className="text-xs text-amber-400/60 mt-1">{statement.activeHolds.length} حجز نشط</p>
              </div>
            )}
          </div>
        )}

        {/* Entries (Ledger Journal lines) */}
        {!loading && statement && activeSection === "entries" && (
          <div className="space-y-2">
            {statement.entries.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                <p>لا توجد قيود في هذا الشهر</p>
              </div>
            ) : (
              statement.entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-highlight border border-slate-700/50">
                  <div className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
                    entry.amount > 0 ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
                  }`}>
                    <span className="material-symbols-outlined !text-[18px]">
                      {entry.amount > 0 ? "arrow_downward" : "arrow_upward"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{entry.description}</p>
                    <p className="text-[10px] text-slate-500">
                      {TYPE_LABELS[entry.type] || entry.type} • {new Date(entry.date).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                  <p className={`text-sm font-bold font-english ${entry.amount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {entry.amount > 0 ? "+" : ""}{entry.amount.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Active Holds Detail */}
        {!loading && statement && activeSection === "holds" && (
          <div className="space-y-2">
            {statement.activeHolds.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2">lock_open</span>
                <p>لا توجد مبالغ محجوزة حالياً</p>
              </div>
            ) : (
              statement.activeHolds.map((hold) => (
                <div key={hold.id} className="rounded-xl border border-amber-500/20 bg-surface-highlight p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-white">{hold.referenceType}</p>
                      <p className="text-[10px] text-slate-500 font-english">{hold.referenceId}</p>
                    </div>
                    <p className="text-lg font-bold text-amber-400 font-english">{hold.amount.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
                    <span>تاريخ الحجز: {new Date(hold.createdAt).toLocaleDateString("ar-SA")}</span>
                    {hold.expiresAt && <span>ينتهي: {new Date(hold.expiresAt).toLocaleDateString("ar-SA")}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Requests History */}
        {!loading && statement && activeSection === "requests" && (
          <div className="space-y-4">
            {/* Deposit Requests */}
            <div>
              <h3 className="text-sm font-bold text-white mb-2">طلبات الإيداع ({statement.depositRequests.length})</h3>
              {statement.depositRequests.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد طلبات إيداع</p>
              ) : (
                <div className="space-y-2">
                  {statement.depositRequests.map((req) => (
                    <div key={req.id} className="flex justify-between items-center rounded-xl bg-surface-highlight border border-slate-700/50 p-3">
                      <div>
                        <p className="text-sm font-bold text-white font-english">+{req.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">{req.method} • {new Date(req.createdAt).toLocaleDateString("ar-SA")}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusBadge(req.status)}`}>{req.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payout Requests */}
            <div>
              <h3 className="text-sm font-bold text-white mb-2">طلبات السحب ({statement.payoutRequests.length})</h3>
              {statement.payoutRequests.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد طلبات سحب</p>
              ) : (
                <div className="space-y-2">
                  {statement.payoutRequests.map((req) => (
                    <div key={req.id} className="flex justify-between items-center rounded-xl bg-surface-highlight border border-slate-700/50 p-3">
                      <div>
                        <p className="text-sm font-bold text-white font-english">-{req.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">{req.method} → {req.destination} • {new Date(req.createdAt).toLocaleDateString("ar-SA")}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusBadge(req.status)}`}>{req.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transfer Requests Sent */}
            <div>
              <h3 className="text-sm font-bold text-white mb-2">تحويلات صادرة ({statement.transferRequestsSent.length})</h3>
              {statement.transferRequestsSent.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد تحويلات صادرة</p>
              ) : (
                <div className="space-y-2">
                  {statement.transferRequestsSent.map((req) => (
                    <div key={req.id} className="flex justify-between items-center rounded-xl bg-surface-highlight border border-slate-700/50 p-3">
                      <div>
                        <p className="text-sm font-bold text-white font-english">-{req.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">{new Date(req.createdAt).toLocaleDateString("ar-SA")}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusBadge(req.status)}`}>{req.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transfer Requests Received */}
            <div>
              <h3 className="text-sm font-bold text-white mb-2">تحويلات واردة ({statement.transferRequestsReceived.length})</h3>
              {statement.transferRequestsReceived.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد تحويلات واردة</p>
              ) : (
                <div className="space-y-2">
                  {statement.transferRequestsReceived.map((req) => (
                    <div key={req.id} className="flex justify-between items-center rounded-xl bg-surface-highlight border border-slate-700/50 p-3">
                      <div>
                        <p className="text-sm font-bold text-emerald-400 font-english">+{req.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">{new Date(req.createdAt).toLocaleDateString("ar-SA")}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusBadge(req.status)}`}>{req.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
