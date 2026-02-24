"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

const governorates = [
    { id: "damascus", name: "دمشق", region: "الجنوب" },
    { id: "rif-damascus", name: "ريف دمشق", region: "الجنوب" },
    { id: "aleppo", name: "حلب", region: "الشمال" },
    { id: "homs", name: "حمص", region: "الوسط" },
    { id: "hama", name: "حماة", region: "الوسط" },
    { id: "latakia", name: "اللاذقية", region: "الساحل" },
    { id: "tartous", name: "طرطوس", region: "الساحل" },
    { id: "idleb", name: "إدلب", region: "الشمال" },
    { id: "hasakah", name: "الحسكة", region: "الشمال الشرقي" },
    { id: "deir-ezzor", name: "دير الزور", region: "الشرق" },
    { id: "raqqa", name: "الرقة", region: "الشرق" },
    { id: "daraa", name: "درعا", region: "الجنوب" },
    { id: "sweida", name: "السويداء", region: "الجنوب" },
    { id: "quneitra", name: "القنيطرة", region: "الجنوب" },
];

const regions = ["الكل", "الجنوب", "الشمال", "الوسط", "الساحل", "الشرق", "الشمال الشرقي"];

export default function SellStep2Page() {
    const [selectedGovernorate, setSelectedGovernorate] = useState<string>("");
    const [selectedRegion, setSelectedRegion] = useState<string>("الكل");
    const [deliveryType, setDeliveryType] = useState<"pickup" | "dropoff">("pickup");
    const [address, setAddress] = useState<string>("");

    const filteredGovernorates = selectedRegion === "الكل"
        ? governorates
        : governorates.filter(g => g.region === selectedRegion);

    const isValid = selectedGovernorate && (deliveryType === "pickup" || address.length > 5);

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="بيع الخردة - الخطوة 2" />

            {/* Progress Bar */}
            <div className="px-4 py-4 bg-surface-dark border-b border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">الخطوة 2 من 3</span>
                    <span className="text-xs text-primary font-bold">اختيار الموقع</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-primary rounded-full transition-all duration-500"></div>
                </div>
            </div>

            <main className="flex-1 p-4 pb-32">
                {/* Delivery Type */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold text-white mb-4">طريقة التسليم</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setDeliveryType("pickup")}
                            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                                deliveryType === "pickup"
                                    ? "border-primary bg-primary/10"
                                    : "border-slate-700 bg-surface-highlight hover:border-slate-600"
                            }`}
                        >
                            <span className={`material-symbols-outlined text-3xl mb-2 ${
                                deliveryType === "pickup" ? "text-primary" : "text-slate-400"
                            }`}>
                                local_shipping
                            </span>
                            <span className={`font-bold ${
                                deliveryType === "pickup" ? "text-white" : "text-slate-300"
                            }`}>
                                استلام من موقعي
                            </span>
                            <span className="text-xs text-slate-500 mt-1">المشتري يأتي إليك</span>
                        </button>
                        <button
                            onClick={() => setDeliveryType("dropoff")}
                            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                                deliveryType === "dropoff"
                                    ? "border-primary bg-primary/10"
                                    : "border-slate-700 bg-surface-highlight hover:border-slate-600"
                            }`}
                        >
                            <span className={`material-symbols-outlined text-3xl mb-2 ${
                                deliveryType === "dropoff" ? "text-primary" : "text-slate-400"
                            }`}>
                                warehouse
                            </span>
                            <span className={`font-bold ${
                                deliveryType === "dropoff" ? "text-white" : "text-slate-300"
                            }`}>
                                التوصيل للمشتري
                            </span>
                            <span className="text-xs text-slate-500 mt-1">أنت تذهب للمشتري</span>
                        </button>
                    </div>
                </section>

                {/* Region Filter */}
                <section className="mb-4">
                    <h2 className="text-lg font-bold text-white mb-3">اختر المحافظة</h2>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {regions.map((region) => (
                            <button
                                key={region}
                                onClick={() => setSelectedRegion(region)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                    selectedRegion === region
                                        ? "bg-primary text-white"
                                        : "bg-surface-highlight text-slate-300 border border-slate-700"
                                }`}
                            >
                                {region}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Governorates Grid */}
                <section className="mb-6">
                    <div className="grid grid-cols-2 gap-2">
                        {filteredGovernorates.map((gov) => (
                            <button
                                key={gov.id}
                                onClick={() => setSelectedGovernorate(gov.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right ${
                                    selectedGovernorate === gov.id
                                        ? "border-primary bg-primary/10"
                                        : "border-slate-700 bg-surface-highlight hover:border-slate-600"
                                }`}
                            >
                                <span className={`material-symbols-outlined ${
                                    selectedGovernorate === gov.id ? "text-primary" : "text-slate-400"
                                }`}>
                                    location_on
                                </span>
                                <div className="flex-1">
                                    <span className={`block font-medium ${
                                        selectedGovernorate === gov.id ? "text-white" : "text-slate-300"
                                    }`}>
                                        {gov.name}
                                    </span>
                                    <span className="text-xs text-slate-500">{gov.region}</span>
                                </div>
                                {selectedGovernorate === gov.id && (
                                    <span className="material-symbols-outlined text-primary">
                                        check_circle
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Address Input (for dropoff) */}
                {deliveryType === "dropoff" && (
                    <section className="mb-6 animate-fade-in">
                        <h2 className="text-lg font-bold text-white mb-3">عنوان التسليم</h2>
                        <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="أدخل العنوان التفصيلي (المنطقة، الشارع، رقم المبنى...)"
                                rows={3}
                                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-right focus:border-primary focus:outline-none transition-colors resize-none"
                            />
                        </div>
                    </section>
                )}

                {/* Map Preview */}
                {selectedGovernorate && (
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary">map</span>
                            <span className="text-white font-medium">
                                المشترين في {governorates.find(g => g.id === selectedGovernorate)?.name}
                            </span>
                        </div>
                        <div className="bg-slate-800 rounded-lg h-32 flex items-center justify-center">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">map</span>
                                <p className="text-sm text-slate-500">معاينة الخريطة متوفرة في الخطوة التالية</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-surface-dark border-t border-slate-800 p-4 pb-safe">
                <div className="max-w-md mx-auto flex gap-3">
                    <Link
                        href="/sell/step-1"
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-all text-center"
                    >
                        السابق
                    </Link>
                    <Link
                        href={isValid ? "/sell/step-3" : "#"}
                        className={`flex-[2] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
                            isValid
                                ? "bg-primary text-white hover:bg-primary-dark active:scale-[0.98]"
                                : "bg-slate-700 text-slate-500 cursor-not-allowed"
                        }`}
                        onClick={(e) => !isValid && e.preventDefault()}
                    >
                        <span>متابعة</span>
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
