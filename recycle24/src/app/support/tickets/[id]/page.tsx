"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Message {
    id: string;
    sender: "user" | "support";
    name: string;
    content: string;
    time: string;
    isAgent?: boolean;
}

export default function TicketDetailPage() {
    const params = useParams();
    const ticketId = params.id as string;

    const [newMessage, setNewMessage] = useState("");
    const [messages] = useState<Message[]>([
        {
            id: "1",
            sender: "user",
            name: "أنت",
            content: "مرحباً، أواجه مشكلة في سحب الرصيد من محفظتي. عندما أحاول السحب يظهر لي خطأ.",
            time: "منذ 3 ساعات",
        },
        {
            id: "2",
            sender: "support",
            name: "فريق الدعم",
            content: "مرحباً بك، نعتذر عن الإزعاج. يمكننا مساعدتك في هذه المشكلة. هل يمكنك إخبارنا برقم العملية أو رسالة الخطأ التي تظهر لك؟",
            time: "منذ ساعتين",
            isAgent: true,
        },
        {
            id: "3",
            sender: "user",
            name: "أنت",
            content: "تظهر لي رسالة \"رصيد غير كافٍ\" رغم أن لدي رصيد 500,000 ل.س في المحفظة.",
            time: "منذ ساعة",
        },
    ]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        setNewMessage("");
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title={`تذكرة #${ticketId}`} />

            <div className="px-4 py-3 border-b border-slate-800 bg-surface-dark">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-white font-bold">مشكلة في سحب الرصيد</h2>
                        <span className="text-xs text-slate-400">المدفوعات • أولوية عالية</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        مفتوح
                    </span>
                </div>
            </div>

            <main className="flex-1 p-4 flex flex-col gap-4 pb-24 overflow-y-auto">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${msg.isAgent ? "text-primary" : "text-slate-400"}`}>
                                {msg.name}
                            </span>
                            <span className="text-xs text-slate-500">{msg.time}</span>
                        </div>
                        <div
                            className={`max-w-[80%] p-4 rounded-2xl ${
                                msg.sender === "user"
                                    ? "bg-primary/20 rounded-tl-sm"
                                    : "bg-surface-dark border border-slate-700 rounded-tr-sm"
                            }`}
                        >
                            <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                        </div>
                    </div>
                ))}

                <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-slate-700"></div>
                    <span className="text-xs text-slate-500">اليوم</span>
                    <div className="flex-1 h-px bg-slate-700"></div>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-dark border-t border-slate-800">
                <div className="flex gap-2">
                    <label className="w-12 h-12 rounded-xl bg-surface-dark border border-slate-700 flex items-center justify-center cursor-pointer">
                        <span className="material-symbols-outlined text-slate-400">attach_file</span>
                        <input type="file" className="hidden" />
                    </label>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="اكتب رسالتك..."
                            className="w-full h-12 rounded-xl bg-surface-dark border border-slate-700 px-4 pr-12 text-white"
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-white">send</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
