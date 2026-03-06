"use client";

import { useState, useEffect } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Deal {
    id: string;
    materialType: string;
    weight: number;
    totalAmount: number;
    platformFee: number;
    status: string;
    createdAt: string;
    buyer: { name: string; phone: string };
    seller: { name: string; phone: string };
}

interface Summary {
    totalVolume: number;
    totalFees: number;
    totalCount: number;
    completedVolume: number;
    completedCount: number;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "قيد الانتظار", color: "text-amber-500", bg: "bg-amber-500/10" },
    CONTRACT_SIGNED: { label: "تم توقيع العقد", color: "text-blue-500", bg: "bg-blue-500/10" },
    DEPOSIT_PAID: { label: "تم دفع العربون", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    COMPLETED: { label: "مكتملة", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    CANCELLED: { label: "ملغاة", color: "text-red-500", bg: "bg-red-500/10" },
    DISPUTED: { label: "نزاع", color: "text-rose-600", bg: "bg-rose-600/20" },
};

function formatPrice(amount: number) {
    return new Intl.NumberFormat("ar-SY").format(amount);
}

export default function AdminDealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeStatus, setActiveStatus] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchDeals();
    }, [activeStatus]);

    async function fetchDeals() {
        setLoading(true);
        try {
            const statusQuery = activeStatus === "ALL" ? "" : `&status=${activeStatus}`;
            const res = await fetch(`/api/admin/deals?limit=100${statusQuery}`);
            const data = await res.json();
            if (data.success) {
                setDeals(data.deals);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error("Error fetching deals:", error);
        } finally {
            setLoading(false);
        }
    }

    const filteredDeals = deals.filter(d => 
        d.id.includes(searchQuery) ||
        d.materialType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.buyer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.seller.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="مركز الصفقات" />

            <main className="flex-1 p-4 lg:max-w-6xl lg:mx-auto w-full pb-24">
                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                        <div className="bg-surface-highlight p-4 rounded-3xl border border-slate-800">
                            <p className="text-[10px] text-slate-500 mb-1">إجمالي التداول</p>
                            <p className="text-xl font-bold text-white font-english">{formatPrice(summary.totalVolume)}</p>
                            <p className="text-[10px] text-slate-600 mt-1">ل.س</p>
                        </div>
                        <div className="bg-surface-highlight p-4 rounded-3xl border border-slate-800">
                            <p className="text-[10px] text-slate-500 mb-1">الرسوم المحصلة</p>
                            <p className="text-xl font-bold text-primary font-english">{formatPrice(summary.totalFees)}</p>
                            <p className="text-[10px] text-primary/60 mt-1">ل.س</p>
                        </div>
                        <div className="bg-surface-highlight p-4 rounded-3xl border border-slate-800">
                            <p className="text-[10px] text-slate-500 mb-1">عدد الصفقات</p>
                            <p className="text-xl font-bold text-white font-english">{summary.totalCount}</p>
                            <p className="text-[10px] text-slate-600 mt-1">عملية</p>
                        </div>
                        <div className="bg-surface-highlight p-4 rounded-3xl border border-slate-800">
                            <p className="text-[10px] text-slate-500 mb-1">معدل الإكمال</p>
                            <p className="text-xl font-bold text-emerald-500 font-english">
                                {Math.round((summary.completedCount / (summary.totalCount || 1)) * 100)}%
                            </p>
                            <p className="text-[10px] text-emerald-500/60 mt-1">{summary.completedCount} مكتملة</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                    {["ALL", "PENDING", "DEPOSIT_PAID", "COMPLETED", "CANCELLED", "DISPUTED"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setActiveStatus(status)}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                activeStatus === status
                                    ? "bg-primary text-white"
                                    : "bg-surface-highlight text-slate-400"
                            }`}
                        >
                            {status === "ALL" ? "الكل" : statusMap[status]?.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="ابحث برقم الصفقة، المادة، أو أسماء الأطراف..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface-highlight border border-slate-700 rounded-2xl py-3 pr-11 pl-4 text-white focus:border-primary outline-none"
                    />
                </div>

                {/* Deals List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
                    </div>
                ) : filteredDeals.length === 0 ? (
                    <div className="text-center py-20 bg-surface-highlight rounded-3xl border border-slate-800">
                        <span className="material-symbols-outlined !text-6xl text-slate-600 mb-4">handshake</span>
                        <p className="text-slate-400 font-medium">لا توجد صفقات حالياً</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredDeals.map((deal) => (
                            <div
                                key={deal.id}
                                className="bg-surface-highlight border border-slate-700 rounded-3xl p-5 hover:border-slate-500 transition grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
                            >
                                <div className="md:col-span-1">
                                    <p className="text-[10px] text-slate-500 mb-1">رقم الصفقة: {deal.id.slice(-6)}</p>
                                    <h3 className="text-white font-bold">{deal.materialType}</h3>
                                    <p className="text-xs text-slate-400">{deal.weight} كغ</p>
                                </div>
                                <div className="md:col-span-1">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] text-slate-500">البائع: <span className="text-white font-medium">{deal.seller?.name || 'غير معروف'}</span></p>
                                        <p className="text-[10px] text-slate-500">المشتري: <span className="text-white font-medium">{deal.buyer?.name || 'غير معروف'}</span></p>
                                    </div>
                                </div>
                                <div className="md:col-span-1 text-right">
                                    <p className="text-lg font-bold text-white font-english">{formatPrice(deal.totalAmount)}</p>
                                    <p className="text-[10px] text-primary/70">عمولة: {formatPrice(deal.platformFee)} ل.س</p>
                                </div>
                                <div className="md:col-span-1 flex flex-col items-end gap-2">
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${statusMap[deal.status]?.bg} ${statusMap[deal.status]?.color}`}>
                                        {statusMap[deal.status]?.label}
                                    </span>
                                    <p className="text-[10px] text-slate-600 font-english">
                                        {new Date(deal.createdAt).toLocaleDateString("ar-SY")}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
