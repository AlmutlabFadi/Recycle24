"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Contract {
    id: string;
    title: string;
    buyerName: string;
    sellerName: string;
    material: string;
    amount: number;
    status: "pending" | "signed" | "completed" | "cancelled";
    createdAt: string;
    signedAt?: string;
}

export default function ContractsPage() {
    const [filter, setFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const contracts: Contract[] = [
        {
            id: "CTR-001",
            title: "عقد توريد حديد HMS",
            buyerName: "مصنع الأمل للصناعات",
            sellerName: "محمد أحمد",
            material: "حديد HMS",
            amount: 15000000,
            status: "signed",
            createdAt: "2025-02-20",
            signedAt: "2025-02-21",
        },
        {
            id: "CTR-002",
            title: "عقد توريد نحاس",
            buyerName: "شركة المعادن المتقدمة",
            sellerName: "خالد محمود",
            material: "نحاس درجة أولى",
            amount: 8500000,
            status: "pending",
            createdAt: "2025-02-22",
        },
        {
            id: "CTR-003",
            title: "عقد توريد ألمنيوم",
            buyerName: "مصنع العليان",
            sellerName: "فادي حسن",
            material: "ألمنيوم نظيف",
            amount: 12000000,
            status: "completed",
            createdAt: "2025-02-15",
            signedAt: "2025-02-16",
        },
    ];

    const filteredContracts = contracts.filter((contract) => {
        if (filter !== "all" && contract.status !== filter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                contract.title.toLowerCase().includes(query) ||
                contract.buyerName.toLowerCase().includes(query) ||
                contract.id.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const getStatusBadge = (status: Contract["status"]) => {
        const styles = {
            pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            signed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            completed: "bg-green-500/20 text-green-400 border-green-500/30",
            cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
        };
        const labels = {
            pending: "بانتظار التوقيع",
            signed: "موقع",
            completed: "مكتمل",
            cancelled: "ملغي",
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="العقود" />

            <div className="flex-1 p-4 flex flex-col gap-4 pb-24">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="بحث في العقود..."
                            className="w-full h-12 rounded-xl bg-surface-dark border border-slate-700 text-white px-4 pr-10 focus:border-primary focus:ring-primary"
                        />
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                            search
                        </span>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                    {["all", "pending", "signed", "completed"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                filter === status
                                    ? "bg-primary text-white"
                                    : "bg-surface-dark text-slate-400 border border-slate-700"
                            }`}
                        >
                            {status === "all" && "الكل"}
                            {status === "pending" && "بانتظار التوقيع"}
                            {status === "signed" && "موقع"}
                            {status === "completed" && "مكتمل"}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    {filteredContracts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <span className="material-symbols-outlined text-5xl mb-3">description</span>
                            <p className="text-sm">لا توجد عقود</p>
                        </div>
                    ) : (
                        filteredContracts.map((contract) => (
                            <Link
                                key={contract.id}
                                href={`/deals/${contract.id}/contract`}
                                className="group relative overflow-hidden rounded-xl bg-surface-dark ring-1 ring-slate-700 p-4 hover:ring-primary transition-all"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-white font-bold">{contract.title}</h3>
                                        <p className="text-slate-400 text-xs mt-1">{contract.id}</p>
                                    </div>
                                    {getStatusBadge(contract.status)}
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-slate-500 text-xs">المشتري</span>
                                        <p className="text-slate-200">{contract.buyerName}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 text-xs">البائع</span>
                                        <p className="text-slate-200">{contract.sellerName}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">
                                            inventory_2
                                        </span>
                                        <span className="text-slate-300 text-sm">{contract.material}</span>
                                    </div>
                                    <div className="text-left">
                                        <span className="text-lg font-bold text-white">
                                            {contract.amount.toLocaleString()}
                                        </span>
                                        <span className="text-slate-400 text-xs mr-1">ل.س</span>
                                    </div>
                                </div>

                                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            </Link>
                        ))
                    )}
                </div>

                <div className="rounded-xl bg-gradient-to-br from-blue-900/20 to-slate-900 p-4 border border-blue-800/30">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-400 text-2xl">info</span>
                        <div>
                            <h4 className="text-white font-bold text-sm mb-1">العقود الرقمية</h4>
                            <p className="text-slate-400 text-xs">
                                جميع العقود موقعة رقمياً ومحفوظة بشكل آمن. يمكنك مراجعة تفاصيل أي عقد بالنقر عليه.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
