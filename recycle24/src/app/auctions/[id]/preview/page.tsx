"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useState } from "react";

export default function AuctionPreviewPage() {
    const [selectedImage, setSelectedImage] = useState(0);
    const [inspectionRequested, setInspectionRequested] = useState(false);

    // Simulated auction data
    const auction = {
        id: "AUC-501",
        title: "طن ألمنيوم نظيف - درجة أولى",
        seller: "أحمد التجاري",
        sellerRating: 4.8,
        category: "ألمنيوم",
        weight: "1000 كغ",
        location: "دمشق - منطقة القابون",
        startingBid: "12,500,000",
        buyNowPrice: "15,000,000",
        scheduledStart: "2026-02-13T14:00:00",
        duration: "48 ساعة",
        qualityRating: "ممتاز",
        description: "ألمنيوم نظيف من مصدر صناعي موثوق. تم فرزه وتنظيفه. لا يحتوي على شوائب. جاهز للشحن الفوري.",
        inspectionLocation: "مستودع الرحمة - شارع بغداد - دمشق",
        inspectionHours: "السبت - الخميس: 9 صباحاً - 5 مساءً",
        inspectionNotes: "يُرجى الاتصال قبل الزيارة بـ 24 ساعة. متوفر مواقف سيارات.",
        images: [
            "https://via.placeholder.com/800x600/334155/ffffff?text=Stack+View",
            "https://via.placeholder.com/800x600/334155/ffffff?text=Close+Up",
            "https://via.placeholder.com/800x600/334155/ffffff?text=Quality+Check",
            "https://via.placeholder.com/800x600/334155/ffffff?text=Weight+Scale",
            "https://via.placeholder.com/800x600/334155/ffffff?text=Loading+Area",
            "https://via.placeholder.com/800x600/334155/ffffff?text=Documentation"
        ]
    };

    const getTimeUntilStart = () => {
        const now = new Date();
        const start = new Date(auction.scheduledStart);
        const diff = start.getTime() - now.getTime();

        if (diff <= 0) return "بدأ الآن";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `خلال ${days} يوم و ${hours} ساعة`;
        return `خلال ${hours} ساعة`;
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="معاينة المزاد" />

            <main className="flex-1 pb-24 overflow-y-auto">
                {/* Image Gallery */}
                <div className="relative">
                    <div className="aspect-[4/3] bg-slate-800 overflow-hidden">
                        <img
                            src={auction.images[selectedImage]}
                            alt={`صورة ${selectedImage + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[16px]">schedule</span>
                        يبدأ {getTimeUntilStart()}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold">
                        {selectedImage + 1} / {auction.images.length}
                    </div>
                </div>

                {/* Thumbnails */}
                <div className="flex gap-2 p-3 overflow-x-auto bg-surface-dark">
                    {auction.images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedImage(idx)}
                            className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${selectedImage === idx ? "border-primary" : "border-slate-700"
                                }`}
                        >
                            <img src={img} alt={`ثمنيل ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Title & Seller */}
                    <div>
                        <h1 className="text-xl font-bold text-white mb-2">{auction.title}</h1>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary !text-[18px]">person</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{auction.seller}</p>
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-yellow-500 !text-[14px] filled">star</span>
                                        <span className="text-xs text-slate-400 font-english">{auction.sellerRating}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface-highlight rounded-xl p-3 border border-slate-700/50">
                            <p className="text-xs text-slate-500 mb-1">السعر المبدئي</p>
                            <p className="text-lg font-bold text-white font-english">{auction.startingBid} ل.س</p>
                        </div>
                        <div className="bg-surface-highlight rounded-xl p-3 border border-slate-700/50">
                            <p className="text-xs text-slate-500 mb-1">الشراء الفوري</p>
                            <p className="text-lg font-bold text-green-500 font-english">{auction.buyNowPrice} ل.س</p>
                        </div>
                    </div>

                    {/* Quality Rating */}
                    <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-green-500">verified</span>
                            <h3 className="font-bold text-white">تقييم الجودة</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: "90%" }}></div>
                            </div>
                            <span className="text-sm font-bold text-green-500">{auction.qualityRating}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">description</span>
                            وصف المادة
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">{auction.description}</p>
                    </div>

                    {/* Specs */}
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                        <h3 className="font-bold text-white mb-3">المواصفات</h3>
                        <div className="space-y-2">
                            {[
                                { label: "النوع", value: auction.category, icon: "category" },
                                { label: "الوزن", value: auction.weight, icon: "scale" },
                                { label: "الموقع", value: auction.location, icon: "location_on" },
                                { label: "مدة المزاد", value: auction.duration, icon: "schedule" }
                            ].map((spec, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <span className="material-symbols-outlined !text-[18px]">{spec.icon}</span>
                                        <span className="text-sm">{spec.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-white">{spec.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Inspection Details */}
                    <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/30">
                        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-400">visibility</span>
                            معلومات المعاينة
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-slate-500 text-xs mb-1">العنوان</p>
                                <p className="text-white">{auction.inspectionLocation}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs mb-1">أوقات الدوام</p>
                                <p className="text-white">{auction.inspectionHours}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs mb-1">ملاحظات</p>
                                <p className="text-slate-300">{auction.inspectionNotes}</p>
                            </div>
                        </div>

                        {!inspectionRequested ? (
                            <button
                                onClick={() => setInspectionRequested(true)}
                                className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">event</span>
                                طلب موعد معاينة
                            </button>
                        ) : (
                            <div className="mt-4 p-3 bg-green-500/10 rounded-xl border border-green-500/30 text-center">
                                <span className="material-symbols-outlined text-green-500 !text-[24px]">check_circle</span>
                                <p className="text-sm text-green-400 font-bold mt-1">تم إرسال طلبك. سيتم التواصل معك قريباً.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-surface-dark border-t border-slate-800 p-4 flex gap-3">
                <button className="flex-1 py-4 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">notifications</span>
                    تذكيري
                </button>
                <button className="flex-1 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20">
                    مشاركة المزاد
                </button>
            </div>
        </div>
    );
}
