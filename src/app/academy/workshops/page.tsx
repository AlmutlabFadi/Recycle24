"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

const workshops = [
    {
        id: 1,
        title: "ورشة فحص جودة النحاس",
        date: "2026-02-25",
        time: "14:00",
        duration: "ساعتين",
        instructor: "م. أحمد الخالد",
        type: "live",
        status: "upcoming",
        registered: 45,
        maxCapacity: 50,
        price: 0,
        image: "/workshop1.jpg",
    },
    {
        id: 2,
        title: "أساليب التفاوض في الصفقات",
        date: "2026-02-20",
        time: "10:00",
        duration: "3 ساعات",
        instructor: "د. سارة الحسن",
        type: "live",
        status: "live",
        registered: 120,
        maxCapacity: 200,
        price: 15000,
        image: "/workshop2.jpg",
    },
    {
        id: 3,
        title: "تشغيل المزادات الاحترافية",
        date: "2026-02-15",
        time: "16:00",
        duration: "ساعتين",
        instructor: "م. خالد العمر",
        type: "recorded",
        status: "completed",
        registered: 89,
        maxCapacity: 100,
        price: 10000,
        image: "/workshop3.jpg",
    },
    {
        id: 4,
        title: "إجراءات السلامة المتقدمة",
        date: "2026-02-10",
        time: "11:00",
        duration: "4 ساعات",
        instructor: "م. ليلى سالم",
        type: "recorded",
        status: "completed",
        registered: 156,
        maxCapacity: 200,
        price: 0,
        image: "/workshop4.jpg",
    },
];

const filters = [
    { id: "all", label: "الكل" },
    { id: "upcoming", label: "قادمة" },
    { id: "live", label: "مباشرة" },
    { id: "completed", label: "مسجلة" },
];

export default function AcademyWorkshopsPage() {
    const [activeFilter, setActiveFilter] = useState("all");

    const filteredWorkshops = activeFilter === "all"
        ? workshops
        : workshops.filter(w => w.status === activeFilter);

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="الورش والندوات" />

            {/* Header */}
            <div className="px-4 py-4 bg-surface-dark border-b border-slate-800">
                <h1 className="text-xl font-bold text-white mb-2">ورش تدريبية مباشرة</h1>
                <p className="text-slate-400 text-sm">تعلم من الخبراء في ورش تفاعلية</p>
            </div>

            {/* Filters */}
            <div className="px-4 py-4">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                activeFilter === filter.id
                                    ? "bg-primary text-white"
                                    : "bg-surface-highlight text-slate-300 border border-slate-700"
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Workshops List */}
            <main className="flex-1 px-4 pb-24">
                <div className="space-y-4">
                    {filteredWorkshops.map((workshop) => (
                        <div
                            key={workshop.id}
                            className="bg-surface-highlight rounded-xl border border-slate-700 overflow-hidden"
                        >
                            {/* Header Image */}
                            <div className="h-40 bg-slate-800 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-5xl text-slate-600">
                                        {workshop.type === "live" ? "videocam" : "play_circle"}
                                    </span>
                                </div>
                                
                                {/* Status Badge */}
                                <div className="absolute top-3 right-3">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                                        workshop.status === "live" ? "bg-red-500 text-white" :
                                        workshop.status === "upcoming" ? "bg-primary text-white" :
                                        "bg-slate-600 text-white"
                                    }`}>
                                        {workshop.status === "live" && (
                                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                                        )}
                                        {workshop.status === "live" ? "مباشر الآن" :
                                         workshop.status === "upcoming" ? "قادم" : "مسجل"}
                                    </span>
                                </div>

                                {/* Type Badge */}
                                <div className="absolute top-3 left-3">
                                    <span className="bg-black/50 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        {workshop.type === "live" ? "بث مباشر" : "مسجل"}
                                    </span>
                                </div>

                                {/* Price Badge */}
                                <div className="absolute bottom-3 right-3">
                                    <span className={`font-bold px-3 py-1 rounded-full ${
                                        workshop.price === 0 
                                            ? "bg-green-500 text-white" 
                                            : "bg-primary text-white"
                                    }`}>
                                        {workshop.price === 0 ? "مجاني" : `${workshop.price.toLocaleString()} ل.س`}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-bold text-white mb-2">{workshop.title}</h3>
                                
                                {/* Instructor */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <span className="text-primary text-sm font-bold">
                                            {workshop.instructor.charAt(0)}
                                        </span>
                                    </div>
                                    <span className="text-slate-300 text-sm">{workshop.instructor}</span>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-2 text-sm text-slate-400 mb-4">
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[16px]">calendar_today</span>
                                        {workshop.date}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[16px]">schedule</span>
                                        {workshop.time}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[16px]">timer</span>
                                        {workshop.duration}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[16px]">people</span>
                                        {workshop.registered}/{workshop.maxCapacity}
                                    </div>
                                </div>

                                {/* Capacity Bar */}
                                <div className="mb-4">
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${(workshop.registered / workshop.maxCapacity) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {workshop.maxCapacity - workshop.registered} مقاعد متبقية
                                    </p>
                                </div>

                                {/* Action Button */}
                                {workshop.status === "live" ? (
                                    <Link
                                        href={`/academy/workshops/${workshop.id}/live`}
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">play_arrow</span>
                                        دخول البث المباشر
                                    </Link>
                                ) : workshop.status === "upcoming" ? (
                                    <button className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors">
                                        <span className="material-symbols-outlined">person_add</span>
                                        التسجيل الآن
                                    </button>
                                ) : (
                                    <Link
                                        href={`/academy/workshops/${workshop.id}`}
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-surface-dark text-white font-bold border border-slate-700 hover:border-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined">play_circle</span>
                                        مشاهدة التسجيل
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredWorkshops.length === 0 && (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">event_busy</span>
                        <p className="text-slate-400">لا توجد ورش مطابقة</p>
                    </div>
                )}
            </main>
        </div>
    );
}
