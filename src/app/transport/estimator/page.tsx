"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DistanceEstimatorPage() {
    const router = useRouter();
    const [vehicleType, setVehicleType] = useState<"pickup" | "van" | "truck">("truck");
    const [weight, setWeight] = useState(12);
    const [peakHours, setPeakHours] = useState(true);

    // Simulated calculation based on selections
    const baseFuel = vehicleType === "truck" ? 40 : vehicleType === "van" ? 25 : 15;
    const peakMultiplier = peakHours ? 1.15 : 1;
    const weightMultiplier = 1 + (weight / 100);
    
    const estimatedFuel = Math.round(baseFuel * peakMultiplier * weightMultiplier);
    const estimatedCost = estimatedFuel * 15000; // Simulated price per liter
    
    const formatCost = (cost: number) => {
        return cost.toLocaleString("ar-SA");
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic text-white pb-24 relative">
            {/* Custom Header */}
            <header className="flex justify-between items-center p-4 bg-background-dark/95 backdrop-blur sticky top-0 z-20">
                <button className="text-slate-300 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">history</span>
                </button>
                <h1 className="text-lg font-bold text-center flex-1">مقدّر المسافات والوقود</h1>
                <button onClick={() => router.back()} className="text-slate-300 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">arrow_forward</span>
                </button>
            </header>

            <main className="flex-1 px-4 flex flex-col gap-6 pt-2">
                
                {/* Route Map Card */}
                <section>
                    <div className="relative h-48 rounded-2xl border border-slate-700 overflow-hidden bg-slate-800">
                        {/* Fake map background */}
                        <div className="absolute inset-0 opacity-40">
                            <div className="w-full h-full bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=34.8021,36.7550&zoom=7&size=600x300&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0x8ec3b9&style=feature:all|element:labels.text.stroke|color:0x1a3646&style=feature:administrative.country|element:geometry.stroke|color:0x4b6878&style=feature:water|element:geometry|color:0x0e1626')] bg-cover bg-center grayscale mix-blend-screen" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A111A] via-[#0A111A]/60 to-transparent"></div>
                        
                        <div className="absolute bottom-4 right-4 flex flex-col gap-3 z-10">
                            <div className="flex items-center justify-end gap-2">
                                <span className="bg-surface-dark/80 backdrop-blur text-sm text-white px-3 py-1.5 rounded-lg border border-slate-700">المنطقة الصناعية، دمشق</span>
                                <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-transparent flex items-center justify-center relative">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                    <div className="absolute top-4 w-px h-6 bg-slate-500 border-dashed border-l border-slate-500"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <span className="bg-surface-dark/80 backdrop-blur text-sm text-white px-3 py-1.5 rounded-lg border border-slate-700">مستودعات حلب</span>
                                <span className="material-symbols-outlined text-primary text-xl drop-shadow-[0_0_8px_rgba(0,123,255,0.6)]">location_on</span>
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-4 z-10">
                            <div className="bg-primary text-white px-3 py-1.5 rounded-lg font-bold text-sm flex items-center gap-1 shadow-lg shadow-primary/30">
                                <span>٣٥٥ كم</span>
                                <span className="material-symbols-outlined text-sm">location_on</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Vehicle Type */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary text-xl">local_shipping</span>
                        <h2 className="text-base font-bold text-white">نوع المركبة</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setVehicleType("pickup")}
                            className={`flex flex-col items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                                vehicleType === "pickup" 
                                    ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(0,123,255,0.15)]" 
                                    : "bg-surface-dark/50 border-slate-700 hover:border-slate-600"
                            }`}
                        >
                            {vehicleType === "pickup" && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                                </div>
                            )}
                            <span className={`material-symbols-outlined text-4xl ${vehicleType === "pickup" ? "text-primary" : "text-slate-400"}`}>directions_car</span>
                            <span className={`text-xs font-bold ${vehicleType === "pickup" ? "text-white" : "text-slate-400"}`}>بيك أب</span>
                        </button>

                        <button
                            onClick={() => setVehicleType("van")}
                            className={`flex flex-col items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                                vehicleType === "van" 
                                    ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(0,123,255,0.15)]" 
                                    : "bg-surface-dark/50 border-slate-700 hover:border-slate-600"
                            }`}
                        >
                            {vehicleType === "van" && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                                </div>
                            )}
                            <span className={`material-symbols-outlined text-4xl ${vehicleType === "van" ? "text-primary" : "text-slate-400"}`}>airport_shuttle</span>
                            <span className={`text-xs font-bold ${vehicleType === "van" ? "text-white" : "text-slate-400"}`}>فان</span>
                        </button>

                        <button
                            onClick={() => setVehicleType("truck")}
                            className={`flex flex-col items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                                vehicleType === "truck" 
                                    ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(0,123,255,0.15)]" 
                                    : "bg-surface-dark/50 border-slate-700 hover:border-slate-600"
                            }`}
                        >
                            {vehicleType === "truck" && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                                </div>
                            )}
                            <span className={`material-symbols-outlined text-4xl ${vehicleType === "truck" ? "text-primary" : "text-slate-400"}`}>local_shipping</span>
                            <span className={`text-xs font-bold ${vehicleType === "truck" ? "text-white" : "text-slate-400"}`}>شاحنة ثقيلة</span>
                        </button>
                    </div>
                </section>

                {/* Load Weight */}
                <section>
                    <div className="bg-surface-dark/30 rounded-2xl border border-slate-700 p-5 mt-2">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">weight</span>
                                <h2 className="text-base font-bold text-white">وزن الحمولة</h2>
                            </div>
                            <div className="text-xl font-bold text-primary">{weight} <span className="text-sm font-normal text-slate-500">طن</span></div>
                        </div>

                        <div className="relative pt-4 pb-2">
                            <div className="flex justify-between text-xs text-slate-500 mb-2 px-1 dir-ltr flex-row-reverse">
                                <span>1 طن</span>
                                <span>50 طن</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="50" 
                                value={weight}
                                onChange={(e) => setWeight(parseInt(e.target.value))}
                                dir="rtl"
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        <div className="w-full h-px bg-slate-800 my-5"></div>

                        {/* Traffic Condition */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center justify-end gap-2 mb-1">
                                    <h3 className="text-sm font-bold text-white">حالة المرور</h3>
                                    <span className="material-symbols-outlined text-orange-500 text-lg">traffic</span>
                                </div>
                                <p className="text-xs text-slate-400 text-right">تعديل التقدير لساعات الذروة</p>
                            </div>
                            <button 
                                onClick={() => setPeakHours(!peakHours)}
                                className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors relative ${peakHours ? "bg-primary" : "bg-slate-600"}`}
                            >
                                <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute ${peakHours ? "left-1" : "right-1"}`} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Summary */}
                <section className="mb-4">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary text-xl">analytics</span>
                        <h2 className="text-base font-bold text-white">الملخص</h2>
                    </div>

                    <div className="bg-surface-dark/50 rounded-2xl border border-slate-700 p-5">
                        <div className="grid grid-cols-2 gap-4 divide-x divide-x-reverse divide-slate-800 text-center">
                            <div className="flex flex-col items-center justify-center gap-1">
                                <span className="text-xs text-slate-400 mb-1">الوصول المتوقع</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-bold text-white">٤ س ٣٠ د</span>
                                    <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-1">
                                <span className="text-xs text-slate-400 mb-1">استهلاك الوقود</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-bold text-white">{estimatedFuel} لتر</span>
                                    <span className="material-symbols-outlined text-orange-500 text-lg">local_gas_station</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-800 my-5"></div>

                        <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-xs text-slate-400">التكلفة التقديرية للوقود</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-primary drop-shadow-[0_0_15px_rgba(0,123,255,0.3)]">{formatCost(estimatedCost)}</span>
                                <span className="text-sm text-slate-400 font-medium">ل.س</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Bottom Sticky Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-dark/95 backdrop-blur-md border-t border-slate-800 z-50">
                <button 
                    className="w-full h-14 bg-primary text-white rounded-xl font-bold text-base flex items-center justify-center gap-3 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    تأكيد المسار وبدء الرحلة
                    <span className="material-symbols-outlined">arrow_left_alt</span>
                </button>
            </div>
        </div>
    );
}
