"use client";

import HeaderWithBack from "@/components/HeaderWithBack";

export default function EconomicCalendarPage() {
    const events = [
        {
            time: "10:30 AM",
            date: "اليوم",
            title: "مؤشر أسعار المستهلكين (CPI) - أمريكا",
            impact: "high",
            forecast: "3.1%",
            previous: "3.4%"
        },
        {
            time: "02:00 PM",
            date: "اليوم",
            title: "قرار الفائدة الفيدرالي",
            impact: "high",
            forecast: "5.50%",
            previous: "5.50%"
        },
        {
            time: "09:00 AM",
            date: "غداً",
            title: "بيانات الإنتاج الصناعي - الصين",
            impact: "medium",
            forecast: "4.5%",
            previous: "6.8%"
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="المفكرة الاقتصادية" />

            <main className="flex-1 p-4 pb-24">
                <div className="space-y-6">
                    {events.map((event, i) => (
                        <div key={i} className="flex gap-4 relative">
                            {/* Timeline Line */}
                            {i !== events.length - 1 && (
                                <div className="absolute top-8 right-[19px] bottom-[-24px] w-[2px] bg-slate-800"></div>
                            )}

                            {/* Date/Time Column */}
                            <div className="flex flex-col items-center shrink-0 w-10 pt-1">
                                <div className={`size-3 rounded-full outline outline-4 outline-bg-dark z-10 ${event.impact === 'high' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                                <span className="text-[10px] text-slate-500 mt-2 font-english">{event.time}</span>
                            </div>

                            {/* Card */}
                            <div className="flex-1 bg-surface-highlight border border-slate-700/50 rounded-xl p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-slate-400 bg-slate-700/30 px-2 py-0.5 rounded">{event.date}</span>
                                    {event.impact === 'high' && (
                                        <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined !text-[14px]">warning</span>
                                            تأثير عالي
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-white text-sm mb-3">{event.title}</h3>

                                <div className="grid grid-cols-2 gap-2 bg-bg-dark/50 rounded-lg p-2">
                                    <div className="text-center border-l border-slate-700/50 pl-2">
                                        <span className="text-[10px] text-slate-500 block">المتوقع</span>
                                        <span className="text-sm font-bold font-english text-white">{event.forecast}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px] text-slate-500 block">السابق</span>
                                        <span className="text-sm font-bold font-english text-slate-400">{event.previous}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
