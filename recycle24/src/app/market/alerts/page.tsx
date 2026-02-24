"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useState } from "react";

export default function PriceAlertsPage() {
    const [alerts, setAlerts] = useState([
        { id: 1, metal: "الحديد", target: "46,000", condition: "above", active: true },
        { id: 2, metal: "النحاس", target: "8,500", condition: "below", active: false },
        { id: 3, metal: "الذهب", target: "2,050", condition: "above", active: true },
    ]);

    const toggleAlert = (id: number) => {
        setAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a));
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="تنبيهات الأسعار" />

            <main className="flex-1 p-4 pb-24">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-white">تنبيهاتي النشطة</h2>
                    <span className="text-xs text-slate-400 bg-surface-highlight px-2 py-1 rounded-full">{alerts.filter(a => a.active).length} مفعّل</span>
                </div>

                <div className="flex flex-col gap-3">
                    {alerts.map((alert) => (
                        <div key={alert.id} className="bg-surface-highlight border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`size-10 rounded-lg flex items-center justify-center ${alert.active ? "bg-primary/20 text-primary" : "bg-slate-700/50 text-slate-500"}`}>
                                    <span className="material-symbols-outlined">notifications</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className={`font-bold text-sm ${alert.active ? "text-white" : "text-slate-400"}`}>{alert.metal}</h3>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${alert.condition === "above" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                            {alert.condition === "above" ? "أعلى من" : "أقل من"}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold font-english text-slate-300 mt-0.5 dir-ltr text-left">
                                        {alert.condition === "above" ? ">" : "<"} {alert.target}
                                    </p>
                                </div>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={alert.active} onChange={() => toggleAlert(alert.id)} />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    ))}
                </div>

                <div className="mt-6 p-4 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-center gap-2 hover:bg-surface-highlight/30 transition cursor-pointer group">
                    <div className="size-12 rounded-full bg-slate-800 group-hover:bg-primary/20 flex items-center justify-center transition">
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition">add_alert</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-300 text-sm">إضافة تنبيه جديد</h3>
                        <p className="text-xs text-slate-500">سيصلك إشعار فوري عند تحقيق الهدف</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
