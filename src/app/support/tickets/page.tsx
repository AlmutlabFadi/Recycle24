"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Ticket {
    id: string;
    subject: string;
    category: string;
    status: "open" | "pending" | "resolved" | "closed";
    priority: "low" | "medium" | "high";
    createdAt: string;
    lastUpdate: string;
    messages: number;
}

const mockTickets: Ticket[] = [
    {
        id: "TKT-001",
        subject: "مشكلة في سحب الرصيد",
        category: "المدفوعات",
        status: "open",
        priority: "high",
        createdAt: "2025-02-20",
        lastUpdate: "منذ ساعة",
        messages: 3,
    },
    {
        id: "TKT-002",
        subject: "استفسار عن رسوم المنصة",
        category: "عام",
        status: "resolved",
        priority: "low",
        createdAt: "2025-02-18",
        lastUpdate: "منذ يومين",
        messages: 5,
    },
];

const statusColors = {
    open: "bg-green-500/20 text-green-400 border-green-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    resolved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    closed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const statusLabels = {
    open: "مفتوح",
    pending: "قيد المعالجة",
    resolved: "تم الحل",
    closed: "مغلق",
};

const priorityColors = {
    low: "text-slate-400",
    medium: "text-yellow-400",
    high: "text-red-400",
};

export default function SupportTicketsPage() {
    const [tickets] = useState<Ticket[]>(mockTickets);
    const [filter, setFilter] = useState<string>("all");
    const [showNewTicket, setShowNewTicket] = useState(false);

    const filteredTickets = tickets.filter((ticket) => {
        if (filter === "all") return true;
        return ticket.status === filter;
    });

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="تذاكر الدعم" />

            <main className="flex-1 p-4 flex flex-col gap-4 pb-24">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {["all", "open", "pending", "resolved", "closed"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                                filter === status
                                    ? "bg-primary text-white"
                                    : "bg-surface-dark text-slate-400 border border-slate-700"
                            }`}
                        >
                            {status === "all" ? "الكل" : statusLabels[status as keyof typeof statusLabels]}
                        </button>
                    ))}
                </div>

                {filteredTickets.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">confirmation_number</span>
                        <h3 className="text-lg font-bold text-white mb-2">لا توجد تذاكر</h3>
                        <p className="text-slate-400 text-sm mb-4">لم تقم بإنشاء أي تذاكر دعم بعد</p>
                        <button
                            onClick={() => setShowNewTicket(true)}
                            className="px-6 py-3 rounded-xl bg-primary text-white font-bold"
                        >
                            إنشاء تذكرة جديدة
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredTickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                href={`/support/tickets/${ticket.id}`}
                                className="bg-surface-dark rounded-xl p-4 border border-slate-800 hover:border-primary/50 transition"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs text-slate-500 font-mono">{ticket.id}</span>
                                        <h3 className="text-white font-bold mt-1">{ticket.subject}</h3>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[ticket.status]}`}>
                                        {statusLabels[ticket.status]}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-3">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">folder</span>
                                        {ticket.category}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">chat_bubble</span>
                                        {ticket.messages} ردود
                                    </span>
                                    <span className={`flex items-center gap-1 ${priorityColors[ticket.priority]}`}>
                                        <span className="material-symbols-outlined text-sm">flag</span>
                                        {ticket.priority === "high" ? "عاجل" : ticket.priority === "medium" ? "متوسط" : "عادي"}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700">
                                    <span className="text-xs text-slate-500">آخر تحديث: {ticket.lastUpdate}</span>
                                    <span className="material-symbols-outlined text-slate-500">chevron_left</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-dark border-t border-slate-800">
                <button
                    onClick={() => setShowNewTicket(true)}
                    className="w-full py-3 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span>
                    تذكرة جديدة
                </button>
            </div>

            {showNewTicket && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-surface-dark rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">تذكرة جديدة</h3>
                            <button onClick={() => setShowNewTicket(false)} className="text-slate-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-4 flex flex-col gap-4">
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">التصنيف</label>
                                <select className="w-full h-12 rounded-xl bg-bg-dark border border-slate-700 px-4 text-white">
                                    <option>مشكلة تقنية</option>
                                    <option>المدفوعات</option>
                                    <option>المزادات</option>
                                    <option>الصفقات</option>
                                    <option>عام</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">الموضوع</label>
                                <input
                                    type="text"
                                    placeholder="أدخل موضوع التذكرة"
                                    className="w-full h-12 rounded-xl bg-bg-dark border border-slate-700 px-4 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">التفاصيل</label>
                                <textarea
                                    rows={4}
                                    placeholder="اشرح مشكلتك بالتفصيل..."
                                    className="w-full rounded-xl bg-bg-dark border border-slate-700 px-4 py-3 text-white resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">الأولوية</label>
                                <div className="flex gap-2">
                                    {["low", "medium", "high"].map((p) => (
                                        <button
                                            key={p}
                                            className="flex-1 py-2 rounded-xl border border-slate-700 text-sm text-slate-300"
                                        >
                                            {p === "low" ? "عادي" : p === "medium" ? "متوسط" : "عاجل"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-700 flex gap-2">
                            <button
                                onClick={() => setShowNewTicket(false)}
                                className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-bold"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={() => setShowNewTicket(false)}
                                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold"
                            >
                                إرسال
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
