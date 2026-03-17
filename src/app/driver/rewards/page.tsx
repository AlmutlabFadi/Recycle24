"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

type Reward = {
    id: string;
    type: string;
    status: string;
    amount: number;
    reason: string;
    createdAt: string;
};

const typeMap: Record<string, string> = {
    BONUS: "مكافأة",
    PENALTY: "جزاء",
    ADJUSTMENT: "تعديل",
};

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "قيد المراجعة", color: "text-amber-400", bg: "bg-amber-500/10" },
    APPROVED: { label: "معتمد", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    PAID: { label: "مدفوع", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    REJECTED: { label: "مرفوض", color: "text-red-400", bg: "bg-red-500/10" },
};

export default function DriverRewardsPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRewards = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/driver/rewards", { cache: "no-store" });
            const data = await response.json();
            if (response.ok) setRewards(data.rewards || []);
        } catch (error) {
            console.error("Rewards fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRewards();
    }, [fetchRewards]);

    const balance = useMemo(
        () => rewards.filter((r) => r.status === "APPROVED" || r.status === "PAID").reduce((acc, r) => acc + r.amount, 0),
        [rewards]
    );

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="المكافآت" />

            <main className="flex-1 p-4 pb-24 space-y-5">
                <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/20 rounded-3xl p-5">
                    <p className="text-xs text-emerald-300">رصيد المكافآت المتاحة</p>
                    <p className="text-2xl font-bold text-white mt-2">{balance.toLocaleString("ar-SY")} ل.س</p>
                </div>

                {loading ? (
                    <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">
                        جاري تحميل المكافآت...
                    </div>
                ) : rewards.length === 0 ? (
                    <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">
                        لا توجد مكافآت حالياً
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rewards.map((reward) => {
                            const statusMeta = statusMap[reward.status] || statusMap.PENDING;
                            return (
                                <div key={reward.id} className="bg-surface-dark rounded-2xl p-4 border border-slate-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-white font-bold">{typeMap[reward.type] || reward.type}</p>
                                        <span className={`text-[10px] px-2 py-1 rounded-full ${statusMeta.bg} ${statusMeta.color} font-bold`}>
                                            {statusMeta.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">{reward.reason}</p>
                                    <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
                                        <span>القيمة</span>
                                        <span className="text-white font-bold">{reward.amount.toLocaleString("ar-SY")} ل.س</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
