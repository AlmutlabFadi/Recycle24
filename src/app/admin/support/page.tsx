"use client";

import { useState, useEffect, useRef } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Message {
    id: string;
    content: string;
    senderType: string;
    createdAt: string;
}

interface Ticket {
    id: string;
    ticketId: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    createdAt: string;
    user: { name: string; phone: string; email: string };
    messages?: Message[];
    _count?: { messages: number };
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    OPEN: { label: "مفتوحة", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    PENDING: { label: "قيد المراجعة", color: "text-amber-500", bg: "bg-amber-500/10" },
    RESOLVED: { label: "تم الحل", color: "text-blue-500", bg: "bg-blue-500/10" },
    CLOSED: { label: "مغلقة", color: "text-slate-500", bg: "bg-slate-500/10" },
};

const priorityMap: Record<string, { label: string; color: string }> = {
    LOW: { label: "منخفضة", color: "text-slate-400" },
    MEDIUM: { label: "متوسطة", color: "text-amber-500" },
    HIGH: { label: "عالية", color: "text-red-500" },
};

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [activeStatus, setActiveStatus] = useState("ALL");
    
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTickets();
    }, [activeStatus]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedTicket?.messages]);

    async function fetchTickets() {
        setLoading(true);
        try {
            const statusQuery = activeStatus === "ALL" ? "" : `?status=${activeStatus}`;
            const res = await fetch(`/api/admin/support${statusQuery}`);
            const data = await res.json();
            if (data.success) {
                setTickets(data.tickets);
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchTicketDetail(id: string) {
        try {
            const res = await fetch(`/api/admin/support/${id}`);
            const data = await res.json();
            if (data.success) {
                setSelectedTicket(data.ticket);
            }
        } catch (error) {
            console.error("Error fetching ticket detail:", error);
        }
    }

    async function handleReply() {
        if (!reply.trim() || !selectedTicket || isSending) return;
        setIsSending(true);
        try {
            const res = await fetch(`/api/admin/support/${selectedTicket.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: reply }),
            });
            const data = await res.json();
            if (data.success) {
                setReply("");
                fetchTicketDetail(selectedTicket.id);
            }
        } catch (error) {
            console.error("Error sending reply:", error);
        } finally {
            setIsSending(false);
        }
    }

    async function updateStatus(status: string) {
        if (!selectedTicket) return;
        try {
            const res = await fetch(`/api/admin/support/${selectedTicket.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (data.success) {
                fetchTicketDetail(selectedTicket.id);
                fetchTickets();
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    }

    return (
        <div className="flex flex-col h-screen bg-bg-dark font-display max-h-screen">
            <HeaderWithBack title="مكتب الدعم" />

            <div className="flex-1 flex overflow-hidden lg:max-w-7xl lg:mx-auto w-full lg:p-4 gap-4">
                {/* Tickets Sidebar */}
                <aside className={`w-full lg:w-96 flex flex-col bg-surface-highlight/30 lg:rounded-[2.5rem] border border-slate-800 ${selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-slate-800">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                            {["ALL", "OPEN", "PENDING", "RESOLVED", "CLOSED"].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setActiveStatus(s)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold ${activeStatus === s ? 'bg-primary text-white' : 'bg-surface-highlight text-slate-400'}`}
                                >
                                    {s === "ALL" ? "الكل" : statusMap[s]?.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 font-bold px-2">{tickets.length} تذكرة متاحة</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>
                        ) : tickets.map((t) => (
                            <div
                                key={t.id}
                                onClick={() => fetchTicketDetail(t.id)}
                                className={`p-4 rounded-3xl border transition cursor-pointer ${selectedTicket?.id === t.id ? 'bg-primary/10 border-primary/50' : 'bg-surface-highlight border-slate-800 hover:border-slate-700'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMap[t.status].bg} ${statusMap[t.status].color}`}>
                                        {statusMap[t.status].label}
                                    </span>
                                    <span className={`text-[10px] font-bold ${priorityMap[t.priority].color}`}>
                                        {priorityMap[t.priority].label}
                                    </span>
                                </div>
                                <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{t.subject}</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-[10px] text-slate-500">{t.user.name}</p>
                                    <p className="text-[10px] text-slate-600 font-english">{new Date(t.createdAt).toLocaleDateString("ar-SY")}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Chat Area */}
                <main className={`flex-1 flex flex-col bg-surface-highlight/30 lg:rounded-[2.5rem] border border-slate-800 overflow-hidden ${selectedTicket ? 'flex' : 'hidden lg:flex'}`}>
                    {selectedTicket ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-surface-highlight/20">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setSelectedTicket(null)} className="lg:hidden size-8 bg-slate-800 rounded-full flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                    <div>
                                        <h2 className="text-sm font-bold text-white mb-0.5">{selectedTicket.subject}</h2>
                                        <p className="text-[10px] text-slate-500">#{selectedTicket.ticketId} - {selectedTicket.user.name}</p>
                                    </div>
                                </div>
                                <select 
                                    title="حالة التذكرة"
                                    className="bg-slate-800 text-[10px] font-bold text-white px-3 py-1.5 rounded-xl border-none outline-none"
                                    value={selectedTicket.status}
                                    onChange={(e) => updateStatus(e.target.value)}
                                >
                                    {Object.entries(statusMap).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Messages */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[url('/grid-dark.svg')]">
                                {selectedTicket.messages?.map((m) => (
                                    <div key={m.id} className={`flex ${m.senderType === 'SUPPORT' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-3xl ${m.senderType === 'SUPPORT' ? 'bg-primary text-white rounded-tl-none' : 'bg-surface-highlight text-white border border-slate-800 rounded-tr-none'}`}>
                                            <p className="text-sm leading-relaxed">{m.content}</p>
                                            <p className={`text-[9px] mt-2 opacity-60 font-english ${m.senderType === 'SUPPORT' ? 'text-left' : 'text-right'}`}>
                                                {new Date(m.createdAt).toLocaleTimeString("ar-SY", { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-slate-800 bg-surface-highlight/20">
                                <div className="flex gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-2">
                                    <textarea
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        placeholder="اكتب ردك هنا..."
                                        rows={1}
                                        className="flex-1 bg-transparent border-none text-white text-sm outline-none p-2 resize-none"
                                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                                    />
                                    <button 
                                        onClick={handleReply}
                                        disabled={!reply.trim() || isSending}
                                        className="size-10 bg-primary rounded-xl flex items-center justify-center text-white hover:scale-105 transition disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined">send</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-40">
                            <span className="material-symbols-outlined !text-6xl mb-4">forum</span>
                            <h2 className="text-lg font-bold text-white mb-2">مرحباً بك في لوحة الدعم</h2>
                            <p className="text-xs text-slate-400 max-w-xs">اختر تذكرة من القائمة الجانبية للبدء في حل مشكلات المستخدمين والرد على استفساراتهم.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
