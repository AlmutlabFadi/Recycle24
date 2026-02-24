"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    description: string | null;
    createdAt: string;
}

const filters = ["all", "deposit", "withdrawal", "payment", "refund"];

const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
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

export default function WalletTransactionsPage() {
    const { user, isAuthenticated } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [balance, setBalance] = useState(0);
    const [selectedFilter, setSelectedFilter] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                const [walletRes, txRes] = await Promise.all([
                    fetch(`/api/wallet?userId=${user.id}`),
                    fetch(`/api/wallet/transactions?userId=${user.id}&type=${selectedFilter}`),
                ]);

                const walletData = await walletRes.json();
                const txData = await txRes.json();

                if (walletData.success) {
                    setBalance(walletData.wallet.balance);
                }

                if (txData.success) {
                    setTransactions(txData.transactions);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [user?.id, selectedFilter]);

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark font-display">
                <HeaderWithBack title="سجل المعاملات" />
                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                        <span className="material-symbols-outlined !text-6xl text-slate-600 mb-4">lock</span>
                        <p className="text-slate-400 mb-4">يرجى تسجيل الدخول للوصول إلى سجل المعاملات</p>
                        <Link href="/login" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold">
                            تسجيل الدخول
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="سجل المعاملات" />

            <div className="bg-gradient-to-br from-primary to-primary-dark p-6 mx-4 mt-4 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-white/80">الرصيد الحالي</span>
                    <Link href="/wallet" className="text-white/80 hover:text-white">
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                    {balance.toLocaleString("ar-SY")} <span className="text-lg">ل.س</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/70">
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[16px]">wallet</span>
                        محفظة رئيسية
                    </span>
                </div>
            </div>

            <div className="px-4 py-4">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => {
                                setSelectedFilter(filter);
                                setIsLoading(true);
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                selectedFilter === filter
                                    ? "bg-primary text-white"
                                    : "bg-surface-highlight text-slate-300 border border-slate-700"
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
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="bg-surface-highlight rounded-xl p-4 border border-slate-700"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center ${typeLabels[transaction.type]?.color || "text-slate-400"}`}>
                                            <span className="material-symbols-outlined">
                                                {typeLabels[transaction.type]?.icon || "payments"}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">
                                                {typeLabels[transaction.type]?.label || transaction.type}
                                            </h3>
                                            <p className="text-sm text-slate-400">
                                                {transaction.description || "-"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold text-lg ${
                                            transaction.type === "DEPOSIT" || transaction.type === "REFUND"
                                                ? "text-green-400"
                                                : "text-red-400"
                                        }`}>
                                            {transaction.type === "DEPOSIT" || transaction.type === "REFUND" ? "+" : "-"}
                                            {transaction.amount.toLocaleString("ar-SY")} ل.س
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {formatDate(transaction.createdAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">رقم العملية:</span>
                                        <span className="text-xs text-slate-400 font-mono">
                                            {transaction.id.slice(0, 12)}...
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">{formatTime(transaction.createdAt)}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            transaction.status === "COMPLETED"
                                                ? "bg-green-500/20 text-green-400"
                                                : transaction.status === "PENDING"
                                                ? "bg-yellow-500/20 text-yellow-400"
                                                : "bg-red-500/20 text-red-400"
                                        }`}>
                                            {transaction.status === "COMPLETED" ? "مكتمل" : transaction.status === "PENDING" ? "قيد المعالجة" : "فشل"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && transactions.length === 0 && (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">
                            receipt_long
                        </span>
                        <p className="text-slate-400">لا توجد معاملات</p>
                    </div>
                )}
            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-surface-dark border-t border-slate-800 p-4 pb-safe">
                <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
                    <Link
                        href="/wallet/deposit"
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-all"
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        إيداع
                    </Link>
                    <Link
                        href="/wallet/withdraw"
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-surface-highlight text-white border border-slate-700 hover:border-primary transition-all"
                    >
                        <span className="material-symbols-outlined">remove_circle</span>
                        سحب
                    </Link>
                </div>
            </div>
        </div>
    );
}
