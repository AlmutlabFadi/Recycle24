"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";

interface Ticket {
    id: string;
    subject: string;
    category: string;
    status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
    priority: "LOW" | "MEDIUM" | "HIGH";
    createdAt: string;
    updatedAt: string;
    ticketId: string;
}

const statusColors = {
    OPEN: "bg-green-500/20 text-green-400 border-green-500/30",
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    RESOLVED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    CLOSED: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const statusLabels: Record<string, string> = {
    OPEN: "مفتوح",
    PENDING: "قيد المعالجة",
    RESOLVED: "تم الحل",
    CLOSED: "مغلق",
};

const priorityColors: Record<string, string> = {
    LOW: "text-slate-400",
    MEDIUM: "text-yellow-400",
    HIGH: "text-red-400",
};

export default function SupportTicketsPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [filter, setFilter] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);
    const [showNewTicket, setShowNewTicket] = useState(false);
    
    // Form state
    const [newTicket, setNewTicket] = useState({
        subject: "",
        category: "عام",
        content: "",
        priority: "MEDIUM"
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, [filter]);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/support/tickets?status=${filter}`);
            const data = await res.json();
            if (data.success) {
                setTickets(data.tickets);
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
            addToast("فشل في تحميل التذاكر", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTicket = async () => {
        if (!newTicket.subject || !newTicket.content) {
            addToast("يرجى إكمال جميع الحقول", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/support/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTicket),
            });
            const data = await res.json();
            if (data.success) {
                addToast("تم إنشاء التذكرة بنجاح", "success");
                setShowNewTicket(false);
                setNewTicket({ subject: "", category: "عام", content: "", priority: "MEDIUM" });
                fetchTickets();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error("Error creating ticket:", error);
            addToast("فشل في إنشاء التذكرة", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="تذاكر الدعم" />

            <main className="flex-1 p-4 flex flex-col gap-4 pb-24">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {["all", "OPEN", "PENDING", "RESOLVED", "CLOSED"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status === "all" ? "all" : status)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                                (filter === status)
                                    ? "bg-primary text-white"
                                    : "bg-surface-dark text-slate-400 border border-slate-700"
                            }`}
                        >
                            {status === "all" ? "الكل" : statusLabels[status]}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex-1 flex flex-col gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 w-full bg-slate-800/50 animate-pulse rounded-xl"></div>
                        ))}
                    </div>
                ) : tickets.length === 0 ? (
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
                        {tickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                href={`/support/tickets/${ticket.id}`}
                                className="bg-surface-dark rounded-xl p-4 border border-slate-800 hover:border-primary/50 transition"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs text-slate-500 font-mono">{ticket.ticketId}</span>
                                        <h3 className="text-white font-bold mt-1 line-clamp-1">{ticket.subject}</h3>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border shrink-0 ${statusColors[ticket.status as keyof typeof statusColors]}`}>
                                        {statusLabels[ticket.status]}
                                    </span>
                                </div>
 
                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-3">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">folder</span>
                                        {ticket.category}
                                    </span>
                                    <span className={`flex items-center gap-1 ${priorityColors[ticket.priority as keyof typeof priorityColors]}`}>
                                        <span className="material-symbols-outlined text-sm">flag</span>
                                        {ticket.priority === "HIGH" ? "عاجل" : ticket.priority === "MEDIUM" ? "متوسط" : "عادي"}
                                    </span>
                                </div>
 
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700/50">
                                    <span className="text-xs text-slate-500">
                                        {new Date(ticket.updatedAt).toLocaleDateString('ar-SA')}
                                    </span>
                                    <span className="material-symbols-outlined text-slate-500 text-sm">chevron_left</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="p-4">
                    <button
                        onClick={() => setShowNewTicket(true)}
                        className="w-full py-3 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">add</span>
                        تذكرة جديدة
                    </button>
                </div>
            </main>

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
                                <label id="category-label" className="text-sm text-slate-400 mb-1 block">التصنيف</label>
                                <select 
                                    aria-labelledby="category-label"
                                    value={newTicket.category}
                                    onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                                    className="w-full h-12 rounded-xl bg-bg-dark border border-slate-700 px-4 text-white"
                                >
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
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                                    placeholder="أدخل موضوع التذكرة"
                                    className="w-full h-12 rounded-xl bg-bg-dark border border-slate-700 px-4 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">التفاصيل</label>
                                <textarea
                                    rows={4}
                                    value={newTicket.content}
                                    onChange={(e) => setNewTicket({...newTicket, content: e.target.value})}
                                    placeholder="اشرح مشكلتك بالتفصيل..."
                                    className="w-full rounded-xl bg-bg-dark border border-slate-700 px-4 py-3 text-white resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">الأولوية</label>
                                <div className="flex gap-2">
                                    {[
                                        { id: "LOW", label: "عادي" },
                                        { id: "MEDIUM", label: "متوسط" },
                                        { id: "HIGH", label: "عاجل" }
                                    ].map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setNewTicket({...newTicket, priority: p.id})}
                                            className={`flex-1 py-2 rounded-xl border text-sm transition ${
                                                newTicket.priority === p.id 
                                                ? "bg-primary/10 border-primary text-primary font-bold" 
                                                : "border-slate-700 text-slate-300"
                                            }`}
                                        >
                                            {p.label}
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
                                onClick={handleCreateTicket}
                                disabled={isSubmitting}
                                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : "إرسال"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <BottomNavigation />
        </div>
    );
}
