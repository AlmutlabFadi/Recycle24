"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface StolenReport {
    id: string;
    reportingOrg: string;
    type: string;
    customItemType?: string;
    description: string;
    location: string;
    contactPhone: string;
    status: string;
    stolenDate: string;
    images?: string[];
    warning?: string;
    createdAt: string;
}

export default function StolenReportsPage() {
    const { activeRole } = useAuth();
    const isTrader = activeRole === "TRADER";
    const [activeTab, setActiveTab] = useState<"list" | "search">("list");
    const [stolenItems, setStolenItems] = useState<StolenReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchReports() {
            try {
                const res = await fetch("/api/stolen-reports");
                const data = await res.json();
                if (data.success) {
                    setStolenItems(data.reports);
                }
            } catch (error) {
                console.error("Failed to fetch reports:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchReports();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="الإبلاغ عن المفقودات" />

            <main className="flex-1 pb-24">
                {/* Tabs */}
                <div className="sticky top-0 z-10 bg-bg-dark border-b border-slate-800">
                    <div className="flex p-2 gap-2">
                        <button
                            onClick={() => setActiveTab("list")}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${activeTab === "list"
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-surface-highlight text-slate-400"
                                }`}
                        >
                            البلاغات النشطة
                        </button>
                        <button
                            onClick={() => setActiveTab("search")}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${activeTab === "search"
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-surface-highlight text-slate-400"
                                }`}
                        >
                            البحث
                        </button>
                    </div>
                </div>

                {/* List Tab */}
                {activeTab === "list" && (
                    <div className="p-4">
                        {/* Alert Banner */}
                        <div className="bg-red-500/10 rounded-xl p-4 mb-4 border border-red-500/30">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-red-400 !text-[24px]">warning</span>
                                <div>
                                    <h3 className="font-bold text-white text-sm mb-1">تحذير هام</h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        إذا عثرت على معدات مسروقة، يرجى الإبلاغ فوراً وعدم محاولة شرائها. التعاون مع الجهات الرسمية واجب وطني.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stolen Items List */}
                        <div className="space-y-3">
                            {stolenItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50"
                                >
                                    {/* Organization Header */}
                                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800">
                                        <span className="material-symbols-outlined text-blue-400 !text-[20px]">
                                            business
                                        </span>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-blue-400 text-sm">{item.reportingOrg}</h3>
                                            <p className="text-xs text-slate-500">الجهة المبلغة</p>
                                        </div>
                                        <span
                                            className={`text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap ${item.status === "نشط"
                                                    ? "text-red-500 bg-red-500/10"
                                                    : "text-green-500 bg-green-500/10"
                                                }`}
                                        >
                                            {item.status}
                                        </span>
                                    </div>

                                    <div className="flex gap-3 mb-3">
                                        <div className="shrink-0">
                                            <img
                                                src={item.images?.[0] || "https://placehold.co/100x100/1e293b/ffffff?text=لا+توجد+صورة"}
                                                alt={item.type}
                                                className="w-20 h-20 rounded-lg object-cover bg-slate-800"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="mb-2">
                                                <p className="text-xs text-slate-500">#{item.id}</p>
                                                <h4 className="font-bold text-white text-base">{item.type}</h4>
                                                <p className="text-xs text-slate-400">{item.description}</p>
                                            </div>
                                            <div className="space-y-1 text-xs text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined !text-[14px]">
                                                        location_on
                                                    </span>
                                                    <span>{item.location}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined !text-[14px]">
                                                        calendar_today
                                                    </span>
                                                    <span>تاريخ السرقة: {item.stolenDate}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Warning Box */}
                                    <div className="bg-orange-500/10 rounded-lg p-3 mb-3 border border-orange-500/30">
                                        <div className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-orange-400 !text-[18px]">
                                                report
                                            </span>
                                            <p className="text-xs text-orange-200 leading-relaxed flex-1">
                                                {item.warning}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Contact Phone */}
                                    <div className="flex items-center justify-between gap-3">
                                        <a
                                            href={`tel:${item.contactPhone}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600/20 text-green-400 rounded-lg text-sm font-bold border border-green-500/30 hover:bg-green-600/30 transition"
                                        >
                                            <span className="material-symbols-outlined !text-[20px]">call</span>
                                            <span className="font-english">{item.contactPhone}</span>
                                        </a>
                                        <button className="flex-1 py-2.5 bg-red-600/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/30 hover:bg-red-600/30 transition">
                                            وجدتها! إبلاغ فوري
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Tab */}
                {activeTab === "search" && (
                    <div className="p-4">
                        <div className="space-y-4">
                            {/* Search Fields */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 mb-2 block">نوع المادة</label>
                                    <input
                                        type="text"
                                        placeholder="مثال: كابل كهرباء، راقارات، إلخ"
                                        className="w-full bg-surface-highlight border-none rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 mb-2 block">
                                        المنطقة
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="مثال: دمشق، حلب، حمص"
                                        className="w-full bg-surface-highlight border-none rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 mb-2 block">
                                        الجهة المبلغة
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="مثال: مديرية الكهرباء، بلدية، إلخ"
                                        className="w-full bg-surface-highlight border-none rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <button className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20">
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined">search</span>
                                        بحث
                                    </span>
                                </button>
                            </div>

                            {/* Info Card */}
                            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                                <h3 className="font-bold text-white text-sm mb-2">كيفية الاستخدام</h3>
                                <ul className="space-y-2 text-xs text-slate-300">
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-blue-400 !text-[16px]">
                                            check
                                        </span>
                                        <span>ابحث بنوع المادة المسروقة (كابلات، راقارات، معدات)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-blue-400 !text-[16px]">
                                            check
                                        </span>
                                        <span>فلتر حسب المنطقة الجغرافية</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-blue-400 !text-[16px]">
                                            check
                                        </span>
                                        <span>تحقق من الجهة المبلغة (مديريات، بلديات، شركات)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-blue-400 !text-[16px]">
                                            check
                                        </span>
                                        <span>اتصل فوراً على الرقم المذكور في حال التعرف على المسروقات</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Legal Warning */}
                            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                                <h3 className="font-bold text-red-400 text-sm mb-2">تنويه قانوني</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    شراء أو حيازة مواد مسروقة جريمة يعاقب عليها القانون. يُلزم جميع التجار بالتحقق من مصدر المواد قبل الشراء والإبلاغ الفوري عن أي مواد مشبوهة.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* FAB */}
                {isTrader && (
                    <Link
                        href="/stolen-reports/new"
                        className="fixed bottom-20 left-4 size-14 bg-red-600 text-white rounded-full shadow-2xl shadow-red-600/40 flex items-center justify-center hover:bg-red-700 transition z-20"
                    >
                        <span className="material-symbols-outlined !text-[28px]">add</span>
                    </Link>
                )}
            </main>
        </div>
    );
}
