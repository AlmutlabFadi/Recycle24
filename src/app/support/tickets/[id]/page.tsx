"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface Message {
    id: string;
    senderType: "USER" | "SUPPORT";
    name?: string;
    content: string;
    createdAt: string;
}

interface TicketDetails {
    id: string;
    subject: string;
    status: string;
    category?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    createdAt: string;
    messages: Message[];
}

export default function TicketDetailPage() {
    const params = useParams();
    const ticketId = params.id as string;

    const { user } = useAuth();
    const { addToast } = useToast();

    const scrollRef = useRef<HTMLDivElement>(null);

    const [ticket, setTicket] = useState<TicketDetails | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchTicketDetails();
    }, [ticketId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchTicketDetails = async () => {
        setIsLoading(true);

        try {
            const res = await fetch(`/api/support/tickets/${ticketId}`);
            const data = await res.json();

            if (data.success) {
                const ticketData = data.ticket as TicketDetails;

                setTicket(ticketData);
                setMessages(Array.isArray(ticketData.messages) ? ticketData.messages : []);
            }

        } catch (error) {

            console.error("Error fetching ticket details:", error);
            addToast("فشل في تحميل تفاصيل التذكرة", "error");

        } finally {

            setIsLoading(false);

        }
    };

    const handleSendMessage = async () => {

        if (!newMessage.trim() || isSending) return;

        setIsSending(true);

        try {

            const res = await fetch(`/api/support/tickets/${ticketId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMessage }),
            });

            const data = await res.json();

            if (data.success) {
                setMessages([...messages, data.message]);
                setNewMessage("");
            }

        } catch (error) {

            console.error("Error sending message:", error);
            addToast("فشل في إرسال الرسالة", "error");

        } finally {

            setIsSending(false);

        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">

            <HeaderWithBack title={`تذكرة #${ticketId}`} />

            <div className="px-4 py-3 border-b border-slate-800 bg-surface-dark">

                {isLoading ? (

                    <div className="h-10 w-48 bg-slate-800 animate-pulse rounded-lg"></div>

                ) : (

                    <div className="flex justify-between items-center">

                        <div>

                            <h2 className="text-white font-bold">
                                {ticket?.subject}
                            </h2>

                            <span className="text-xs text-slate-400">

                                {ticket?.category}

                                {" • "}

                                {ticket?.priority === "HIGH"
                                    ? "أولوية عالية"
                                    : ticket?.priority === "MEDIUM"
                                    ? "أولوية متوسطة"
                                    : "أولوية عادية"}

                            </span>

                        </div>

                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                ticket?.status === "OPEN"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : ticket?.status === "PENDING"
                                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                    : ticket?.status === "RESOLVED"
                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                    : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                            }`}
                        >
                            {ticket?.status === "OPEN"
                                ? "مفتوح"
                                : ticket?.status === "PENDING"
                                ? "قيد المعالجة"
                                : ticket?.status === "RESOLVED"
                                ? "تم الحل"
                                : "مغلق"}
                        </span>

                    </div>
                )}

            </div>

            <main
                ref={scrollRef}
                className="flex-1 p-4 flex flex-col gap-4 pb-24 overflow-y-auto"
            >

                {isLoading ? (

                    <div className="flex flex-col gap-4">
                        <div className="h-16 w-2/3 bg-slate-800/50 animate-pulse rounded-2xl self-end"></div>
                        <div className="h-16 w-2/3 bg-slate-800/50 animate-pulse rounded-2xl self-start"></div>
                    </div>

                ) : (

                    messages.map((msg) => (

                        <div
                            key={msg.id}
                            className={`flex flex-col ${
                                msg.senderType === "USER"
                                    ? "items-end"
                                    : "items-start"
                            }`}
                        >

                            <div className="flex items-center gap-2 mb-1">

                                <span
                                    className={`text-xs font-medium ${
                                        msg.senderType === "SUPPORT"
                                            ? "text-primary"
                                            : "text-slate-400"
                                    }`}
                                >
                                    {msg.senderType === "USER"
                                        ? "أنت"
                                        : "فريق الدعم"}
                                </span>

                                <span className="text-xs text-slate-500">
                                    {new Date(msg.createdAt).toLocaleTimeString(
                                        "ar-SA",
                                        {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        }
                                    )}
                                </span>

                            </div>

                            <div
                                className={`max-w-[80%] p-4 rounded-2xl ${
                                    msg.senderType === "USER"
                                        ? "bg-primary/20 rounded-tl-sm"
                                        : "bg-surface-dark border border-slate-700 rounded-tr-sm"
                                }`}
                            >
                                <p className="text-sm text-white leading-relaxed">
                                    {msg.content}
                                </p>
                            </div>

                        </div>

                    ))
                )}

            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-dark border-t border-slate-800">

                <div className="flex gap-2">

                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="اكتب رسالتك..."
                        className="w-full h-12 rounded-xl bg-surface-dark border border-slate-700 px-4 text-white"
                    />

                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center disabled:opacity-50"
                    >

                        {isSending ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span className="material-symbols-outlined text-white">
                                send
                            </span>
                        )}

                    </button>

                </div>

            </div>

            <BottomNavigation />

        </div>
    );
}