"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";
import { allMaterials } from "@/data/materials";

export default function SellStep1Page() {
    const [selectedMaterial, setSelectedMaterial] = useState<string>("");
    const [weight, setWeight] = useState<string>("");
    const [unit, setUnit] = useState<"kg" | "ton">("kg");
    const [condition, setCondition] = useState<"clean" | "mixed" | "unknown">("clean");

    const isValid = selectedMaterial && weight && parseFloat(weight) > 0;

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="بيع الخردة - الخطوة 1" />

            {/* Progress Bar */}
            <div className="px-4 py-4 bg-surface-dark border-b border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">الخطوة 1 من 3</span>
                    <span className="text-xs text-primary font-bold">اختيار المادة</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-primary rounded-full transition-all duration-500"></div>
                </div>
            </div>

            <main className="flex-1 p-4 pb-24">
                {/* Material Selection */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold text-white mb-4">ما نوع الخردة التي تريد بيعها؟</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {allMaterials.slice(0, 8).map((material) => (
                            <button
                                key={material.id}
                                onClick={() => setSelectedMaterial(material.id)}
                                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                                    selectedMaterial === material.id
                                        ? "border-primary bg-primary/10"
                                        : "border-slate-700 bg-surface-highlight hover:border-slate-600"
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                                    selectedMaterial === material.id ? "bg-primary" : "bg-slate-700"
                                }`}>
                                    <span className="material-symbols-outlined text-white">
                                        {material.icon || "recycling"}
                                    </span>
                                </div>
                                <span className={`text-sm font-medium ${
                                    selectedMaterial === material.id ? "text-primary" : "text-slate-300"
                                }`}>
                                    {material.name}
                                </span>
                            </button>
                        ))}
                    </div>
                    <Link 
                        href="/sell"
                        className="flex items-center justify-center gap-2 mt-4 text-sm text-primary hover:underline"
                    >
                        <span className="material-symbols-outlined !text-[18px]">expand_more</span>
                        عرض جميع المواد ({allMaterials.length}+)
                    </Link>
                </section>

                {/* Weight Input */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold text-white mb-4">الوزن التقريبي</h2>
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setUnit("kg")}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                                    unit === "kg"
                                        ? "bg-primary text-white"
                                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                }`}
                            >
                                كيلوغرام (كغ)
                            </button>
                            <button
                                onClick={() => setUnit("ton")}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                                    unit === "ton"
                                        ? "bg-primary text-white"
                                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                }`}
                            >
                                طن
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="أدخل الوزن..."
                                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg text-center focus:border-primary focus:outline-none transition-colors"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                {unit === "kg" ? "كغ" : "طن"}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            يمكنك تقدير الوزن وسيتم تحديده بدقة عند الاستلام
                        </p>
                    </div>
                </section>

                {/* Condition Selection */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold text-white mb-4">حالة الخردة</h2>
                    <div className="space-y-2">
                        {[
                            { id: "clean", label: "نظيفة (خالية من الشوائب)", icon: "check_circle" },
                            { id: "mixed", label: "مختلطة (مع شوائب)", icon: "contrast" },
                            { id: "unknown", label: "غير متأكد", icon: "help" },
                        ].map((cond) => (
                            <button
                                key={cond.id}
                                onClick={() => setCondition(cond.id as typeof condition)}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-right ${
                                    condition === cond.id
                                        ? "border-primary bg-primary/10"
                                        : "border-slate-700 bg-surface-highlight hover:border-slate-600"
                                }`}
                            >
                                <span className={`material-symbols-outlined ${
                                    condition === cond.id ? "text-primary" : "text-slate-400"
                                }`}>
                                    {cond.icon}
                                </span>
                                <span className={`font-medium ${
                                    condition === cond.id ? "text-white" : "text-slate-300"
                                }`}>
                                    {cond.label}
                                </span>
                                {condition === cond.id && (
                                    <span className="material-symbols-outlined text-primary mr-auto">
                                        check_circle
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Price Estimate */}
                {isValid && (
                    <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl p-4 border border-primary/30 mb-6 animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-primary">payments</span>
                            <span className="text-sm text-slate-300">التقدير الأولي:</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {(parseFloat(weight) * (unit === "ton" ? 1000 : 1) * 45000).toLocaleString()} ل.س
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            *التقدير تقريبي بناءً على متوسط السوق. السعر النهائي يحدده المشتري.
                        </p>
                    </div>
                )}
            </main>

            {/* Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 bg-surface-dark border-t border-slate-800 p-4 pb-safe">
                <div className="max-w-md mx-auto">
                    <Link
                        href={isValid ? "/sell/step-2" : "#"}
                        className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg transition-all ${
                            isValid
                                ? "bg-primary text-white hover:bg-primary-dark active:scale-[0.98]"
                                : "bg-slate-700 text-slate-500 cursor-not-allowed"
                        }`}
                        onClick={(e) => !isValid && e.preventDefault()}
                    >
                        <span>الخطوة التالية</span>
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
