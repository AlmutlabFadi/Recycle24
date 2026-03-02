"use client";

import { useState, useEffect } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Auction {
    id: string;
    title: string;
    status: string;
    currentBid: number;
    weight: number;
    winnerId?: string;
    seller: { name: string; phone: string };
    participants: { userId: string; depositStatus: string; isExempt: boolean }[];
    createdAt: string;
}

interface Deal {
    id: string;
    materialType: string;
    totalAmount: number;
    platformFee: number;
    status: string;
    seller: { name: string; phone: string };
    buyer: { name: string; phone: string };
    createdAt: string;
}

export default function MarketplaceMonitorPage() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"AUCTIONS" | "DEALS">("AUCTIONS");
    const [filter, setFilter] = useState<"ALL" | "PENDING_CLEARANCE">("ALL");

    useEffect(() => {
        fetchMarketplace();
    }, []);

    async function fetchMarketplace() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/marketplace");
            const data = await res.json();
            if (data.success) {
                setAuctions(data.marketplace.auctions);
                setDeals(data.marketplace.deals);
            }
        } catch (error) {
            console.error("Error fetching marketplace:", error);
        } finally {
            setLoading(false);
        }
    }

    const filteredAuctions = filter === "PENDING_CLEARANCE" 
        ? auctions.filter(a => a.status === "ENDED" && a.participants.some(p => p.depositStatus === "HELD"))
        : auctions;

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="مراقب الأسواق والمعاملات" />

            <main className="flex-1 p-4 lg:max-w-7xl lg:mx-auto w-full pb-20">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white mb-1">رقابة التداول الفوري</h1>
                        <p className="text-xs text-slate-500">رصد وتحليل كافة المزادات والصفقات الجارية في المنصة.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {activeTab === "AUCTIONS" && (
                            <select 
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as any)}
                                className="bg-surface-highlight border border-slate-800 text-slate-300 text-[10px] font-bold px-3 py-2 rounded-xl outline-none focus:border-primary transition"
                            >
                                <option value="ALL">جميع المزادات</option>
                                <option value="PENDING_CLEARANCE">مزادات بانتظار براءة الذمة</option>
                            </select>
                        )}
                        <div className="flex bg-surface-highlight border border-slate-800 p-1 rounded-2xl">
                            <button 
                                onClick={() => setActiveTab("AUCTIONS")}
                                className={`px-6 py-2 rounded-xl text-xs font-bold transition ${activeTab === "AUCTIONS" ? 'bg-primary text-white' : 'text-slate-500'}`}
                            >
                                المزادات ({auctions.length})
                            </button>
                            <button 
                                onClick={() => setActiveTab("DEALS")}
                                className={`px-6 py-2 rounded-xl text-xs font-bold transition ${activeTab === "DEALS" ? 'bg-primary text-white' : 'text-slate-500'}`}
                            >
                                الصفقات ({deals.length})
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-highlight rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-900/50">
                                    <th className="p-4 text-xs font-bold text-slate-400">التاريخ</th>
                                    <th className="p-4 text-xs font-bold text-slate-400">{activeTab === "AUCTIONS" ? 'المزاد' : 'المادة'}</th>
                                    <th className="p-4 text-xs font-bold text-slate-400">الأطراف</th>
                                    <th className="p-4 text-xs font-bold text-slate-400">القيمة</th>
                                    <th className="p-4 text-xs font-bold text-slate-400">الحالة</th>
                                    <th className="p-4 text-xs font-bold text-slate-400">براءة الذمة</th>
                                    <th className="p-4 text-xs font-bold text-slate-400">رقابة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={7} className="p-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mx-auto"></div></td></tr>
                                ) : activeTab === "AUCTIONS" ? (
                                    filteredAuctions.map((a) => {
                                        const winnerParticipant = a.participants.find(p => p.depositStatus === "HELD" || p.depositStatus === "REFUNDED" || p.depositStatus === "APPLIED_TO_DEAL");
                                        const isCleared = winnerParticipant?.depositStatus !== "HELD" && a.status === "ENDED";
                                        const needsClearance = a.status === "ENDED" && winnerParticipant?.depositStatus === "HELD";

                                        return (
                                            <tr key={a.id} className="hover:bg-slate-800/30 transition group">
                                                <td className="p-4 text-xs text-slate-500 font-english">{new Date(a.createdAt).toLocaleDateString("ar-SY")}</td>
                                                <td className="p-4 text-sm font-bold text-white">{a.title}</td>
                                                <td className="p-4">
                                                    <p className="text-xs text-slate-300">{a.seller.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-english">{a.seller.phone}</p>
                                                </td>
                                                <td className="p-4 text-sm font-bold text-emerald-500 font-english">{a.currentBid.toLocaleString()} ل.س</td>
                                                <td className="p-4">
                                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${a.status === 'LIVE' ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-400'}`}>
                                                        {a.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {a.status !== "ENDED" ? (
                                                        <span className="text-[10px] text-slate-600">--</span>
                                                    ) : isCleared ? (
                                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">منفذة</span>
                                                    ) : needsClearance ? (
                                                        <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold animate-pulse">معلقة</span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-500">منتهية</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <button className="material-symbols-outlined text-slate-600 hover:text-red-500 transition">cancel</button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    deals.map((d) => (
                                        <tr key={d.id} className="hover:bg-slate-800/30 transition group">
                                            <td className="p-4 text-xs text-slate-500 font-english">{new Date(d.createdAt).toLocaleDateString("ar-SY")}</td>
                                            <td className="p-4 text-sm font-bold text-white">{d.materialType}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[10px] text-slate-500">البائع: <span className="text-white">{d.seller.name}</span></p>
                                                    <p className="text-[10px] text-slate-500">المشتري: <span className="text-white">{d.buyer.name}</span></p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-bold text-emerald-500 font-english">{d.totalAmount.toLocaleString()} ل.س</p>
                                                <p className="text-[10px] text-primary font-bold font-english">العمولة: {d.platformFee.toLocaleString()}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${d.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                                                    {d.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-primary font-bold cursor-pointer hover:underline">تدقيق</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
