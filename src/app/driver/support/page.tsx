"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useToast } from "@/contexts/ToastContext";

type Ticket = {
    id: string;
    ticketId: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    createdAt: string;
};

type Message = {
    id: string;
    content: string;
    senderType: string;
    createdAt: string;
};

export default function DriverSupportPage() {
    const { addToast } = useToast();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<(Ticket & { messages?: Message[] }) | null>(null);
    const [loading, setLoading] = useState(true);

    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("عام");
    const [priority, setPriority] = useState("MEDIUM");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [reply, setReply] = useState("");
    const [sendingReply, setSendingReply] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/driver/tickets?status=all", { cache: "no-store" });
            const data = await response.json();
            if (response.ok) setTickets(data.tickets || []);
        } catch (error) {
            console.error("Driver tickets fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedTicket?.messages]);

    const fetchTicketDetail = useCallback(async (ticketId: string) => {
        try {
            const response = await fetch(`/api/driver/tickets/${ticketId}`, { cache: "no-store" });
            const data = await response.json();
            if (response.ok) {
                setSelectedTicket(data.ticket);
            }
        } catch (error) {
            console.error("Ticket detail fetch error:", error);
        }
    }, []);

    const handleSubmit = async () => {
        if (!subject || !content) {
            addToast("يرجى إدخال العنوان والرسالة", "warning");
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch("/api/driver/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, category, priority, content }),
            });
            const data = await response.json();
            if (!response.ok) {
                addToast(data.error || "تعذر إنشاء التذكرة", "error");
                return;
            }
            addToast("تم إنشاء تذكرة الدعم", "success");
            setSubject("");
            setCategory("عام");
            setPriority("MEDIUM");
            setContent("");
            fetchTickets();
        } catch (error) {
            console.error("Create ticket error:", error);
            addToast("تعذر إنشاء التذكرة", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async () => {
        if (!selectedTicket || !reply.trim() || sendingReply) return;
        setSendingReply(true);
        try {
            const response = await fetch(`/api/driver/tickets/${selectedTicket.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: reply }),
            });
            const data = await response.json();
            if (!response.ok) {
                addToast(data.error || "تعذر إرسال الرسالة", "error");
                return;
            }
            setReply("");
            fetchTicketDetail(selectedTicket.id);
        } catch (error) {
            console.error("Reply error:", error);
            addToast("تعذر إرسال الرسالة", "error");
        } finally {
            setSendingReply(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="الدعم الفني" />

            <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 pb-24">
                <aside className={`lg:w-[380px] flex flex-col gap-4 ${selectedTicket ? "hidden lg:flex" : "flex"}`}>
                    <section className="bg-surface-dark border border-slate-800 rounded-3xl p-5 space-y-4">
                        <h2 className="text-sm font-bold text-white">إنشاء تذكرة جديدة</h2>
                        <input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="عنوان المشكلة"
                            className="bg-bg-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="التصنيف"
                                className="bg-bg-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"
                            />
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="bg-bg-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white"
                            >
                                <option value="LOW">منخفضة</option>
                                <option value="MEDIUM">متوسطة</option>
                                <option value="HIGH">مرتفعة</option>
                            </select>
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="اكتب تفاصيل المشكلة..."
                            className="bg-bg-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white min-h-[120px]"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-primary text-white text-sm font-bold rounded-xl px-4 py-3"
                        >
                            {submitting ? "جاري الإرسال..." : "إرسال التذكرة"}
                        </button>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-sm font-bold text-white">سجل التذاكر</h2>
                        {loading ? (
                            <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">
                                جاري تحميل التذاكر...
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="bg-surface-dark rounded-xl p-4 border border-slate-800 text-center text-slate-400 text-sm">
                                لا توجد تذاكر حالياً
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tickets.map((ticket) => (
                                    <button
                                        key={ticket.id}
                                        onClick={() => fetchTicketDetail(ticket.id)}
                                        className={`w-full text-right bg-surface-dark rounded-2xl p-4 border transition ${selectedTicket?.id === ticket.id ? "border-primary/60" : "border-slate-800"}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-bold text-white">{ticket.subject}</p>
                                            <span className="text-[10px] text-slate-400 font-english">{ticket.ticketId}</span>
                                        </div>
                                        <p className="text-xs text-slate-400">{ticket.category} · {ticket.priority}</p>
                                        <p className="text-xs text-slate-500 mt-2">الحالة: {ticket.status}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                </aside>

                <main className={`flex-1 flex flex-col bg-surface-dark border border-slate-800 rounded-3xl overflow-hidden ${selectedTicket ? "flex" : "hidden lg:flex"}`}>
                    {selectedTicket ? (
                        <>
                            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-white">{selectedTicket.subject}</p>
                                    <p className="text-[10px] text-slate-500 font-english">#{selectedTicket.ticketId}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedTicket(null)}
                                    className="lg:hidden text-xs text-slate-300"
                                >
                                    رجوع
                                </button>
                            </div>

                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                                {(selectedTicket.messages || []).map((message) => (
                                    <div key={message.id} className={`flex ${message.senderType === "SUPPORT" ? "justify-start" : "justify-end"}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${message.senderType === "SUPPORT" ? "bg-slate-800 text-white" : "bg-primary text-white"}`}>
                                            <p>{message.content}</p>
                                            <p className="text-[10px] opacity-70 mt-2 font-english">
                                                {new Date(message.createdAt).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-slate-800">
                                <div className="flex gap-2">
                                    <textarea
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        placeholder="اكتب رسالتك..."
                                        className="flex-1 bg-bg-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white min-h-[48px]"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleReply();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handleReply}
                                        disabled={sendingReply}
                                        className="bg-primary text-white text-sm font-bold rounded-xl px-4 py-3"
                                    >
                                        {sendingReply ? "..." : "إرسال"}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
                            <span className="material-symbols-outlined !text-5xl">forum</span>
                            <p className="text-sm mt-3">اختر تذكرة لعرض المحادثة</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
