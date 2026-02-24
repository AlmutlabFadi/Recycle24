"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Material {
    id: string;
    name: string;
    icon: string;
    price: number;
}

export default function CreateDealPage() {
    const [quantity, setQuantity] = useState<string>("50");
    const [price, setPrice] = useState<string>("5250");
    const [deliveryDate, setDeliveryDate] = useState<string>("");
    const [transportType, setTransportType] = useState<"supplier" | "factory">("supplier");

    const materials: Material[] = [
        { id: "copper", name: "نحاس - درجة أولى", icon: "bolt", price: 5200 },
        { id: "iron", name: "حديد HMS", icon: "hardware", price: 15000 },
        { id: "aluminum", name: "ألمنيوم", icon: "kitchen", price: 12500 },
        { id: "plastic", name: "بلاستيك PET", icon: "recycling", price: 3000 },
    ];

    const selectedMaterial = materials[0];

    const calculateTotal = () => {
        const qty = parseFloat(quantity) || 0;
        const prc = parseFloat(price) || 0;
        return qty * prc;
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="تقديم عرض توريد" />

            <div className="flex-1 flex flex-col gap-6 p-4 pb-24">
                <div className="group relative overflow-hidden rounded-xl bg-surface-dark ring-1 ring-slate-700">
                    <div className="flex items-stretch gap-4 p-4">
                        <div className="flex flex-col justify-center gap-1 flex-[2]">
                            <span className="text-slate-400 text-xs font-medium">ملخص المناقصة</span>
                            <h3 className="text-lg font-bold leading-tight text-white">مصنع الأمل للصناعات</h3>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="material-symbols-outlined text-primary text-[18px]">{selectedMaterial.icon}</span>
                                <p className="text-slate-400 text-sm font-medium">{selectedMaterial.name}</p>
                            </div>
                        </div>
                        <div className="w-20 h-20 shrink-0 rounded-lg bg-slate-700 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-slate-400">factory</span>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-1 h-full bg-primary"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2 rounded-xl bg-surface-dark p-4 ring-1 ring-slate-700">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <span>سعر Metalix24</span>
                            <span className="material-symbols-outlined text-[14px]">info</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-xl font-bold text-white">{selectedMaterial.price.toLocaleString()}</span>
                            <span className="text-xs font-medium mb-1.5 text-slate-400">ل.س</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-400 bg-green-500/10 w-fit px-1.5 py-0.5 rounded text-xs font-bold">
                            <span className="material-symbols-outlined text-[14px]">trending_up</span>
                            <span>+2.5%</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl bg-surface-dark p-4 ring-1 ring-slate-700">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <span>نطاق العطاء الحالي</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-white">5,100</span>
                            <span className="text-xs text-slate-500 font-medium">إلى 5,300 ل.س</span>
                        </div>
                        <div className="w-full h-1 bg-slate-700 rounded-full mt-auto overflow-hidden">
                            <div className="h-full bg-primary w-2/3 rounded-full"></div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-5">
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-white">الكمية المعروضة (طن)</span>
                        <div className="relative">
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full rounded-xl border-slate-700 bg-surface-dark text-white h-14 px-4 text-lg font-medium focus:border-primary focus:ring-primary shadow-sm transition-all"
                                placeholder="00"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <span className="text-slate-400 text-sm font-medium">طن</span>
                            </div>
                        </div>
                    </label>

                    <label className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-white">السعر للطن (ل.س)</span>
                            <Link href="/market" className="text-xs text-primary font-medium hover:underline">
                                مراجعة أسعار السوق
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full rounded-xl border-slate-700 bg-surface-dark text-white h-14 px-4 text-lg font-medium focus:border-primary focus:ring-primary shadow-sm transition-all"
                                placeholder="0000"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <span className="text-slate-400 text-sm font-medium">ل.س</span>
                            </div>
                        </div>
                    </label>

                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-white">تاريخ التسليم المتوقع</span>
                        <div className="relative">
                            <input
                                type="date"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                                className="w-full rounded-xl border-slate-700 bg-surface-dark text-white h-14 px-4 text-base font-medium focus:border-primary focus:ring-primary shadow-sm transition-all"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400">calendar_today</span>
                            </div>
                        </div>
                    </label>

                    <div className="flex flex-col gap-3">
                        <span className="text-sm font-medium text-white">نوع النقل</span>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="cursor-pointer relative">
                                <input
                                    type="radio"
                                    checked={transportType === "supplier"}
                                    onChange={() => setTransportType("supplier")}
                                    className="peer sr-only"
                                />
                                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-700 bg-surface-dark p-4 text-center transition-all peer-checked:border-primary peer-checked:bg-primary/5">
                                    <span className="material-symbols-outlined text-2xl mb-1">local_shipping</span>
                                    <span className="text-sm font-medium">توصيل المورد</span>
                                </div>
                                {transportType === "supplier" && (
                                    <div className="absolute top-2 left-2 text-primary">
                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                    </div>
                                )}
                            </label>
                            <label className="cursor-pointer relative">
                                <input
                                    type="radio"
                                    checked={transportType === "factory"}
                                    onChange={() => setTransportType("factory")}
                                    className="peer sr-only"
                                />
                                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-700 bg-surface-dark p-4 text-center transition-all peer-checked:border-primary peer-checked:bg-primary/5">
                                    <span className="material-symbols-outlined text-2xl mb-1">storefront</span>
                                    <span className="text-sm font-medium">استلام المصنع</span>
                                </div>
                                {transportType === "factory" && (
                                    <div className="absolute top-2 left-2 text-primary">
                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mt-2 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2 opacity-80">
                        <span className="text-sm font-medium">الإجمالي المتوقع للعرض</span>
                        <span className="material-symbols-outlined text-[18px]">calculate</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold tracking-tight">{calculateTotal().toLocaleString()}</h3>
                        <span className="text-lg font-medium opacity-80">ليرة سورية</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        <p>السعر النهائي يخضع للفحص عند الاستلام</p>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-dark/95 backdrop-blur border-t border-slate-800 z-40">
                <button className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all text-white text-lg font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2">
                    <span>إرسال العرض الرسمي</span>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
            </div>
        </div>
    );
}
