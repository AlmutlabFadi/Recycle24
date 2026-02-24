"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import Link from "next/link";

export default function UpcomingAuctionsPage() {
    // Simulated upcoming auctions data
    const upcomingAuctions = [
        {
            id: "AUC-501",
            title: "طن ألمنيوم نظيف - درجة أولى",
            category: "ألمنيوم",
            weight: "1000 كغ",
            location: "دمشق",
            startingBid: "12,500,000",
            scheduledStart: "2026-02-13T14:00:00", // Tomorrow at 2 PM
            duration: "48 ساعة",
            images: 6,
            inspectionAvailable: true
        },
        {
            id: "AUC-502",
            title: "5 طن حديد سكراب HMS",
            category: "حديد",
            weight: "5000 كغ",
            location: "حلب",
            startingBid: "18,000,000",
            scheduledStart: "2026-02-14T10:00:00",
            duration: "72 ساعة",
            images: 8,
            inspectionAvailable: true
        },
        {
            id: "AUC-503",
            title: "نحاس أسلاك ممزوج",
            category: "نحاس",
            weight: "250 كغ",
            location: "حمص",
            startingBid: "8,750,000",
            scheduledStart: "2026-02-13T16:30:00",
            duration: "24 ساعة",
            images: 4,
            inspectionAvailable: false
        }
    ];

    const getTimeUntilStart = (scheduledStart: string) => {
        const now = new Date();
        const start = new Date(scheduledStart);
        const diff = start.getTime() - now.getTime();

        if (diff <= 0) return "بدأ الآن";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `خلال ${days} يوم و ${hours} ساعة`;
        if (hours > 0) return `خلال ${hours} ساعة و ${minutes} دقيقة`;
        return `خلال ${minutes} دقيقة`;
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            "حديد": "text-red-500 bg-red-500/10",
            "نحاس": "text-orange-500 bg-orange-500/10",
            "ألمنيوم": "text-blue-500 bg-blue-500/10",
        };
        return colors[category] || "text-slate-500 bg-slate-500/10";
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="المزادات القادمة" />

            <main className="flex-1 p-4 pb-24">
                {/* Hero Banner */}
                <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl p-5 mb-6 border border-indigo-500/30">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-indigo-400 !text-[32px]">schedule</span>
                        <div>
                            <h2 className="font-bold text-white text-lg mb-1">مزادات مُعلن عنها مسبقاً</h2>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                يمكنك معاينة التفاصيل والصور الآن، وسيفتح باب المزايدة في الموعد المحدد.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                    <button className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold whitespace-nowrap shadow-lg shadow-primary/20">
                        الكل ({upcomingAuctions.length})
                    </button>
                    <button className="px-4 py-2 bg-surface-highlight text-slate-400 rounded-full text-xs font-bold whitespace-nowrap border border-slate-700">
                        اليوم
                    </button>
                    <button className="px-4 py-2 bg-surface-highlight text-slate-400 rounded-full text-xs font-bold whitespace-nowrap border border-slate-700">
                        غداً
                    </button>
                    <button className="px-4 py-2 bg-surface-highlight text-slate-400 rounded-full text-xs font-bold whitespace-nowrap border border-slate-700">
                        هذا الأسبوع
                    </button>
                </div>

                {/* Auctions List */}
                <div className="space-y-4">
                    {upcomingAuctions.map((auction) => (
                        <Link
                            key={auction.id}
                            href={`/auctions/${auction.id}/preview`}
                            className="block bg-surface-highlight rounded-xl p-4 border border-slate-700/50 hover:border-primary/50 transition group"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-bold text-white text-base group-hover:text-primary transition mb-1">
                                        {auction.title}
                                    </h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${getCategoryColor(auction.category)}`}>
                                            {auction.category}
                                        </span>
                                        <span className="text-xs text-slate-500">•</span>
                                        <span className="text-xs text-slate-400">{auction.weight}</span>
                                        <span className="text-xs text-slate-500">•</span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined !text-[14px]">location_on</span>
                                            {auction.location}
                                        </span>
                                    </div>
                                </div>
                                {auction.inspectionAvailable && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded whitespace-nowrap">
                                        <span className="material-symbols-outlined !text-[14px]">visibility</span>
                                        متاح للمعاينة
                                    </span>
                                )}
                            </div>

                            {/* Countdown */}
                            <div className="bg-bg-dark rounded-lg p-3 mb-3 border border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">يبدأ خلال</p>
                                        <p className="text-lg font-bold text-primary font-english">
                                            {getTimeUntilStart(auction.scheduledStart)}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs text-slate-500 mb-1">المدة</p>
                                        <p className="text-sm font-bold text-white">{auction.duration}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                                <div>
                                    <p className="text-xs text-slate-500 mb-0.5">السعر المبدئي</p>
                                    <p className="text-base font-bold text-white font-english">{auction.startingBid} ل.س</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[16px]">image</span>
                                        {auction.images} صور
                                    </span>
                                    <button className="flex items-center gap-1 text-primary font-bold">
                                        <span>معاينة</span>
                                        <span className="material-symbols-outlined !text-[16px]">chevron_left</span>
                                    </button>
                                </div>
                            </div>

                            {/* Reminder Button */}
                            <button className="w-full mt-3 py-2.5 bg-indigo-600/20 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/30 hover:bg-indigo-600/30 transition flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined !text-[18px]">notifications</span>
                                تذكيري عند البدء
                            </button>
                        </Link>
                    ))}
                </div>

                {/* Empty State (hidden when there are auctions) */}
                {upcomingAuctions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="material-symbols-outlined text-slate-600 !text-[64px] mb-4">event_busy</span>
                        <h3 className="text-lg font-bold text-white mb-2">لا توجد مزادات مجدولة</h3>
                        <p className="text-sm text-slate-400 max-w-xs">
                            لا توجد مزادات معلن عنها مسبقاً حالياً. تحقق من المزادات المباشرة.
                        </p>
                        <Link href="/auctions" className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold">
                            تصفح المزادات المباشرة
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
