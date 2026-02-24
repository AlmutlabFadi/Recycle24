"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    type: "full-time" | "part-time" | "contract";
    salary: string;
    postedAt: string;
    logo: string;
    tags: string[];
}

export default function JobsPage() {
    const [activeTab, setActiveTab] = useState<"all" | "my-applications">("all");

    const jobs: Job[] = [
        {
            id: "1",
            title: "مشغل معدات ثقيلة",
            company: "شركة المتحدة للتدوير",
            location: "دمشق",
            type: "full-time",
            salary: "٥٠٠,٠٠٠ - ٨٠٠,٠٠٠ ل.س",
            postedAt: "منذ يومين",
            logo: "factory",
            tags: ["خبرة ٣+ سنوات", "رخصة قيادة"],
        },
        {
            id: "2",
            title: "فني لحام",
            company: "مصنع الأمل للصلب",
            location: "حلب",
            type: "full-time",
            salary: "٤٠٠,٠٠٠ - ٦٠٠,٠٠٠ ل.س",
            postedAt: "منذ ٣ أيام",
            logo: "precision_manufacturing",
            tags: ["شهادة لحام", "خبرة"],
        },
        {
            id: "3",
            title: "سائق شاحنة",
            company: "شركة النقل السريع",
            location: "حمص",
            type: "contract",
            salary: "حسب الرحلات",
            postedAt: "منذ أسبوع",
            logo: "local_shipping",
            tags: ["رخصة شاحنة", "خبرة ٢+ سنوات"],
        },
        {
            id: "4",
            title: "مراقب جودة",
            company: "مصنع البلاستيك الحديث",
            location: "اللاذقية",
            type: "full-time",
            salary: "٤٥٠,٠٠٠ - ٧٠٠,٠٠٠ ل.س",
            postedAt: "منذ ٥ أيام",
            logo: "verified",
            tags: ["شهادة جودة", "إنجليزية"],
        },
        {
            id: "5",
            title: "محاسب",
            company: "شركة الخردة الذهبية",
            location: "دمشق",
            type: "part-time",
            salary: "٣٠٠,٠٠٠ - ٤٥٠,٠٠٠ ل.س",
            postedAt: "منذ أسبوعين",
            logo: "calculate",
            tags: ["شهادة محاسبة", "Excel"],
        },
    ];

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "full-time": return "دوام كامل";
            case "part-time": return "دوام جزئي";
            case "contract": return "عقد";
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "full-time": return "bg-green-900/30 text-green-400";
            case "part-time": return "bg-blue-900/30 text-blue-400";
            case "contract": return "bg-yellow-900/30 text-yellow-400";
            default: return "bg-slate-700 text-slate-300";
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="مركز الوظائف" />

            <main className="flex-1 p-4 flex flex-col gap-6">
                <section className="grid grid-cols-2 gap-4">
                    <div className="bg-primary text-white p-4 rounded-xl shadow-lg flex flex-col justify-between h-28 relative overflow-hidden">
                        <span className="material-symbols-outlined text-white/80">work</span>
                        <div>
                            <p className="text-3xl font-bold tracking-tight">{jobs.length}</p>
                            <p className="text-sm font-medium text-white/90">وظيفة متاحة</p>
                        </div>
                    </div>
                    <div className="bg-surface-dark p-4 rounded-xl border border-slate-800 flex flex-col justify-between h-28">
                        <span className="material-symbols-outlined text-primary">business</span>
                        <div>
                            <p className="text-3xl font-bold text-white tracking-tight">٢٤</p>
                            <p className="text-sm font-medium text-slate-400">شركة مسجلة</p>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="bg-slate-800 p-1 rounded-lg flex">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all text-center ${
                                activeTab === "all"
                                    ? "bg-surface-dark text-primary shadow-sm"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            جميع الوظائف
                        </button>
                        <button
                            onClick={() => setActiveTab("my-applications")}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all text-center ${
                                activeTab === "my-applications"
                                    ? "bg-surface-dark text-primary shadow-sm"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            طلباتي
                        </button>
                    </div>
                </section>

                {activeTab === "all" && (
                    <>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">أحدث الوظائف</h3>
                            <button className="text-sm font-medium text-primary flex items-center gap-1">
                                عرض الكل
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                            </button>
                        </div>

                        <section className="flex flex-col gap-4">
                            {jobs.map((job) => (
                                <Link
                                    key={job.id}
                                    href={`/jobs/${job.id}`}
                                    className="bg-surface-dark rounded-xl p-4 border border-slate-800 transition-transform active:scale-[0.99]"
                                >
                                    <div className="flex gap-4">
                                        <div className="size-14 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-3xl text-slate-400">
                                                {job.logo}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-base font-bold text-white truncate">{job.title}</h4>
                                                <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(job.type)}`}>
                                                    {getTypeLabel(job.type)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-0.5">{job.company}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                    {job.location}
                                                </div>
                                                <div className="w-px h-3 bg-slate-700"></div>
                                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                    {job.postedAt}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                                        <div className="flex flex-wrap gap-2">
                                            {job.tags.slice(0, 2).map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="text-sm font-bold text-primary">{job.salary}</span>
                                    </div>
                                </Link>
                            ))}
                        </section>
                    </>
                )}

                {activeTab === "my-applications" && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">work_history</span>
                        <p className="text-slate-400 text-center">لم تقم بالتقديم على أي وظيفة بعد</p>
                        <button
                            onClick={() => setActiveTab("all")}
                            className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium"
                        >
                            تصفح الوظائف
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
