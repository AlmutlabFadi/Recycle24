"use client";

import Link from "next/link";
import { useState } from "react";
import BottomNavigation from "@/components/BottomNavigation";
import { allMaterials, materialCategories, Material } from "@/data/materials";

const governorates = [
    "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "اللاذقية", "طرطوس",
    "إدلب", "الحسكة", "دير الزور", "الرقة", "درعا", "السويداء", "القنيطرة"
];

export default function SellPage() {
    const [selectedMaterial, setSelectedMaterial] = useState<string>("");
    const [customMaterial, setCustomMaterial] = useState("");
    const [quantity, setQuantity] = useState("500");
    const [unit, setUnit] = useState<"kg" | "ton">("kg");
    const [governorate, setGovernorate] = useState("دمشق");
    const [step, setStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Get unique categories
    const categories = [
        { id: "all", name: "الكل" },
        { id: "iron", name: "حديد" },
        { id: "copper", name: "نحاس" },
        { id: "aluminum", name: "ألمنيوم" },
        { id: "stainless", name: "فولاذ" },
        { id: "electronics", name: "إلكترونيات" },
        { id: "plastic", name: "بلاستيك" },
        { id: "paper", name: "ورق وكرتون" },
        { id: "other", name: "أخرى" },
    ];

    const filteredMaterials = selectedCategory === "all"
        ? allMaterials
        : allMaterials.filter(m => m.category === selectedCategory);

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
                <div className="flex items-center justify-between p-4">
                    <Link
                        href="/"
                        className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition"
                    >
                        <span className="material-symbols-outlined text-white">
                            arrow_forward
                        </span>
                    </Link>
                    <h1 className="text-base font-bold text-white">بيع خردة</h1>
                    <div className="size-10" />
                </div>
            </header>

            <main className="flex-1 flex flex-col w-full pb-32">
                {/* Progress Steps */}
                <div className="flex w-full flex-row items-center justify-center gap-2 py-6 px-4">
                    <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-slate-700"}`}></div>
                    <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-slate-700"}`}></div>
                    <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? "bg-primary" : "bg-slate-700"}`}></div>
                </div>

                {/* Step 1: Select Material */}
                {step >= 1 && (
                    <section className="animate-fade-in">
                        <h2 className="text-white text-xl font-bold px-4 text-right pb-3 pt-2">
                            اختر نوع المادة
                        </h2>

                        {/* Category Dropdown */}
                        <div className="px-4 pb-4">
                            <div className="relative">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full h-12 appearance-none rounded-xl bg-surface-dark border border-slate-700 text-white text-sm font-bold px-4 pl-10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <span className="material-symbols-outlined !text-[20px]">expand_more</span>
                                </div>
                                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                                    <span className="material-symbols-outlined !text-[20px]">filter_list</span>
                                </div>
                            </div>
                        </div>

                        {/* Materials List - Scrollable */}
                        <div className="px-4">
                            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-surface-dark">
                                {filteredMaterials.map((material: Material) => (
                                    <button
                                        key={material.id}
                                        onClick={() => {
                                            setSelectedMaterial(material.id);
                                            setStep(Math.max(step, 2));
                                        }}
                                        className={`w-full group cursor-pointer relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${selectedMaterial === material.id
                                            ? "border-2 border-primary bg-primary/10"
                                            : "border border-slate-700 bg-surface-dark hover:border-primary/50"
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${selectedMaterial === material.id ? 'bg-primary/20' : 'bg-slate-800'
                                            }`}>
                                            <span className="material-symbols-outlined !text-[24px] text-slate-300 group-hover:text-white transition">
                                                {material.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1 text-right">
                                            <p className="font-bold text-sm text-white leading-tight">{material.name}</p>
                                            {material.basePrice && (
                                                <p className="text-xs text-primary font-semibold dir-ltr text-right mt-0.5">
                                                    ~{material.basePrice.toLocaleString()} ل.س/{material.unit}
                                                </p>
                                            )}
                                        </div>
                                        {selectedMaterial === material.id && (
                                            <span className="material-symbols-outlined text-primary !text-[20px] filled shrink-0">
                                                check_circle
                                            </span>
                                        )}
                                    </button>
                                ))}

                                {/* Custom Material Option */}
                                <button
                                    onClick={() => {
                                        setSelectedMaterial("custom");
                                        setStep(Math.max(step, 2));
                                    }}
                                    className={`w-full group cursor-pointer relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${selectedMaterial === "custom"
                                        ? "border-2 border-primary bg-primary/10"
                                        : "border border-slate-700 bg-surface-dark hover:border-primary/50"
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${selectedMaterial === "custom" ? 'bg-primary/20' : 'bg-slate-800'
                                        }`}>
                                        <span className="material-symbols-outlined !text-[24px] text-slate-300 group-hover:text-white transition">
                                            more_horiz
                                        </span>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <p className="font-bold text-sm text-white leading-tight">أخرى - حدد مادة مخصصة</p>
                                        <p className="text-xs text-slate-400">اكتب نوع المادة التي تريد بيعها</p>
                                    </div>
                                    {selectedMaterial === "custom" && (
                                        <span className="material-symbols-outlined text-primary !text-[20px] filled shrink-0">
                                            check_circle
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Custom Material Input */}
                        {selectedMaterial === "custom" && (
                            <div className="px-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <input
                                    type="text"
                                    value={customMaterial}
                                    onChange={(e) => setCustomMaterial(e.target.value)}
                                    placeholder="اكتب نوع المادة..."
                                    className="w-full h-14 rounded-xl bg-surface-dark border border-slate-700 text-white font-medium px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                />
                            </div>
                        )}
                    </section>
                )}

                {/* Step 2: Quantity */}
                {step >= 2 && (
                    <section className="mt-8 animate-fade-in">
                        <h2 className="text-white text-xl font-bold px-4 text-right pb-4">
                            حدد الكمية
                        </h2>
                        <div className="px-4 space-y-4">
                            {/* Unit Toggle */}
                            <div className="flex h-10 rounded-lg bg-surface-highlight p-1">
                                <button
                                    onClick={() => setUnit("kg")}
                                    className={`flex-1 rounded-md text-sm font-bold transition ${unit === "kg"
                                        ? "bg-bg-dark text-white shadow"
                                        : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    كيلوغرام (كغ)
                                </button>
                                <button
                                    onClick={() => setUnit("ton")}
                                    className={`flex-1 rounded-md text-sm font-bold transition ${unit === "ton"
                                        ? "bg-bg-dark text-white shadow"
                                        : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    طن
                                </button>
                            </div>

                            {/* Quantity Input */}
                            <div className="relative">
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => {
                                        setQuantity(e.target.value);
                                        setStep(Math.max(step, 3));
                                    }}
                                    className="w-full h-14 rounded-xl bg-surface-dark border border-slate-700 text-white font-bold text-lg px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none dir-ltr text-center"
                                    placeholder="0"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                                    {unit === "kg" ? "كغ" : "طن"}
                                </span>
                            </div>
                        </div>
                    </section>
                )}

                {/* Step 3: Location */}
                {step >= 3 && (
                    <section className="mt-8 animate-fade-in">
                        <h2 className="text-white text-xl font-bold px-4 text-right pb-4">
                            موقع الاستلام
                        </h2>
                        <div className="px-4 space-y-4">
                            <div className="relative">
                                <select
                                    value={governorate}
                                    onChange={(e) => setGovernorate(e.target.value)}
                                    className="w-full h-14 appearance-none rounded-xl bg-surface-dark border border-slate-700 text-white text-base font-medium px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
                                >
                                    {governorates.map((gov) => (
                                        <option key={gov} value={gov}>
                                            {gov}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>

                            {/* Map Preview */}
                            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-700 bg-surface-dark">
                                <div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                        backgroundImage:
                                            "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0)), linear-gradient(45deg, #233648 25%, transparent 25%), linear-gradient(-45deg, #233648 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #233648 75%), linear-gradient(-45deg, transparent 75%, #233648 75%)",
                                        backgroundSize: "20px 20px",
                                        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                                    }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="material-symbols-outlined text-primary !text-[32px]">
                                            location_on
                                        </span>
                                        <span className="text-xs font-bold text-white bg-bg-dark/80 px-2 py-1 rounded">
                                            {governorate}
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute bottom-2 left-2">
                                    <button className="flex items-center gap-1 text-[10px] text-primary bg-bg-dark/80 rounded-full px-2 py-1 font-medium">
                                        <span className="material-symbols-outlined !text-[12px]">
                                            my_location
                                        </span>
                                        تحديد دقيق
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-bg-dark/95 backdrop-blur-md border-t border-slate-800 px-4 py-4 pb-8">
                <div className="max-w-md mx-auto">
                    <Link
                        href="/sell/buyers"
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold h-14 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined">search</span>
                        <span>ابحث عن المشترين</span>
                    </Link>
                </div>
            </div>

            <BottomNavigation />
        </>
    );
}
