"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useDeals } from "@/hooks/useDeals";
import { useAuth } from "@/contexts/AuthContext";

const filters = [
  { id: "all", label: "الكل" },
  { id: "active", label: "نشطة" },
  { id: "pending", label: "معلقة" },
  { id: "completed", label: "مكتملة" },
  { id: "disputed", label: "متنازع عليها" },
];

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-primary/20", text: "text-primary", label: "نشطة" },
  pending: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "معلقة" },
  completed: { bg: "bg-green-500/20", text: "text-green-400", label: "مكتملة" },
  disputed: { bg: "bg-red-500/20", text: "text-red-400", label: "متنازع عليها" },
};

export default function DealsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const { deals, isLoading, error, refresh } = useDeals();
  const { isAuthenticated } = useAuth();

  const filteredDeals = activeFilter === "all"
    ? deals
    : deals.filter((d) => d.status === activeFilter);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-dark font-display">
        <HeaderWithBack title="إدارة الصفقات" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">
              lock
            </span>
            <h2 className="text-xl font-bold text-white mb-2">يجب تسجيل الدخول</h2>
            <p className="text-slate-400 mb-4">سجل الدخول لعرض صفقاتك</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
            >
              تسجيل الدخول
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-dark font-display">
        <HeaderWithBack title="إدارة الصفقات" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin block mx-auto mb-4"></span>
            <p className="text-slate-400">جاري تحميل الصفقات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-dark font-display">
        <HeaderWithBack title="إدارة الصفقات" />
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
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-dark font-display">
      <HeaderWithBack title="إدارة الصفقات" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
          <div className="text-2xl font-bold text-primary">{deals.filter(d => d.status === "active").length}</div>
          <div className="text-sm text-slate-400">صفقة نشطة</div>
        </div>
        <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
          <div className="text-2xl font-bold text-green-400">{deals.filter(d => d.status === "completed").length}</div>
          <div className="text-sm text-slate-400">صفقة مكتملة</div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? "bg-primary text-white"
                  : "bg-surface-highlight text-slate-300 border border-slate-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deals List */}
      <main className="flex-1 px-4 pb-24">
        <div className="space-y-4">
          {filteredDeals.map((deal) => (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="block bg-surface-highlight rounded-xl border border-slate-700 overflow-hidden hover:border-primary transition-colors"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-sm">#{deal.dealNumber || deal.id}</span>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[deal.status]?.bg || "bg-slate-700"} ${statusColors[deal.status]?.text || "text-slate-400"}`}
                    >
                      {statusColors[deal.status]?.label || deal.status}
                    </span>
                  </div>
                  <span className="text-slate-500 text-sm">
                    {new Date(deal.createdAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>
                <h3 className="font-bold text-white text-lg">{deal.material}</h3>
                <p className="text-slate-400 text-sm">{deal.weight} × {deal.price.toLocaleString()} ل.س</p>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">
                      {deal.buyer?.name === "أنت" ? "البائع:" : "المشتري:"}
                    </span>
                    <span className="text-white text-sm">
                      {deal.buyer?.name === "أنت" ? deal.seller?.name : deal.buyer?.name}
                    </span>
                  </div>
                  <div className="text-primary font-bold">
                    {deal.totalAmount.toLocaleString()} ل.س
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredDeals.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">handshake</span>
            <p className="text-slate-400">لا توجد صفقات مطابقة</p>
          </div>
        )}
      </main>

      {/* New Deal Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-dark border-t border-slate-800 p-4 pb-safe">
        <div className="max-w-md mx-auto">
          <Link
            href="/sell"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg bg-primary text-white hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined">add_circle</span>
            صفقة جديدة
          </Link>
        </div>
      </div>
    </div>
  );
}
