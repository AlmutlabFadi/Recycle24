"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

export default function DistanceEstimatorPage() {
    const router = useRouter();
    const { addToast } = useToast();
    
    const [vehicleType, setVehicleType] = useState<"pickup" | "van" | "truck">("truck");
    const [weight, setWeight] = useState(12);
    const [peakHours, setPeakHours] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const [estimatedFuel, setEstimatedFuel] = useState<number | null>(45);
    const [estimatedCost, setEstimatedCost] = useState<number | null>(250000);
    const [isCalculating, setIsCalculating] = useState(false);

    // Debounced API call or Local Calculation
    useEffect(() => {
        const fetchEstimate = async () => {
            setIsCalculating(true);
            try {
                const response = await fetch("/api/transport/estimator", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ vehicleType, weight, peakHours }),
                });
                const data = await response.json();
                if (data.success) {
                    setEstimatedFuel(data.data.estimatedFuel);
                    setEstimatedCost(data.data.estimatedCost);
                }
            } catch (error) {
                console.error("Failed to fetch estimate", error);
            } finally {
                setIsCalculating(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchEstimate();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [vehicleType, weight, peakHours]);

    const formatCost = (cost: number) => {
        return new Intl.NumberFormat("ar-SY").format(cost);
    };

    const handleConfirm = () => {
        setIsLoading(true);
        setTimeout(() => {
            addToast("تم تأكيد المسار بنجاح!", "success");
            router.push("/transport/live");
        }, 800);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#070b10] font-arabic text-white relative pb-24 overflow-hidden">
            {/* Elegant Background Gradients */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Custom Premium Header */}
            <header className="flex justify-between items-center p-5 bg-[#070b10]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
                <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-slate-300">
                    <span className="material-symbols-outlined text-xl">history</span>
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-black text-white tracking-wide drop-shadow-md">تحليل المسار والتكلفة</h1>
                    <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Live Estimator
                    </span>
                </div>
                <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-slate-300">
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
            </header>

            <main className="flex-1 px-5 flex flex-col gap-6 pt-5 relative z-10">
                
                {/* Route Map Card - Slick Glassmorphism */}
                <section>
                    <div className="relative h-60 rounded-3xl border border-white/10 overflow-hidden bg-[#111820] shadow-2xl">
                        <div className="absolute inset-0 opacity-40">
                            <div className="w-full h-full bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=34.8021,36.7550&zoom=7&size=600x300&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0x8ec3b9&style=feature:all|element:labels.text.stroke|color:0x1a3646&style=feature:administrative.country|element:geometry.stroke|color:0x4b6878&style=feature:water|element:geometry|color:0x0e1626')] bg-cover bg-center grayscale mix-blend-screen" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#070b10] via-transparent to-[#070b10]/80"></div>
                        
                        <div className="absolute top-5 right-5 flex flex-col gap-5 w-full pr-12 z-10">
                            <div className="flex items-center justify-end gap-4 w-full relative">
                                <span className="text-sm font-bold text-white drop-shadow-md">المنطقة الصناعية، دمشق</span>
                                <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] border-2 border-[#070b10]"></div>
                            </div>
                            
                            <div className="h-4 border-l-2 border-dashed border-white/20 absolute right-6 top-7"></div>
                            
                            <div className="flex items-center justify-end gap-4 w-full relative">
                                <span className="text-sm font-bold text-white drop-shadow-md">مستودعات حلب</span>
                                <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(0,123,255,0.8)] border-2 border-[#070b10]"></div>
                            </div>
                        </div>

                        <div className="absolute bottom-5 left-5 z-10">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-xl">
                                <span>٣٥٥ كم</span>
                                <span className="material-symbols-outlined text-lg text-primary">route</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Vehicle Selection - Modern Toggle */}
                <section>
                    <div className="flex justify-between items-end mb-4">
                        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest text-right w-full">تحديد المركبة</h2>
                    </div>

                    <div className="flex bg-[#111820]/80 backdrop-blur-md rounded-2xl p-1.5 border border-white/5 shadow-inner">
                        {[
                            { id: "pickup", icon: "rv_hookup", label: "بيك أب" },
                            { id: "van", icon: "airport_shuttle", label: "فان متوسط" },
                            { id: "truck", icon: "local_shipping", label: "شاحنة" }
                        ].map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setVehicleType(v.id as any)}
                                className={`flex flex-col items-center justify-center flex-1 py-3.5 rounded-xl transition-all duration-300 ${
                                    vehicleType === v.id 
                                        ? "bg-primary text-white shadow-lg shadow-primary/30 transform scale-[1.02]" 
                                        : "bg-transparent text-slate-400 hover:bg-white/5"
                                }`}
                            >
                                <span className={`material-symbols-outlined text-2xl mb-1 ${vehicleType === v.id ? "text-white" : ""}`}>{v.icon}</span>
                                <span className="text-xs font-bold">{v.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Weight Slider */}
                <section className="bg-[#111820]/80 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6 text-right">
                        <div className="flex items-baseline gap-1 text-primary">
                            <span className="text-3xl font-black tracking-tighter">{weight}</span>
                            <span className="text-sm font-bold text-slate-400">طن</span>
                        </div>
                        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">المقدرة الاستيعابية</h2>
                    </div>

                    <div className="relative pt-2 pb-2">
                        <input 
                            type="range" 
                            min="1" 
                            max="50" 
                            step="0.5"
                            value={weight}
                            onChange={(e) => setWeight(parseFloat(e.target.value))}
                            dir="rtl"
                            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-800 focus:outline-none"
                            style={{
                                background: `linear-gradient(to left, #007BFF ${(weight / 50) * 100}%, #1e293b ${(weight / 50) * 100}%)`,
                            }}
                        />
                        {/* Custom thumb styles added via global CSS normally, relying on accent-colors or custom classes if available. The inline background gradient creates a filled track effect. */}
                        
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-3 flex-row-reverse uppercase tracking-wider">
                            <span>١ طن</span>
                            <span>٥٠ طن</span>
                        </div>
                    </div>
                </section>

                {/* Logistics Conditions */}
                <section className="bg-[#111820]/80 backdrop-blur-md rounded-3xl border border-white/5 p-5 shadow-xl flex items-center justify-between transition-all hover:border-white/10 cursor-pointer" onClick={() => setPeakHours(!peakHours)}>
                    <div className={`w-14 h-7 rounded-full relative transition-all duration-300 ease-in-out px-1 flex items-center ${peakHours ? "bg-emerald-500" : "bg-slate-700"}`}>
                        <span className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${peakHours ? "transform translate-x-7" : "transform translate-x-0"}`}></span>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                            <h3 className="text-sm font-bold text-white">القيادة في أوقات الذروة</h3>
                            <span className={`material-symbols-outlined text-lg ${peakHours ? "text-amber-400" : "text-slate-500"}`}>warning</span>
                        </div>
                        <p className="text-xs text-slate-400">يزيد من الازدحام واستهلاك الوقود بنسبة ٢٠٪</p>
                    </div>
                </section>

                {/* Final Estimation Readout - Neon / Glass Component */}
                <section className="mt-2 mb-6">
                    <div className="relative rounded-3xl overflow-hidden p-[1px] bg-gradient-to-b from-primary/30 to-white/5">
                        <div className="bg-[#0b1219] rounded-[23px] p-6 relative overflow-hidden h-full flex flex-col justify-center">
                            {/* Inner glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px]"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px]"></div>
                            
                            <h2 className="text-center font-bold text-slate-400 mb-6 text-xs uppercase tracking-[0.2em] relative z-10">التقدير المالي واللوجستي</h2>

                            <div className="flex justify-between items-center relative z-10">
                                <div className="text-center flex-1 border-r border-white/10 border-dashed">
                                    <span className="text-[10px] text-slate-500 font-bold block mb-2 uppercase tracking-widest">الوقود المستهلك</span>
                                    <div className="flex items-baseline justify-center gap-1.5 text-emerald-400">
                                        {isCalculating ? (
                                            <div className="h-8 w-16 bg-white/5 animate-pulse rounded"></div>
                                        ) : (
                                            <>
                                                <span className="text-3xl font-black drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">{estimatedFuel !== null ? formatCost(estimatedFuel) : "٠"}</span>
                                                <span className="text-xs font-bold">لتر</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="text-center flex-1">
                                    <span className="text-[10px] text-slate-500 font-bold block mb-2 uppercase tracking-widest">الإجمالي التقريبي</span>
                                    <div className="flex items-baseline justify-center gap-1.5 text-white">
                                        {isCalculating ? (
                                            <div className="h-8 w-24 bg-white/5 animate-pulse rounded"></div>
                                        ) : (
                                            <>
                                                <span className="text-2xl font-black tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{estimatedCost !== null ? formatCost(estimatedCost) : "٠"}</span>
                                                <span className="text-[10px] text-primary font-bold">ل.س</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Premium Floating Action Button Navbar */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#070b10] via-[#070b10]/95 to-transparent pt-10 z-50">
                <button 
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="w-full h-[60px] bg-primary text-white rounded-2xl font-bold text-base flex justify-center items-center gap-3 hover:bg-primary/90 transition-all shadow-[0_10px_30px_rgba(0,123,255,0.4)] disabled:opacity-70 disabled:scale-95 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                    {isLoading ? (
                        <div className="flex items-center gap-3">
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span className="tracking-wide">جاري برمجة المسار...</span>
                        </div>
                    ) : (
                        <>
                            <span className="tracking-wide text-[15px]">تأكيد المسار وبدء الرحلة</span>
                            <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">rocket_launch</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

