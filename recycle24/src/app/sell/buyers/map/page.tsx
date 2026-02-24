"use client";

import Link from "next/link";
import { useState } from "react";

const buyers = [
    { id: 1, name: "مؤسسة الأمل للسكراب", price: "45,000", lat: 42, lng: 45, rating: 4.8 },
    { id: 2, name: "ساحة النور", price: "38,000", lat: 30, lng: 65, rating: 4.5 },
    { id: 3, name: "الفرات للمعادن", price: "40,000", lat: 45, lng: 25, rating: 4.2 },
];

export default function BuyerMapPage() {
    const [selectedBuyer] = useState(buyers[0]);

    return (
        <div className="relative flex h-screen w-full flex-col bg-bg-dark">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-30 bg-bg-dark/95 backdrop-blur-sm border-b border-slate-800 shadow-lg">
                <div className="flex items-center justify-between p-4 pb-2">
                    <Link href="/sell/buyers" className="text-white flex size-10 items-center justify-center rounded-full hover:bg-surface-highlight transition">
                        <span className="material-symbols-outlined !text-[24px]">chevron_right</span>
                    </Link>
                    <h2 className="text-white text-lg font-bold">محافظة دمشق</h2>
                    <button className="text-white flex size-10 items-center justify-center rounded-full hover:bg-surface-highlight transition">
                        <span className="material-symbols-outlined !text-[22px]">search</span>
                    </button>
                </div>

                {/* View Toggle & Filters */}
                <div className="flex flex-col gap-3 px-4 pb-4">
                    <div className="flex h-10 w-full items-center justify-center rounded-lg bg-surface-highlight p-1">
                        <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 bg-bg-dark shadow-sm text-white text-sm font-bold transition-all">
                            <span>خريطة</span>
                            <input checked className="invisible w-0" name="view_mode" type="radio" value="map" readOnly />
                        </label>
                        <Link href="/sell/buyers" className="flex h-full grow items-center justify-center overflow-hidden rounded-md px-2 hover:bg-white/5 text-slate-400 text-sm font-medium transition-all">
                            <span>قائمة</span>
                        </Link>
                    </div>

                    {/* Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-surface-highlight border border-primary/40 pl-3 pr-2 active:scale-95 transition">
                            <span className="material-symbols-outlined text-primary !text-[18px]">trending_up</span>
                            <span className="text-white text-xs font-medium">سعر مرتفع</span>
                        </button>
                        <button className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-surface-highlight border border-transparent pl-3 pr-2 hover:border-slate-600">
                            <span className="material-symbols-outlined text-slate-400 !text-[18px]">schedule</span>
                            <span className="text-slate-400 text-xs font-medium">مفتوح الآن</span>
                        </button>
                        <button className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-surface-highlight border border-transparent pl-3 pr-2 hover:border-slate-600">
                            <span className="material-symbols-outlined text-slate-400 !text-[18px]">recycling</span>
                            <span className="text-slate-400 text-xs font-medium">المواد</span>
                        </button>
                        <button className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-surface-highlight border border-transparent pl-3 pr-2 hover:border-slate-600">
                            <span className="material-symbols-outlined text-slate-400 !text-[18px]">star</span>
                            <span className="text-slate-400 text-xs font-medium">تقييم عالي</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Map Area */}
            <main className="flex-1 w-full relative z-0 mt-[140px]">
                {/* Simulated Map Background */}
                <div className="absolute inset-0 bg-[#151e29] w-full h-full">
                    {/* Grid lines */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage: "linear-gradient(#233648 1px, transparent 1px), linear-gradient(90deg, #233648 1px, transparent 1px)",
                            backgroundSize: "40px 40px",
                        }}
                    />
                    {/* Blocks */}
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#1c2836] rounded-sm opacity-60" />
                    <div className="absolute bottom-1/3 right-1/4 w-48 h-40 bg-[#1c2836] rounded-sm opacity-60" />
                    {/* Street Names */}
                    <div className="absolute top-[35%] right-[20%] text-slate-500/40 text-[10px] rotate-12 select-none">طريق دمشق</div>
                    <div className="absolute bottom-[40%] left-[30%] text-slate-500/40 text-[10px] -rotate-6 select-none">شارع بغداد</div>
                </div>

                {/* Map Markers */}
                {buyers.map((buyer, i) => (
                    <div
                        key={buyer.id}
                        className={`absolute flex flex-col items-center justify-center group cursor-pointer z-20 transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 ${i === 0 ? "scale-100" : "scale-75 hover:scale-90"
                            }`}
                        style={{
                            top: `${buyer.lat}%`,
                            left: `${buyer.lng}%`,
                        }}
                    >
                        <div className="relative flex items-center justify-center">
                            {i === 0 && <div className="absolute size-14 rounded-full bg-success/20 animate-ping" />}
                            <div className={`relative flex size-10 items-center justify-center rounded-full border-2 border-white shadow-lg shadow-black/30 ${i === 0 ? "bg-success" : "bg-warning"
                                }`}>
                                {i === 0 ? (
                                    <span className="material-symbols-outlined text-white !text-[20px]">attach_money</span>
                                ) : (
                                    <span className="text-bg-dark font-bold text-xs">{buyer.price.slice(0, 2)}</span>
                                )}
                            </div>
                            <div className={`absolute -bottom-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${i === 0 ? "border-t-success" : "border-t-warning"
                                }`} />
                        </div>
                        {i === 0 && (
                            <div className="mt-2 bg-surface-dark px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-md border border-slate-700">
                                {buyer.price} ل.س
                            </div>
                        )}
                    </div>
                ))}

                {/* User Location */}
                <div className="absolute bottom-[25%] right-[40%] flex items-center justify-center z-10">
                    <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center">
                        <div className="size-4 bg-primary border-2 border-white rounded-full shadow-sm" />
                    </div>
                </div>

                {/* FAB: My Location */}
                <button className="absolute bottom-6 left-4 z-20 flex size-12 items-center justify-center rounded-full bg-surface-dark text-primary shadow-lg border border-slate-700 active:scale-95 transition">
                    <span className="material-symbols-outlined !text-[24px]">my_location</span>
                </button>

                {/* Map Controls (Zoom) */}
                <div className="absolute bottom-24 left-4 z-20 flex flex-col rounded-lg bg-surface-dark shadow-lg border border-slate-700 overflow-hidden">
                    <button className="flex size-10 items-center justify-center text-white hover:bg-surface-highlight border-b border-slate-700">
                        <span className="material-symbols-outlined !text-[20px]">add</span>
                    </button>
                    <button className="flex size-10 items-center justify-center text-white hover:bg-surface-highlight">
                        <span className="material-symbols-outlined !text-[20px]">remove</span>
                    </button>
                </div>
            </main>

            {/* Bottom Sheet - Buyer Preview */}
            <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-6">
                <div className="relative w-full rounded-xl bg-surface-dark shadow-[0_-4px_20px_rgba(0,0,0,0.4)] border border-slate-700 overflow-hidden animate-slide-up">
                    {/* Handle */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-slate-600 rounded-full" />

                    <div className="flex flex-col p-4 pt-6 gap-4">
                        {/* Header Info */}
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-white text-lg font-bold leading-tight">{selectedBuyer.name}</h3>
                                <div className="flex items-center gap-1 text-warning text-sm">
                                    <span className="material-symbols-outlined !text-[16px] filled">star</span>
                                    <span className="font-bold">{selectedBuyer.rating}</span>
                                    <span className="text-slate-400 font-normal">(124 تقييم)</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center rounded bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success border border-success/20">
                                        مفتوح
                                    </span>
                                    <span className="text-slate-400 text-xs">يغلق الساعة 6:00 م</span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex flex-col items-end">
                                <span className="text-slate-400 text-xs mb-1">سعر النحاس</span>
                                <div className="text-success font-display font-bold text-xl tracking-tight">{selectedBuyer.price}</div>
                                <span className="text-slate-400 text-[10px]">ل.س / كغ</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px w-full bg-slate-700" />

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button className="flex flex-1 items-center justify-center gap-2 h-11 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-lg shadow-primary/20 transition active:scale-[0.98]">
                                <span className="material-symbols-outlined !text-[20px]">directions</span>
                                <span>الاتجاهات</span>
                            </button>
                            <button className="flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-surface-highlight hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 hover:border-slate-600 transition active:scale-[0.98]">
                                <span className="material-symbols-outlined !text-[20px]">call</span>
                                <span>اتصال</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
