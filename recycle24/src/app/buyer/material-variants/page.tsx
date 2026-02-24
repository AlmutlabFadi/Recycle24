"use client";

import { useState } from "react";
import Link from "next/link";

interface MaterialVariant {
    id: string;
    name: string;
    category: string;
    priceSYP: string;
    priceUSD: string;
    image?: string;
    enabled: boolean;
}

export default function MaterialVariantsPage() {
    const [variants, setVariants] = useState<MaterialVariant[]>([
        { id: "1", name: "حديد HMS 1", category: "حديد", priceSYP: "3200", priceUSD: "1.2", enabled: true },
        { id: "2", name: "حديد HMS 2", category: "حديد", priceSYP: "2800", priceUSD: "1.05", enabled: true },
        { id: "3", name: "نحاس أحمر نقي", category: "نحاس", priceSYP: "28500", priceUSD: "10.7", enabled: true },
        { id: "4", name: "نحاس أصفر", category: "نحاس", priceSYP: "18000", priceUSD: "6.75", enabled: true },
    ]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newVariant, setNewVariant] = useState({
        name: "",
        category: "",
        priceSYP: "",
        priceUSD: "",
    });

    const handleAddVariant = () => {
        if (!newVariant.name || !newVariant.category) return;

        const variant: MaterialVariant = {
            id: Date.now().toString(),
            name: newVariant.name,
            category: newVariant.category,
            priceSYP: newVariant.priceSYP,
            priceUSD: newVariant.priceUSD,
            enabled: true,
        };

        setVariants([...variants, variant]);
        setNewVariant({ name: "", category: "", priceSYP: "", priceUSD: "" });
        setShowAddModal(false);
    };

    const toggleVariant = (id: string) => {
        setVariants(variants.map(v => v.id === id ? { ...v, enabled: !v.enabled } : v));
    };

    const deleteVariant = (id: string) => {
        if (confirm("هل أنت متأكد من حذف هذا الصنف؟")) {
            setVariants(variants.filter(v => v.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display flex flex-col pb-32">
            {/* iOS Status Bar */}
            <div className="h-12 w-full flex items-center justify-between px-6 sticky top-0 bg-background-light dark:bg-background-dark z-50">
                <span className="text-sm font-semibold">9:41</span>
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">signal_cellular_alt</span>
                    <span className="material-symbols-outlined text-xs">wifi</span>
                    <span className="material-symbols-outlined text-xs rotate-90">battery_full</span>
                </div>
            </div>

            {/* Header */}
            <header className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/buyer/pricing-dashboard" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold">إدارة أصناف المواد</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">أنشئ أصناف متعددة لكل مادة</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined">add</span>
                </button>
            </header>

            <main className="flex-1 px-5 overflow-y-auto hide-scrollbar">
                {/* Info Card */}
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-600 !text-[20px]">info</span>
                        <div>
                            <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-1">
                                ما هي الأصناف (الفلاتر)؟
                            </h3>
                            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                                يمكنك إنشاء عدة أصناف لكل مادة (مثال: حديد HMS 1، حديد HMS 2، نحاس أحمر، نحاس أصفر) مع أسعار وصور مختلفة.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Variants List */}
                <div className="space-y-3">
                    {variants.map((variant) => (
                        <div
                            key={variant.id}
                            className={`bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm ${!variant.enabled && "opacity-50"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Image */}
                                <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                                    {variant.image ? (
                                        <img src={variant.image} alt={variant.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-slate-400 !text-[32px]">image</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-bold text-sm">{variant.name}</h3>
                                            <p className="text-xs text-slate-500">{variant.category}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={variant.enabled}
                                                onChange={() => toggleVariant(variant.id)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>

                                    {/* Prices */}
                                    <div className="flex items-center gap-4 mb-3">
                                        <div>
                                            <p className="text-[10px] text-slate-400">ل.س</p>
                                            <p className="text-sm font-bold font-english">{variant.priceSYP}</p>
                                        </div>
                                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                                        <div>
                                            <p className="text-[10px] text-slate-400">USD</p>
                                            <p className="text-sm font-bold font-english">{variant.priceUSD}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                                            <span className="flex items-center justify-center gap-1">
                                                <span className="material-symbols-outlined !text-[14px]">edit</span>
                                                تعديل
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => deleteVariant(variant.id)}
                                            className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                        >
                                            <span className="flex items-center justify-center gap-1">
                                                <span className="material-symbols-outlined !text-[14px]">delete</span>
                                                حذف
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-card-dark rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">إضافة صنف جديد</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined !text-[18px]">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Category */}
                            <div>
                                <label className="text-sm font-bold mb-2 block">الفئة *</label>
                                <select
                                    value={newVariant.category}
                                    onChange={(e) => setNewVariant({ ...newVariant, category: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">اختر الفئة...</option>
                                    <option value="حديد">حديد</option>
                                    <option value="نحاس">نحاس</option>
                                    <option value="ألمنيوم">ألمنيوم</option>
                                    <option value="بلاستيك">بلاستيك</option>
                                    <option value="كرتون">كرتون</option>
                                </select>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="text-sm font-bold mb-2 block">اسم الصنف *</label>
                                <input
                                    type="text"
                                    value={newVariant.name}
                                    onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                                    placeholder="مثال: حديد HMS 1"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Prices */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-bold mb-2 block">السعر (ل.س)</label>
                                    <input
                                        type="number"
                                        value={newVariant.priceSYP}
                                        onChange={(e) => setNewVariant({ ...newVariant, priceSYP: e.target.value })}
                                        placeholder="3200"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg py-3 px-4 font-english focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-2 block">السعر ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newVariant.priceUSD}
                                        onChange={(e) => setNewVariant({ ...newVariant, priceUSD: e.target.value })}
                                        placeholder="1.20"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg py-3 px-4 font-english focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="text-sm font-bold mb-2 block">صورة الصنف</label>
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 gap-2 hover:border-primary/50 cursor-pointer transition-colors">
                                    <span className="material-symbols-outlined !text-[32px]">add_photo_alternate</span>
                                    <span className="text-xs">اضغط لرفع صورة</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleAddVariant}
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                                >
                                    إضافة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
