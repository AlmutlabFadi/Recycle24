"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";
import BottomNavigation from "@/components/BottomNavigation";

interface Message {
    id: string;
    text: string;
    sender: "user" | "agent";
    time: string;
    isRead?: boolean;
}

export default function SupportChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: "مرحباً بك في خدمة عملاء Recycle24. 👋\nأنا سارة، كيف يمكنني مساعدتك اليوم بخصوص عمليات إعادة التدوير الخاصة بك؟",
            sender: "agent",
            time: "10:24 صباحاً",
        },
        {
            id: "2",
            text: "أهلاً سارة، لدي مشكلة في إرفاق الإيصال الخاص بآخر عملية بيع للبلاستيك.",
            sender: "user",
            time: "10:26 صباحاً",
            isRead: true,
        },
    ]);
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const topics = [
        { id: "payment", label: "المدفوعات والفواتير" },
        { id: "pickup", label: "مشكلة في الاستلام" },
        { id: "dispute", label: "نزاع حول عملية بيع" },
        { id: "tech", label: "دعم فني" },
        { id: "other", label: "موضوع آخر" },
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = () => {
        if (!newMessage.trim()) return;

        const message: Message = {
            id: Date.now().toString(),
            text: newMessage,
            sender: "user",
            time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, message]);
        setNewMessage("");

        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const autoReply: Message = {
                id: (Date.now() + 1).toString(),
                text: "شكراً لتواصلك معنا. يتم مراجعة طلبك وسنرد عليك في أقرب وقت ممكن.",
                sender: "agent",
                time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages((prev) => [...prev, autoReply]);
        }, 2000);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack 
                title="مساعد الدعم" 
                action={
                    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 text-primary hover:bg-slate-700">
                        <span className="material-symbols-outlined">call</span>
                    </button>
                }
            />

            {/* Agent Status Info (Mini) */}
            <div className="bg-surface-dark px-4 py-2 border-b border-slate-800 flex items-center gap-3">
                <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400 text-sm">support_agent</span>
                    </div>
                    <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-surface-dark bg-green-500"></span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">سارة أحمد</span>
                    <span className="text-[10px] text-primary font-medium">متصل الآن</span>
                </div>
            </div>

            <main className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto pb-24">
                <div className="flex justify-center">
                    <span className="text-xs font-medium text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                        اليوم، 10:23 صباحاً
                    </span>
                </div>

                <div className="bg-surface-dark p-4 rounded-xl border border-slate-800">
                    <label className="block text-sm font-medium text-slate-300 mb-2">موضوع المحادثة</label>
                    <div className="relative">
                        <select
                            title="موضوع المحادثة"
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            className="appearance-none w-full bg-slate-800 border border-slate-700 text-slate-200 py-3 pr-4 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="">اختر موضوع المشكلة...</option>
                            {topics.map((topic) => (
                                <option key={topic.id} value={topic.id}>{topic.label}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-slate-500">
                            <span className="material-symbols-outlined text-xl">expand_more</span>
                        </div>
                    </div>
                </div>

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex items-start gap-3 max-w-[85%] ${
                            message.sender === "user" ? "self-end flex-row-reverse" : ""
                        }`}
                    >
                        {message.sender === "agent" && (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-slate-400 text-sm">support_agent</span>
                            </div>
                        )}
                        <div className={`flex flex-col gap-1 ${message.sender === "user" ? "items-end" : ""}`}>
                            <div
                                className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                    message.sender === "user"
                                        ? "bg-primary text-white rounded-tl-none"
                                        : "bg-surface-dark text-slate-200 rounded-tr-none border border-slate-800"
                                }`}
                            >
                                <p className="whitespace-pre-line">{message.text}</p>
                            </div>
                            <div className={`flex items-center gap-1 ${message.sender === "user" ? "ml-1" : "mr-1"}`}>
                                <span className="text-[11px] text-slate-400">{message.time}</span>
                                {message.sender === "user" && message.isRead && (
                                    <span className="material-symbols-outlined text-[14px] text-primary">done_all</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex items-center gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-slate-400 text-sm">support_agent</span>
                        </div>
                        <div className="bg-surface-dark px-4 py-3 rounded-2xl rounded-tr-none border border-slate-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="bg-surface-dark border-t border-slate-800 p-3 pb-6 sticky bottom-0 z-20">
                <div className="flex items-end gap-2">
                    <button className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-800">
                        <span className="material-symbols-outlined text-2xl">attach_file</span>
                    </button>
                    <div className="flex-1 bg-slate-800 rounded-2xl flex items-center min-h-[48px] border border-transparent focus-within:border-primary transition-all">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                            placeholder="اكتب رسالتك هنا..."
                            className="w-full bg-transparent border-0 focus:ring-0 text-white placeholder:text-slate-500 px-4 py-3 resize-none max-h-32 text-base"
                            rows={1}
                        />
                    </div>
                    <button className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-primary">
                        <span className="material-symbols-outlined text-2xl">mic</span>
                    </button>
                    <button
                        onClick={sendMessage}
                        className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-blue-600 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-2xl">send</span>
                    </button>
                </div>
            </footer>
            <BottomNavigation />
        </div>
    );
}
