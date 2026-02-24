"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

interface PriceAlert {
    id: string;
    material: string;
    materialIcon: string;
    targetPrice: number;
    currentPrice: number;
    condition: "above" | "below";
    isActive: boolean;
    createdAt: string;
}

export default function PriceAlertsPage() {
    const [alerts, setAlerts] = useState<PriceAlert[]>([
        {
            id: "1",
            material: "حديد HMS",
            materialIcon: "hardware",
            targetPrice: 16000,
            currentPrice: 15200,
            condition: "above",
            isActive: true,
            createdAt: "منذ يومين",
        },
        {
            id: "2",
            material: "نحاس",
            materialIcon: "bolt",
            targetPrice: 5000,
            currentPrice: 5200,
            condition: "below",
            isActive: true,
            createdAt: "منذ أسبوع",
        },
        {
            id: "3",
            material: "ألمنيوم",
            materialIcon: "kitchen",
            targetPrice: 13000,
            currentPrice: 12500,
            condition: "above",
            isActive: false,
            createdAt: "منذ شهر",
        },
    ]);

    const [showCreateModal, setShowCreateModal] = useState(false);

    const toggleAlert = (id: string) => {
        setAlerts(prev =>
            prev.map(alert =>
                alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
            )
        );
    };

    const deleteAlert = (id: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString("ar-SA");
    };

    const getPriceStatus = (alert: PriceAlert) => {
        const diff = alert.targetPrice - alert.currentPrice;
        const percentage = ((diff / alert.currentPrice) * 100).toFixed(1);
        if (alert.condition === "above") {
            return diff > 0 ? `يحتاج +${percentage}%` : "تم الوصول!";
        } else {
            return diff < 0 ? `يحتاج ${percentage}%` : "تم الوصول!";
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="تنبيهات الأسعار" />

            <main className="flex-1 p-4 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/20 rounded-xl p-4 border border-primary/30">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-primary">notifications_active</span>
                            <span className="text-sm text-slate-300">التنبيهات النشطة</span>
                        </div>
                        <span className="text-3xl font-bold text-white">
                            {alerts.filter(a => a.isActive).length}
                        </span>
                    </div>
                    <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-slate-400">trending_up</span>
                            <span className="text-sm text-slate-300">المواد المتابعة</span>
                        </div>
                        <span className="text-3xl font-bold text-white">{alerts.length}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">تنبيهاتك</h3>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1 text-primary text-sm font-medium"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        تنبيه جديد
                    </button>
                </div>

                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">notifications_off</span>
                        <p className="text-slate-400 text-center">لا توجد تنبيهات نشطة</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium"
                        >
                            إنشاء تنبيه
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`bg-surface-dark rounded-xl p-4 border transition-all ${
                                    alert.isActive ? "border-slate-800" : "border-slate-700 opacity-60"
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                            alert.isActive ? "bg-primary/20" : "bg-slate-700"
                                        }`}>
                                            <span className={`material-symbols-outlined text-2xl ${
                                                alert.isActive ? "text-primary" : "text-slate-400"
                                            }`}>
                                                {alert.materialIcon}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-white">{alert.material}</h4>
                                            <span className="text-xs text-slate-400">{alert.createdAt}</span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={alert.isActive}
                                            onChange={() => toggleAlert(alert.id)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:-translate-x-full"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-3 border-t border-slate-700">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400">السعر الحالي</span>
                                        <span className="text-lg font-bold text-white">{formatPrice(alert.currentPrice)} ل.س</span>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800">
                                        <span className="material-symbols-outlined text-sm text-slate-400">
                                            {alert.condition === "above" ? "trending_up" : "trending_down"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-slate-400">السعر المستهدف</span>
                                        <span className="text-lg font-bold text-primary">{formatPrice(alert.targetPrice)} ل.س</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                                    <span className="text-xs text-slate-400">{getPriceStatus(alert)}</span>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/price-alerts/${alert.id}/edit`}
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                                        >
                                            تعديل
                                        </Link>
                                        <button
                                            onClick={() => deleteAlert(alert.id)}
                                            className="px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 text-xs font-medium hover:bg-red-900/50"
                                        >
                                            حذف
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-yellow-500">lightbulb</span>
                        <div>
                            <span className="text-sm font-medium text-white">نصيحة</span>
                            <p className="text-xs text-slate-400 mt-1">
                                قم بتعيين تنبيهات للأسعار التي تهمك لتتلقي إشعارات فورية عند تغير الأسعار
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface-dark rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold text-white mb-4">إنشاء تنبيه جديد</h3>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-sm text-slate-300 mb-1 block">المادة</label>
                                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white">
                                    <option>حديد HMS</option>
                                    <option>نحاس</option>
                                    <option>ألمنيوم</option>
                                    <option>بلاستيك PET</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-slate-300 mb-1 block">السعر المستهدف (ل.س)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-300 mb-1 block">الشرط</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="py-2 rounded-lg bg-primary/20 text-primary text-sm font-medium border border-primary">
                                        ↑ أعلى من
                                    </button>
                                    <button className="py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium border border-slate-700">
                                        ↓ أقل من
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-medium"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium"
                            >
                                إنشاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
