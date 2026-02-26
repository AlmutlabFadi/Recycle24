"use client";

import { useState } from "react";

const governorates = [
    "دمشق",
    "ريف دمشق",
    "حلب",
    "حمص",
    "حماة",
    "اللاذقية",
    "طرطوس",
    "إدلب",
    "الحسكة",
    "دير الزور",
    "الرقة",
    "درعا",
    "السويداء",
    "القنيطرة"
];

export default function TopAppBar() {
    const [showGovernorates, setShowGovernorates] = useState(false);
    const [selectedGovernorate, setSelectedGovernorate] = useState("دمشق");
    const [logoError, setLogoError] = useState(false); // State for logo fallback

    const handleGovernorateSelect = (gov: string) => {
        setSelectedGovernorate(gov);
        setShowGovernorates(false);
        // هنا يمكن إضافة logic لتحديث المزادات والإعلانات حسب المحافظة
    };

    return (
        <>
            <header className="sticky top-0 z-50 bg-[#111a22]/90 backdrop-blur-md border-b border-slate-800">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 overflow-hidden relative">
                             {/* User should place icon.png in public/branding */}
                             {!logoError ? (
                                <img 
                                    src="/branding/icon.png" 
                                    alt="Logo" 
                                    className="w-full h-full object-cover"
                                    onError={() => setLogoError(true)} 
                                />
                             ) : (
                                <span className="material-symbols-outlined !text-[28px] text-primary">
                                    recycling
                                </span>
                             )}
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white font-english">
                            Metalix24
                        </h1>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowGovernorates(!showGovernorates)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-dark border border-slate-700 transition active:scale-95"
                        >
                            <span className="material-symbols-outlined text-secondary !text-[18px]">
                                location_on
                            </span>
                            <span className="text-sm font-semibold text-slate-200">{selectedGovernorate}</span>
                            <span className={`material-symbols-outlined text-slate-400 !text-[18px] transition-transform ${showGovernorates ? 'rotate-180' : ''}`}>
                                expand_more
                            </span>
                        </button>


                        {/* Governorate Dropdown - positioned relative to button */}
                        {showGovernorates && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-surface-dark border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-1.5">
                                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                                        اختر المحافظة
                                    </div>
                                    <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                        {governorates.map((gov) => (
                                            <button
                                                key={gov}
                                                onClick={() => handleGovernorateSelect(gov)}
                                                className={`w-full text-right px-3 py-2 rounded-xl text-sm font-semibold transition-all ${selectedGovernorate === gov
                                                    ? 'text-primary bg-primary/10 shadow-sm'
                                                    : 'text-slate-200 hover:bg-slate-800/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined !text-[16px] text-secondary">
                                                        location_on
                                                    </span>
                                                    <span className="flex-1">{gov}</span>
                                                    {selectedGovernorate === gov && (
                                                        <span className="material-symbols-outlined !text-[16px] text-primary">
                                                            check_circle
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Backdrop - only when dropdown is open */}
            {showGovernorates && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={() => setShowGovernorates(false)}
                />
            )}
        </>
    );
}
