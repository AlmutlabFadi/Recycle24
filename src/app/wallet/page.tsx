"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";

export default function WalletPage() {
    const { wallet, isLoading, error, refresh } = useWallet();
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark font-display">
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">lock</span>
                        <h2 className="text-xl font-bold text-white mb-2">يجب تسجيل الدخول</h2>
                        <p className="text-slate-400 mb-4">سجل الدخول لعرض محفظتك</p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                        >
                            تسجيل الدخول
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                    </div>
                </div>
                <BottomNavigation />
            </div>
        );
    }

    if (user?.status !== "APPROVED") {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark font-display">
                <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
                    <div className="flex items-center justify-between p-4">
                        <Link href="/" className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition">
                            <span className="material-symbols-outlined text-white">arrow_forward</span>
                        </Link>
                        <h1 className="text-base font-bold text-white">المحفظة الرقمية</h1>
                        <div className="size-10"></div>
                    </div>
                </header>
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">gpp_bad</span>
                        <h2 className="text-xl font-bold text-white mb-2">حساب غير موثق</h2>
                        <p className="text-slate-400 mb-4 text-sm leading-relaxed px-4">
                            عذراً، لا يمكنك استخدام المحفظة الرقمية وإجراء المعاملات المالية حتى يتم توثيق حسابك بشكل كامل.
                        </p>
                        <Link
                            href="/verification"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                        >
                            توثيق الحساب الآن
                            <span className="material-symbols-outlined">verified_user</span>
                        </Link>
                    </div>
                </div>
                <BottomNavigation />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark font-display">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <span className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin block mx-auto mb-4"></span>
                        <p className="text-slate-400">جاري تحميل المحفظة...</p>
                    </div>
                </div>
                <BottomNavigation />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark font-display">
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
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
                <BottomNavigation />
            </div>
        );
    }

    const recentTransactions = wallet?.transactions?.slice(0, 5) || [];

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
                <div className="flex items-center justify-between p-4">
                    <Link href="/" className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition">
                        <span className="material-symbols-outlined text-white">arrow_forward</span>
                    </Link>
                    <h1 className="text-base font-bold text-white">المحفظة الرقمية</h1>
                    <Link href="/wallet/transactions" className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition">
                        <span className="material-symbols-outlined text-white">history</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 pb-24">
                {/* Balance Card */}
                <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary to-blue-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>

                    <div className="relative z-10">
                        <p className="text-sm text-white/70 font-medium">الرصيد الإجمالي</p>
                        <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-4xl font-bold font-english dir-ltr tracking-tight">
                                {wallet?.balance?.toLocaleString() || "0"}
                            </p>
                            <span className="text-lg font-bold text-white/80">ل.س</span>
                        </div>
                        <p className="text-sm text-white/60 font-english dir-ltr mt-1">
                            ≈ ${((wallet?.balance || 0) / 14500).toFixed(0)} USD
                        </p>

                        {/* Quick Actions */}
                        <div className="flex gap-3 mt-6">
                            <Link
                                href="/wallet/deposit"
                                className="flex-1 h-10 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition active:scale-95"
                            >
                                <span className="material-symbols-outlined !text-[18px]">arrow_downward</span>
                                إيداع
                            </Link>
                            <Link
                                href="/wallet/withdraw"
                                className="flex-1 h-10 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition active:scale-95"
                            >
                                <span className="material-symbols-outlined !text-[18px]">arrow_upward</span>
                                سحب
                            </Link>
                            <button className="flex-1 h-10 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition active:scale-95">
                                <span className="material-symbols-outlined !text-[18px]">send</span>
                                تحويل
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="mt-6 px-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">المعاملات الأخيرة</h2>
                        <Link href="/wallet/transactions" className="text-sm font-bold text-primary">
                            عرض الكل
                        </Link>
                    </div>

                    <div className="flex flex-col gap-2">
                        {recentTransactions.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                                <p>لا توجد معاملات حتى الآن</p>
                            </div>
                        ) : (
                            recentTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-highlight border border-slate-700/50"
                                >
                                    <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                                        tx.type === "DEPOSIT" ? "text-green-400 bg-green-400/10" :
                                        tx.type === "WITHDRAWAL" ? "text-red-400 bg-red-400/10" :
                                        tx.type === "REFUND" ? "text-blue-400 bg-blue-400/10" :
                                        "text-orange-400 bg-orange-400/10"
                                    }`}>
                                        <span className="material-symbols-outlined !text-[20px]">
                                            {tx.type === "DEPOSIT" ? "arrow_downward" :
                                             tx.type === "WITHDRAWAL" ? "arrow_upward" :
                                             tx.type === "REFUND" ? "replay" : "payments"}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">
                                            {tx.type === "DEPOSIT" ? "إيداع" :
                                             tx.type === "WITHDRAWAL" ? "سحب" :
                                             tx.type === "REFUND" ? "استرداد" : "دفع"}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(tx.createdAt).toLocaleDateString("ar-SA")}
                                        </p>
                                    </div>
                                    <p className={`text-sm font-bold font-english dir-ltr ${
                                        tx.type === "DEPOSIT" || tx.type === "REFUND" ? "text-green-400" : "text-red-400"
                                    }`}>
                                        {tx.type === "DEPOSIT" || tx.type === "REFUND" ? "+" : "-"}
                                        {tx.amount.toLocaleString()} ل.س
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Payment Agent */}
                <div className="mx-4 mt-6 p-4 rounded-xl bg-surface-dark border border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="material-symbols-outlined text-secondary">store</span>
                        <div>
                            <p className="text-sm font-bold text-white">شبكة الوكلاء المعتمدين</p>
                            <p className="text-xs text-slate-400">إيداع وسحب نقدي عبر أقرب وكيل</p>
                        </div>
                    </div>
                    <button className="w-full h-10 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg text-sm font-bold hover:bg-secondary/20 transition active:scale-[0.98]">
                        البحث عن أقرب وكيل
                    </button>
                </div>
            </main>

            <BottomNavigation />
        </>
    );
}
