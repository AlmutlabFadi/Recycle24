"use client";

import { useState } from "react";

import HeaderWithBack from "@/components/HeaderWithBack";

interface JobDetail {
    id: string;
    title: string;
    company: string;
    companyLogo: string;
    location: string;
    type: "full-time" | "part-time" | "contract";
    salary: { min: number; max: number };
    postedAt: string;
    description: string;
    requirements: string[];
    benefits: string[];
    companyInfo: {
        employees: string;
        founded: string;
        industry: string;
    };
}

export default function JobDetailPage() {
    const [hasApplied, setHasApplied] = useState(false);

    const job: JobDetail = {
        id: "1",
        title: "مشغل معدات ثقيلة",
        company: "شركة المتحدة للتدوير",
        companyLogo: "factory",
        location: "دمشق - المنطقة الصناعية",
        type: "full-time",
        salary: { min: 500000, max: 800000 },
        postedAt: "منذ يومين",
        description: `نحن نبحث عن مشغل معدات ثقيلة ذو خبرة للانضمام إلى فريقنا في شركة المتحدة للتدوير. ستعمل على تشغيل مجموعة متنوعة من المعدات الثقيلة المستخدمة في عمليات فرز ومعالجة الخردة.

البيئة العمل ديناميكية وسريعة الخطى، ونحن نبحث عن شخص ما يتمتع بمهارات تشغيل ممتازة والقدرة على العمل بشكل آمن وفعال.`,
        requirements: [
            "رخصة قيادة فئات ثقيلة سارية المفعول",
            "3+ سنوات خبرة في تشغيل المعدات الثقيلة",
            "معرفة ببروتوكولات السلامة المهنية",
            "القدرة على العمل في ورديات",
            "إتقان اللغة العربية، الإنجليزية ميزة",
        ],
        benefits: [
            "راتب تنافسي مع بدل سكن",
            "تأمين صحي شامل للعامل والعائلة",
            "تدريب مستمر وتطوير مهني",
            "بيئة عمل آمنة وداعمة",
            "إجازة سنوية مدفوعة 21 يوم",
        ],
        companyInfo: {
            employees: "50-100 موظف",
            founded: "2010",
            industry: "إعادة التدوير والصناعة",
        },
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "full-time": return "دوام كامل";
            case "part-time": return "دوام جزئي";
            case "contract": return "عقد";
            default: return type;
        }
    };

    const formatSalary = (min: number, max: number) => {
        return `${min.toLocaleString("ar-SA")} - ${max.toLocaleString("ar-SA")}`;
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="تفاصيل الوظيفة" />

            <main className="flex-1 p-4 flex flex-col gap-6 pb-24">
                <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-3xl text-slate-400">
                                {job.companyLogo}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white">{job.title}</h1>
                            <p className="text-slate-400 mt-1">{job.company}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="px-2 py-1 rounded bg-green-900/30 text-green-400 text-xs">
                                    {getTypeLabel(job.type)}
                                </span>
                                <span className="text-xs text-slate-400">{job.postedAt}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                        <span className="material-symbols-outlined text-primary text-xl mb-2">payments</span>
                        <p className="text-xs text-slate-400">الراتب</p>
                        <p className="text-sm font-bold text-white">{formatSalary(job.salary.min, job.salary.max)} ل.س</p>
                    </div>
                    <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                        <span className="material-symbols-outlined text-primary text-xl mb-2">location_on</span>
                        <p className="text-xs text-slate-400">الموقع</p>
                        <p className="text-sm font-bold text-white">{job.location}</p>
                    </div>
                </div>

                <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                    <h3 className="text-base font-bold text-white mb-3">وصف الوظيفة</h3>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                        {job.description}
                    </p>
                </div>

                <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                    <h3 className="text-base font-bold text-white mb-3">المتطلبات</h3>
                    <ul className="space-y-2">
                        {job.requirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span>
                                <span className="text-sm text-slate-300">{req}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                    <h3 className="text-base font-bold text-white mb-3">المزايا</h3>
                    <ul className="space-y-2">
                        {job.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-green-400 text-lg mt-0.5">star</span>
                                <span className="text-sm text-slate-300">{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-surface-dark rounded-xl p-4 border border-slate-800">
                    <h3 className="text-base font-bold text-white mb-3">عن الشركة</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <span className="material-symbols-outlined text-slate-400 text-xl">groups</span>
                            <p className="text-xs text-slate-400 mt-1">الموظفون</p>
                            <p className="text-sm font-medium text-white">{job.companyInfo.employees}</p>
                        </div>
                        <div className="text-center">
                            <span className="material-symbols-outlined text-slate-400 text-xl">calendar_today</span>
                            <p className="text-xs text-slate-400 mt-1">تأسست</p>
                            <p className="text-sm font-medium text-white">{job.companyInfo.founded}</p>
                        </div>
                        <div className="text-center">
                            <span className="material-symbols-outlined text-slate-400 text-xl">business</span>
                            <p className="text-xs text-slate-400 mt-1">القطاع</p>
                            <p className="text-sm font-medium text-white">{job.companyInfo.industry}</p>
                        </div>
                    </div>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-dark/95 backdrop-blur border-t border-slate-800 z-40">
                <div className="flex gap-3">
                    <button className="flex-1 h-14 rounded-xl bg-slate-800 text-white font-medium flex items-center justify-center gap-2 hover:bg-slate-700">
                        <span className="material-symbols-outlined">bookmark_add</span>
                        حفظ
                    </button>
                    <button
                        onClick={() => setHasApplied(true)}
                        className={`flex-1 h-14 rounded-xl font-medium flex items-center justify-center gap-2 ${
                            hasApplied
                                ? "bg-green-600 text-white"
                                : "bg-primary text-white hover:bg-blue-600"
                        }`}
                    >
                        {hasApplied ? (
                            <>
                                <span className="material-symbols-outlined">check</span>
                                تم التقديم
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">send</span>
                                تقديم الآن
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
