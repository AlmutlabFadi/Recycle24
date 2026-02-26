"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Consultant {
    id: string;
    name: string;
    title: string;
    rating: number;
    reviews: number;
    hourlyRate: number;
    specialties: string[];
    avatar: string;
    isAvailable: boolean;
}

interface Consultation {
    id: string;
    consultantId: string;
    consultantName: string;
    topic: string;
    date: string;
    time: string;
    status: "upcoming" | "completed" | "cancelled";
}

interface KnowledgeItem {
    id: string;
    type: string;
    title: string;
    summary?: string | null;
    content?: string | null;
    coverImageUrl?: string | null;
    createdAt: string;
}

export default function ConsultationsPage() {
    const [activeTab, setActiveTab] = useState<"consultants" | "my-consultations">("consultants");
    const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
    const [isKnowledgeLoading, setIsKnowledgeLoading] = useState(true);

    useEffect(() => {
        const fetchKnowledge = async () => {
            try {
                const response = await fetch("/api/knowledge?center=CONSULTATIONS&status=PUBLISHED&limit=12", {
                    cache: "no-store",
                });
                const data = await response.json();
                if (response.ok) {
                    setKnowledgeItems(data.items || []);
                }
            } finally {
                setIsKnowledgeLoading(false);
            }
        };

        fetchKnowledge();
    }, []);

    const insights = useMemo(() => knowledgeItems.filter((item) => item.type === "ARTICLE" || item.type === "INSTRUCTION"), [knowledgeItems]);

    const consultants: Consultant[] = [
        {
            id: "1",
            name: "م. خالد العمري",
            title: "خبير سوق الخردة والمواد",
            rating: 4.9,
            reviews: 127,
            hourlyRate: 150000,
            specialties: ["تقييم المواد", "تحليل السوق", "التسعير"],
            avatar: "person",
            isAvailable: true,
        },
        {
            id: "2",
            name: "د. نادية حسن",
            title: "استشارية بيئية",
            rating: 4.8,
            reviews: 89,
            hourlyRate: 200000,
            specialties: ["الامتثال البيئي", "التراخيص", "السلامة"],
            avatar: "person",
            isAvailable: false,
        },
        {
            id: "3",
            name: "أ. فريد محمود",
            title: "مستشار مالي وضريبي",
            rating: 4.7,
            reviews: 64,
            hourlyRate: 180000,
            specialties: ["التخطيط المالي", "الضرائب", "الاستثمار"],
            avatar: "person",
            isAvailable: true,
        },
    ];

    const myConsultations: Consultation[] = [
        {
            id: "1",
            consultantId: "1",
            consultantName: "م. خالد العمري",
            topic: "تقييم مخزون النحاس",
            date: "15 فبراير 2026",
            time: "10:00 ص",
            status: "upcoming",
        },
        {
            id: "2",
            consultantId: "3",
            consultantName: "أ. فريد محمود",
            topic: "التخطيط الضريبي للسنة",
            date: "10 فبراير 2026",
            time: "2:00 م",
            status: "completed",
        },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "upcoming":
                return { label: "قادمة", color: "bg-blue-900/30 text-blue-400" };
            case "completed":
                return { label: "مكتملة", color: "bg-green-900/30 text-green-400" };
            case "cancelled":
                return { label: "ملغاة", color: "bg-red-900/30 text-red-400" };
            default:
                return { label: status, color: "bg-slate-700 text-slate-300" };
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="مركز الاستشارات" />

            <main className="flex-1 p-4 flex flex-col gap-6">
                <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl p-4 border border-primary/30">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                        <div>
                            <h2 className="text-base font-bold text-white">احصل على استشارة خبير</h2>
                            <p className="text-xs text-slate-300 mt-1">تحدث مع خبراء متخصصين في مجال الخردة</p>
                        </div>
                    </div>
                </div>

                <section className="bg-slate-900/70 rounded-xl border border-slate-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-white">مكتبة الاستشارات</h3>
                        <span className="text-xs text-slate-400">مواد إرشادية رسمية</span>
                    </div>
                    {isKnowledgeLoading ? (
                        <div className="text-center text-xs text-slate-500 py-6">جار التحميل...</div>
                    ) : insights.length === 0 ? (
                        <div className="text-center text-xs text-slate-500 py-6">لا يوجد محتوى منشور حالياً.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {insights.slice(0, 4).map((item) => (
                                <div key={item.id} className="bg-surface-dark rounded-xl border border-slate-800 overflow-hidden">
                                    {item.coverImageUrl ? (
                                        <img src={item.coverImageUrl} alt={item.title} className="w-full h-28 object-cover" />
                                    ) : (
                                        <div className="h-28 bg-gradient-to-r from-slate-800 to-slate-900"></div>
                                    )}
                                    <div className="p-3">
                                        <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                                        <p className="text-xs text-slate-400 line-clamp-2">
                                            {item.summary || item.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <div className="bg-slate-800 p-1 rounded-lg flex">
                        <button
                            onClick={() => setActiveTab("consultants")}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${
                                activeTab === "consultants"
                                    ? "bg-surface-dark text-primary shadow-sm"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            الخبراء
                        </button>
                        <button
                            onClick={() => setActiveTab("my-consultations")}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${
                                activeTab === "my-consultations"
                                    ? "bg-surface-dark text-primary shadow-sm"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            استشاراتي
                        </button>
                    </div>
                </section>

                {activeTab === "consultants" && (
                    <section className="flex flex-col gap-4">
                        {consultants.map((consultant) => (
                            <div
                                key={consultant.id}
                                className="bg-surface-dark rounded-xl p-4 border border-slate-800"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-2xl text-slate-400">
                                                {consultant.avatar}
                                            </span>
                                        </div>
                                        {consultant.isAvailable && (
                                            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-surface-dark"></span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-base font-bold text-white">{consultant.name}</h4>
                                            {consultant.isAvailable && (
                                                <span className="text-xs text-green-400 bg-green-900/20 px-2 py-0.5 rounded">
                                                    متصل الآن
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 mt-0.5">{consultant.title}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-yellow-400 text-sm">star</span>
                                                <span className="text-sm font-medium text-white">{consultant.rating}</span>
                                            </div>
                                            <span className="text-xs text-slate-500">({consultant.reviews} تقييم)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {consultant.specialties.map((specialty, idx) => (
                                        <span
                                            key={idx}
                                            className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300"
                                        >
                                            {specialty}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700">
                                    <div>
                                        <span className="text-xs text-slate-400">الساعة</span>
                                        <p className="text-lg font-bold text-primary">{consultant.hourlyRate.toLocaleString()} ل.س</p>
                                    </div>
                                    <Link
                                        href={`/consultations/book?consultant=${consultant.id}`}
                                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600"
                                    >
                                        حجز موعد
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {activeTab === "my-consultations" && (
                    <section className="flex flex-col gap-4">
                        {myConsultations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">event_busy</span>
                                <p className="text-slate-400">لا توجد استشارات مجدولة</p>
                                <button
                                    onClick={() => setActiveTab("consultants")}
                                    className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium"
                                >
                                    تصفح الخبراء
                                </button>
                            </div>
                        ) : (
                            myConsultations.map((consultation) => (
                                <div
                                    key={consultation.id}
                                    className="bg-surface-dark rounded-xl p-4 border border-slate-800"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-base font-bold text-white">{consultation.consultantName}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(consultation.status).color}`}>
                                            {getStatusBadge(consultation.status).label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-300 mb-2">{consultation.topic}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                                            {consultation.date}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                            {consultation.time}
                                        </div>
                                    </div>
                                    {consultation.status === "upcoming" && (
                                        <div className="flex gap-2 mt-4">
                                            <button className="flex-1 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium">
                                                إعادة جدولة
                                            </button>
                                            <button className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium">
                                                انضمام
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}
