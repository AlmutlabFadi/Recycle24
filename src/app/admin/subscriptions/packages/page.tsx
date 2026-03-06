"use client";

import { useState, useEffect } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Package {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    benefits: string[];
    isActive: boolean;
}

export default function SubscriptionDesignerPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPkg, setEditingPkg] = useState<Partial<Package> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPackages();
    }, []);

    async function fetchPackages() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/subscriptions/packages");
            const data = await res.json();
            if (data.success) {
                setPackages(data.packages);
            }
        } catch (error) {
            console.error("Error fetching packages:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!editingPkg?.name || editingPkg.price === undefined || isSaving) return;
        setIsSaving(true);
        try {
            const method = editingPkg.id ? "PATCH" : "POST";
            const res = await fetch("/api/admin/subscriptions/packages", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingPkg),
            });
            const data = await res.json();
            if (data.success) {
                setEditingPkg(null);
                fetchPackages();
            }
        } catch (error) {
            console.error("Error saving package:", error);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="مصمم باقات الاشتراك" />

            <main className="flex-1 p-4 lg:max-w-6xl lg:mx-auto w-full pb-20">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-xl font-bold text-white mb-1">إدارة الباقات التجارية</h1>
                        <p className="text-xs text-slate-500">قم بتعريف وتسعير باقات الاشتراك المتاحة للمستخدمين.</p>
                    </div>
                    <button 
                        onClick={() => setEditingPkg({ name: "", price: 0, durationDays: 30, benefits: [], isActive: true })}
                        className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition"
                    >
                        <span className="material-symbols-outlined !text-sm">add</span>
                        باقة جديدة
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mx-auto"></div>
                        </div>
                    ) : packages.map((pkg) => (
                        <div 
                            key={pkg.id} 
                            className={`bg-surface-highlight border-2 rounded-[2.5rem] p-8 flex flex-col transition shadow-xl ${pkg.isActive ? 'border-slate-800' : 'border-red-500/30 opacity-60 grayscale'}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">{pkg.name}</h3>
                                    <p className="text-2xl font-bold text-primary font-english">{pkg.price.toLocaleString()} <span className="text-xs text-slate-500 font-display">ل.س</span></p>
                                </div>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${pkg.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {pkg.isActive ? 'نشطة' : 'متوقفة'}
                                </span>
                            </div>
                            
                            <ul className="flex-1 space-y-3 mb-8">
                                {pkg.benefits.map((b, i) => (
                                    <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="material-symbols-outlined text-emerald-500 !text-sm">check_circle</span>
                                        {b}
                                    </li>
                                ))}
                            </ul>

                            <button 
                                onClick={() => setEditingPkg(pkg)}
                                className="w-full bg-slate-800 text-white font-bold py-3 rounded-2xl hover:bg-slate-700 transition"
                            >
                                تعديل الباقة
                            </button>
                        </div>
                    ))}
                </div>
            </main>

            {/* Editor Modal */}
            {editingPkg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-bg-dark border border-slate-800 rounded-[2.5rem] w-full max-w-xl p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-bold text-white mb-8">{editingPkg.id ? 'تعديل الباقة' : 'إنشاء باقة جديدة'}</h2>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">اسم الباقة (مثل: GOLD)</label>
                                    <input
                                        title="اسم الباقة"
                                        type="text"
                                        value={editingPkg.name}
                                        onChange={(e) => setEditingPkg({...editingPkg, name: e.target.value.toUpperCase()})}
                                        className="w-full bg-surface-highlight border border-slate-700 rounded-2xl py-3 px-4 text-white outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">السعر (ل.س)</label>
                                    <input
                                        title="السعر"
                                        type="number"
                                        value={editingPkg.price}
                                        onChange={(e) => setEditingPkg({...editingPkg, price: parseFloat(e.target.value) || 0})}
                                        className="w-full bg-surface-highlight border border-slate-700 rounded-2xl py-3 px-4 text-white font-english outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">المدة (بالأيام)</label>
                                <input
                                    title="المدة"
                                    type="number"
                                    value={editingPkg.durationDays}
                                    onChange={(e) => setEditingPkg({...editingPkg, durationDays: parseInt(e.target.value) || 30})}
                                    className="w-full bg-surface-highlight border border-slate-700 rounded-2xl py-3 px-4 text-white font-english outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">المميزات (ميزة في كل سطر)</label>
                                <textarea
                                    title="المميزات"
                                    rows={5}
                                    value={editingPkg.benefits?.join("\n")}
                                    onChange={(e) => setEditingPkg({...editingPkg, benefits: e.target.value.split("\n")})}
                                    className="w-full bg-surface-highlight border border-slate-700 rounded-2xl py-3 px-4 text-white text-sm outline-none focus:border-primary resize-none"
                                    placeholder="ميزة 1&#10;ميزة 2..."
                                />
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <button 
                                    onClick={() => setEditingPkg({...editingPkg, isActive: !editingPkg.isActive})}
                                    className={`size-6 rounded-lg flex items-center justify-center border-2 transition ${editingPkg.isActive ? 'bg-primary border-primary text-white' : 'border-slate-700'}`}
                                >
                                    {editingPkg.isActive && <span className="material-symbols-outlined !text-sm">check</span>}
                                </button>
                                <span className="text-sm text-slate-300">تفعيل الباقة للمستخدمين الجدد</span>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 bg-primary text-white font-bold py-4 rounded-2xl hover:scale-105 transition disabled:opacity-50 shadow-lg shadow-primary/20"
                            >
                                {isSaving ? 'جاري الحفظ...' : 'تأكيد الحفظ'}
                            </button>
                            <button 
                                onClick={() => setEditingPkg(null)}
                                className="flex-1 bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-700 transition"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
