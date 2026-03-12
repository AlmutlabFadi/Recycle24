"use client";

import { useState, useEffect } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

interface CompanyWallet {
    id: string;
    totalRevenue: number;
    totalCommissions: number;
    totalDeposits: number;
    balanceSYP: number;
    balanceUSD: number;
}

interface UserWallet {
    id: string;
    balanceSYP: number;
    balanceUSD: number;
    user: { name: string; phone: string; email: string };
}

export default function AdminFinancePage() {
    const [companyWallet, setCompanyWallet] = useState<CompanyWallet | null>(null);
    const [totalSupportSYP, setTotalSupportSYP] = useState(0);
    const [totalEscrowSYP, setTotalEscrowSYP] = useState(0);
    const [riskAccountsCount, setRiskAccountsCount] = useState(0);
    const [userWallets, setUserWallets] = useState<UserWallet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFinance();
    }, []);

    async function fetchFinance() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/finance");
            const data = await res.json();
            if (data.success) {
                setCompanyWallet(data.companyWallet);
                setTotalSupportSYP(data.totalSupportSYP);
                setTotalEscrowSYP(data.totalEscrowSYP);
                setRiskAccountsCount(data.riskAccountsCount);
                setUserWallets(data.userWallets);
            }
        } catch (error) {
            console.error("Error fetching finance:", error);
        } finally {
            setLoading(false);
        }
    }

    function formatCurrency(val: number) {
        return new Intl.NumberFormat("ar-SY").format(val);
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="النظام البنكي والمالي" />

            <main className="flex-1 p-4 lg:max-w-7xl lg:mx-auto w-full pb-20">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-xl font-bold text-white mb-1">حوكمة المحافظ والحسابات</h1>
                        <p className="text-xs text-slate-400">الإشراف على التدفقات المالية وتأمينات المزادات وعمولات المنصة.</p>
                    </div>
                    {riskAccountsCount > 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-red-500">
                                {riskAccountsCount} حسابات تحت المخاطرة
                            </span>
                        </div>
                    )}
                </div>

                {/* Company Wallet (The Treasury) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-600/30 to-primary/30 border border-primary/40 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold text-white/60 mb-1">المحفظة العامة للشركة (الخزينة)</h3>
                            <p className="text-4xl font-bold text-white font-english mb-6">{companyWallet ? formatCurrency(companyWallet.balanceSYP) : '0'} <span className="text-sm">ل.س</span></p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-white/40 mb-1">إجمالي الإيرادات</p>
                                    <p className="text-sm font-bold text-emerald-400 font-english">{companyWallet ? formatCurrency(companyWallet.totalRevenue) : '0'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/40 mb-1">صافي العمولات</p>
                                    <p className="text-sm font-bold text-amber-400 font-english">{companyWallet ? formatCurrency(companyWallet.totalCommissions) : '0'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-dark.svg')] opacity-20 pointer-events-none"></div>
                    </div>

                    {/* New Analytics Cards */}
                    <div className="bg-surface-highlight border border-slate-800 rounded-[2.5rem] p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-blue-400 text-lg">verified</span>
                            <p className="text-xs text-slate-500">إجمالي الدعم الحكومي</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-400 font-english">{formatCurrency(totalSupportSYP)}</p>
                        <p className="text-[10px] text-slate-600 mt-2 font-bold">قيمة الإعفاءات المقدمة</p>
                    </div>

                    <div className="bg-surface-highlight border border-slate-800 rounded-[2.5rem] p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-amber-400 text-lg">lock</span>
                            <p className="text-xs text-slate-500">السيولة المحجوزة</p>
                        </div>
                        <p className="text-2xl font-bold text-amber-400 font-english">{formatCurrency(totalEscrowSYP)}</p>
                        <p className="text-[10px] text-slate-600 mt-2 font-bold">تأمينات معلقة (Escrow)</p>
                    </div>
                </div>

                {/* Global User Wallets Monitoring */}
                <div className="bg-surface-highlight rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-xl">
                    <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                            مراقبة محافظ المستخدمين
                        </h2>
                        <button onClick={fetchFinance} className="material-symbols-outlined text-slate-500 hover:text-white transition">refresh</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50">
                                    <th className="p-4 text-xs font-bold text-slate-500">المستخدم</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 font-english">رصيد (SYP)</th>
                                    <th className="p-4 text-xs font-bold text-slate-500">حالة الحساب</th>
                                    <th className="p-4 text-xs font-bold text-slate-500">تنبيهات الإدارة</th>
                                    <th className="p-4 text-xs font-bold text-slate-500">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mx-auto"></div></td></tr>
                                ) : userWallets.map((w: any) => (
                                    <tr key={w.id} className={`hover:bg-slate-800/30 transition group ${w.balanceSYP < 0 || w.user.isLocked ? "bg-red-500/5" : ""}`}>
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-white">{w.user.name}</p>
                                            <p className="text-[10px] text-slate-500 font-english">{w.user.phone}</p>
                                        </td>
                                        <td className={`p-4 text-sm font-bold font-english ${w.balanceSYP < 0 ? "text-red-400" : "text-white"}`}>
                                            {w.balanceSYP.toLocaleString()} ل.س
                                        </td>
                                        <td className="p-4">
                                            {w.user.isLocked ? (
                                                <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">مجمد</span>
                                            ) : (
                                                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">نشط</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {w.balanceSYP < 0 ? (
                                                <div className="flex items-center gap-1 text-red-400">
                                                    <span className="material-symbols-outlined text-sm">warning</span>
                                                    <span className="text-[10px] font-bold italic">رصيد سالب</span>
                                                </div>
                                            ) : "-"}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-4">
                                                <button title="خصم/إضافة" className="material-symbols-outlined text-slate-600 hover:text-primary transition">edit_note</button>
                                                <button title="حظر مالي" className={`material-symbols-outlined transition ${w.user.isLocked ? "text-red-500" : "text-slate-600 hover:text-red-500"}`}>
                                                    {w.user.isLocked ? "lock_open" : "block"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
