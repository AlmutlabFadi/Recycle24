"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";
import SignaturePad from "@/components/SignaturePad";

export default function ReceiptAndDeliveryPage() {
    const [securedGoods, setSecuredGoods] = useState(true);
    const [matchesInvoice, setMatchesInvoice] = useState(false);
    const [packagingIntact, setPackagingIntact] = useState(true);

    const [senderSignature, setSenderSignature] = useState("");
    const [driverSignature, setDriverSignature] = useState("");

    const handleConfirm = () => {
        // Implement confirm logic
        console.log("Delivery Confirmed", {
            securedGoods,
            matchesInvoice,
            packagingIntact,
            hasSenderSignature: !!senderSignature,
            hasDriverSignature: !!driverSignature
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic text-white relative pb-24">
            <HeaderWithBack title="استلام وتسليم" />

            {/* Step Indicators */}
            <div className="flex justify-center items-center gap-2 py-4 bg-background-dark/95 backdrop-blur z-10 sticky top-16">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                <span className="w-6 h-1.5 rounded-full bg-primary"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
            </div>

            <main className="flex-1 px-4 flex flex-col gap-6 pt-2">
                
                {/* تفاصيل الحمولة */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary text-xl">inventory_2</span>
                        <h2 className="text-base font-bold text-white">تفاصيل الحمولة</h2>
                        <span className="mr-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md font-mono">معرف: 8821B#</span>
                    </div>

                    <div className="bg-transparent rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <div>
                                <span className="text-xs text-slate-400 block mb-1">المادة</span>
                                <span className="text-sm font-bold text-white">نحاس خردة (أسلاك)</span>
                            </div>
                            <div className="text-left">
                                <span className="text-xs text-slate-400 block mb-1">الوزن</span>
                                <span className="text-base font-bold text-primary">1,250 kg</span>
                            </div>
                        </div>
                        <div className="p-4 flex justify-between items-center bg-slate-800/10">
                            <div>
                                <span className="text-xs text-slate-400 block mb-1">المادة</span>
                                <span className="text-sm font-bold text-white">سبائك ألمنيوم</span>
                            </div>
                            <div className="text-left">
                                <span className="text-xs text-slate-400 block mb-1">الوزن</span>
                                <span className="text-base font-bold text-primary">500 kg</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* الوثائق والفواتير */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary text-xl">description</span>
                        <h2 className="text-base font-bold text-white">الوثائق والفواتير</h2>
                    </div>

                    <button className="w-full flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-700 bg-transparent hover:bg-slate-800/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-2xl">photo_camera</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-sm font-bold text-white mb-1">التقاط صورة الفاتورة</span>
                            <span className="text-xs text-slate-400">اضغط هنا لفتح الكاميرا أو رفع ملف</span>
                        </div>
                    </button>
                </section>

                {/* فحص الحالة */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary text-xl">fact_check</span>
                        <h2 className="text-base font-bold text-white">فحص الحالة</h2>
                    </div>

                    <div className="bg-transparent rounded-2xl border border-slate-700 overflow-hidden divide-y divide-slate-800">
                        {/* Toggle 1 */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex-1 pr-4">
                                <h3 className="text-sm font-bold text-white mb-1">البضائع مؤمنة ومربوطة</h3>
                                <p className="text-xs text-slate-400">تم التأكد من تثبيت الحمولة بشكل آمن</p>
                            </div>
                            <button 
                                onClick={() => setSecuredGoods(!securedGoods)}
                                className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors relative ${securedGoods ? "bg-primary" : "bg-slate-600"}`}
                            >
                                <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute ${securedGoods ? "left-1" : "right-1"}`} />
                            </button>
                        </div>

                        {/* Toggle 2 */}
                        <div className="p-4 flex items-center justify-between bg-slate-800/10">
                            <div className="flex-1 pr-4">
                                <h3 className="text-sm font-bold text-white mb-1">مطابق للفاتورة</h3>
                                <p className="text-xs text-slate-400">الكميات والنوعية مطابقة للمستندات</p>
                            </div>
                            <button 
                                onClick={() => setMatchesInvoice(!matchesInvoice)}
                                className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors relative ${matchesInvoice ? "bg-primary" : "bg-slate-600"}`}
                            >
                                <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute ${matchesInvoice ? "left-1" : "right-1"}`} />
                            </button>
                        </div>

                        {/* Toggle 3 */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex-1 pr-4">
                                <h3 className="text-sm font-bold text-white mb-1">التعبئة سليمة</h3>
                                <p className="text-xs text-slate-400">لا يوجد تلف ظاهر في التغليف</p>
                            </div>
                            <button 
                                onClick={() => setPackagingIntact(!packagingIntact)}
                                className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors relative ${packagingIntact ? "bg-primary" : "bg-slate-600"}`}
                            >
                                <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute ${packagingIntact ? "left-1" : "right-1"}`} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* التوقيعات الإلكترونية */}
                <section className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary text-xl">draw</span>
                        <h2 className="text-base font-bold text-white">التوقيعات الإلكترونية</h2>
                    </div>

                    <div className="flex flex-col gap-5">
                        <SignaturePad 
                            title="توقيع المرسل (أنت)" 
                            onSign={setSenderSignature} 
                        />
                        <SignaturePad 
                            title="توقيع السائق" 
                            onSign={setDriverSignature} 
                        />
                    </div>
                </section>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pb-4">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span>جميع التوقيعات مشفرة وموثقة زمنياً</span>
                </div>

            </main>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-dark/95 backdrop-blur-md border-t border-slate-800 z-50">
                <button 
                    onClick={handleConfirm}
                    className="w-full h-14 bg-primary text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    تأكيد التسليم وإنشاء الإيصال
                    <span className="material-symbols-outlined">send</span>
                </button>
            </div>
        </div>
    );
}
