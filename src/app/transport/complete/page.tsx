"use client";

import { useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import SignaturePad from "@/components/SignaturePad";

export default function CompleteDeliveryPage() {
    const [condition, setCondition] = useState<"intact" | "damaged">("intact");
    const [notes, setNotes] = useState("");
    const [driverSignature, setDriverSignature] = useState("");
    const [receiverSignature, setReceiverSignature] = useState("");

    const handleComplete = () => {
        console.log("Delivery Completed", {
            condition,
            notes,
            hasDriverSignature: !!driverSignature,
            hasReceiverSignature: !!receiverSignature
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic text-white pb-24 relative">
            <HeaderWithBack title="إتمام التسليم" />

            <main className="flex-1 px-4 flex flex-col gap-6 pt-4">
                
                {/* Location Arrival Card */}
                <section>
                    <div className="relative h-40 rounded-2xl border border-slate-700 overflow-hidden bg-slate-800">
                        {/* Fake map background */}
                        <div className="absolute inset-0 opacity-40">
                            <div className="w-full h-full bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=33.5138,36.2765&zoom=14&size=600x300&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0x8ec3b9&style=feature:all|element:labels.text.stroke|color:0x1a3646&style=feature:all|element:labels.icon|visibility:off&style=feature:administrative.country|element:geometry.stroke|color:0x4b6878&style=feature:administrative.land_parcel|element:labels.text.fill|color:0x64779e&style=feature:landscape.man_made|element:geometry.stroke|color:0x334e87&style=feature:landscape.natural|element:geometry|color:0x023e58&style=feature:poi|element:geometry|color:0x283d6a&style=feature:poi|element:labels.text.fill|color:0x6f9ba5&style=feature:poi|element:labels.text.stroke|color:0x1d2c4d&style=feature:road|element:geometry|color:0x304a7d&style=feature:road|element:labels.text.fill|color:0x98a5be&style=feature:road|element:labels.text.stroke|color:0x1d2c4d&style=feature:road.highway|element:geometry|color:0x2c6675&style=feature:road.highway|element:geometry.stroke|color:0x255763&style=feature:road.highway|element:labels.text.fill|color:0xb0d5ce&style=feature:road.highway|element:labels.text.stroke|color:0x023e58&style=feature:transit|element:labels.text.fill|color:0x98a5be&style=feature:transit|element:labels.text.stroke|color:0x1d2c4d&style=feature:transit.line|element:geometry.fill|color:0x283d6a&style=feature:transit.station|element:geometry|color:0x3a4762&style=feature:water|element:geometry|color:0x0e1626&style=feature:water|element:labels.text.fill|color:0x4e6d70')] bg-cover bg-center grayscale mix-blend-screen" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A111A] via-[#0A111A]/80 to-transparent"></div>
                        
                        <div className="absolute bottom-4 left-4 right-4 flex flex-col items-end">
                            <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold mb-2">وصلت إلى الموقع</span>
                            <h2 className="text-xl font-bold text-white mb-1">التوصيلة #8392</h2>
                            <div className="flex items-center gap-1.5 text-slate-300">
                                <span className="text-sm">المنطقة الصناعية - بوابة 4</span>
                                <span className="material-symbols-outlined text-sm">location_on</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Proof of Delivery */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
                        <h2 className="text-base font-bold text-white">إثبات التسليم (الأدلة)</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-slate-600 bg-surface-dark/50 hover:bg-slate-800 transition-colors h-36">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined text-primary text-xl">scale</span>
                            </div>
                            <span className="text-sm font-bold text-white mb-1">تذكرة الميزان</span>
                            <span className="text-xs text-slate-400 mb-3 block text-center">صورة واضحة للوزن</span>
                            <span className="material-symbols-outlined text-slate-500 ml-auto">photo_camera</span>
                        </button>
                        
                        <button className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-slate-600 bg-surface-dark/50 hover:bg-slate-800 transition-colors h-36">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined text-primary text-xl">receipt</span>
                            </div>
                            <span className="text-sm font-bold text-white mb-1">الفواتير النهائية</span>
                            <span className="text-xs text-slate-400 mb-3 block text-center">نسخة موقعة</span>
                            <span className="material-symbols-outlined text-slate-500 ml-auto">photo_camera</span>
                        </button>
                    </div>
                </section>

                {/* Status Report */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary text-xl">fact_check</span>
                        <h2 className="text-base font-bold text-white">تقرير الحالة</h2>
                    </div>

                    <div className="bg-surface-dark/30 rounded-2xl border border-slate-700 p-4">
                        <span className="text-xs text-slate-400 block mb-3 text-right">حالة البضاعة</span>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                                onClick={() => setCondition("intact")}
                                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-colors ${
                                    condition === "intact" 
                                        ? "bg-green-500/10 border-green-500 text-green-400" 
                                        : "bg-transparent border-slate-700 text-slate-400 hover:border-slate-600"
                                }`}
                            >
                                <span className="material-symbols-outlined text-2xl">{condition === "intact" ? "check_circle" : "radio_button_unchecked"}</span>
                                <span className="text-sm font-bold">سليمة</span>
                            </button>
                            <button
                                onClick={() => setCondition("damaged")}
                                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-colors ${
                                    condition === "damaged" 
                                        ? "bg-red-500/10 border-red-500 text-red-400" 
                                        : "bg-transparent border-slate-700 text-slate-400 hover:border-slate-600"
                                }`}
                            >
                                <span className="material-symbols-outlined text-2xl">warning</span>
                                <span className="text-sm font-bold">متضررة</span>
                            </button>
                        </div>

                        <span className="text-xs text-slate-400 block mb-2 text-right">ملاحظات إضافية</span>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="اكتب تفاصيل الضرر أو ملاحظات السلامة هنا..."
                            className="w-full h-24 bg-transparent border border-slate-700 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary resize-none"
                        ></textarea>
                    </div>
                </section>

                {/* Authorization and Signatures */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary text-xl">contract</span>
                        <h2 className="text-base font-bold text-white">التفويض والتوقيع</h2>
                    </div>

                    <div className="flex flex-col gap-6">
                        <SignaturePad 
                            title="توقيع السائق" 
                            placeholder="Driver Sign Here" 
                            onSign={setDriverSignature} 
                        />
                        <SignaturePad 
                            title="توقيع المستلم" 
                            placeholder="Receiver Sign Here" 
                            onSign={setReceiverSignature} 
                        />
                    </div>
                </section>
            </main>

            {/* Bottom Sticky Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-dark/95 backdrop-blur-md border-t border-slate-800 z-50">
                <button 
                    onClick={handleComplete}
                    className="w-full h-14 bg-primary text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    إنهاء وتسوية الدفع
                    <span className="material-symbols-outlined">verified</span>
                </button>
            </div>
        </div>
    );
}
