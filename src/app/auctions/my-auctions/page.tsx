"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import BottomNavigation from "@/components/BottomNavigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface AuctionItem { id: string; type: string; customType: string | null; weight: number; unit: string; isAccurate: boolean; }

interface Auction {
    id: string;
    title: string;
    category: string;
    weight: number;
    weightUnit: string;
    
    pricingMode: string;
    startingBidCurrency: string;
    startingBidUnit: string;
    startingBid: number;
    buyNowPriceCurrency: string;
    buyNowPrice: number | null;
    securityDepositCurrency: string;
    securityDeposit: number;
    securityDepositMethod: string;
    
    duration: number;
    location: string;
    workflowStatus: string;
    status: string;
    type: string;
    scheduledAt: string | null;
    endsAt: string | null;
    createdAt: string;
    items: AuctionItem[];
}

interface Message {
    id: string;
    actorId: string;
    payload: { text: string; senderName: string; senderRole: "ADMIN" | "SELLER"; fileUrl?: string; fileName?: string };
    createdAt: string;
}

interface PresenceInfo { name: string; isOnline: boolean; isTyping: boolean; role: string; }

const TABS = [
    { key: "PENDING_APPROVAL", label: "قيد الانتظار", icon: "schedule", color: "text-amber-400", border: "border-amber-500" },
    { key: "UNDER_REVIEW",    label: "قيد المراجعة", icon: "find_in_page", color: "text-blue-400", border: "border-blue-500" },
    { key: "SCHEDULED",       label: "تم النشر",     icon: "check_circle", color: "text-green-400", border: "border-green-500" },
    { key: "CANCELED",        label: "ملغية",         icon: "cancel",       color: "text-red-400",   border: "border-red-500" },
];

const statusConfig: Record<string, { label: string; color: string; icon: string; hint: string }> = {
    PENDING_APPROVAL: { label: "قيد الانتظار", color: "text-amber-400 bg-amber-400/10 border-amber-500/20", icon: "schedule", hint: "مزادك بانتظار مراجعة الإدارة. يمكنك التعديل أو الإلغاء الآن." },
    UNDER_REVIEW:    { label: "قيد المراجعة", color: "text-blue-400 bg-blue-400/10 border-blue-500/20", icon: "find_in_page", hint: "الإدارة تراجع طلبك. يمكنك مراسلتهم مباشرة." },
    SCHEDULED:       { label: "تم النشر ✅", color: "text-green-400 bg-green-400/10 border-green-500/20", icon: "check_circle", hint: "تمت الموافقة. المزاد منشور." },
    CANCELED:        { label: "ملغي / مرفوض", color: "text-red-400 bg-red-400/10 border-red-500/20", icon: "cancel", hint: "تم إلغاء أو رفض هذا المزاد." },
    OPEN:            { label: "جارٍ الآن 🔴", color: "text-red-400 bg-red-400/10 border-red-500/20", icon: "gavel", hint: "المزاد جارٍ الآن." },
};

const categoryLabels: Record<string, string> = {
    IRON: "حديد", COPPER: "نحاس", ALUMINUM: "ألمنيوم", PLASTIC: "بلاستيك",
    CARDBOARD: "كرتون", MIXED: "خلطة", BRASS: "نحاس أصفر", STEEL: "ستيل", ZINC: "زنك",
};

// Global flag to suppress notification popup when chat is open
declare global { var __chatOpen: boolean; }

export default function MyAuctionsPage() {
    const { activeRole } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState("PENDING_APPROVAL");
    const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);

    const [chatAuction, setChatAuction] = useState<Auction | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMsg, setNewMsg] = useState("");
    const [sendingMsg, setSendingMsg] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [otherPresence, setOtherPresence] = useState<PresenceInfo | null>(null);
    const [iAmOnline, setIAmOnline] = useState(false);

    const [showCancelConfirm, setShowCancelConfirm] = useState<Auction | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const msgEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const presencePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isTypingRef = useRef(false);

    // Mark global chat state
    useEffect(() => {
        globalThis.__chatOpen = !!chatAuction;
        return () => { globalThis.__chatOpen = false; };
    }, [chatAuction]);

    useEffect(() => {
        if (activeRole && activeRole !== "TRADER") { router.push("/"); return; }
        fetchAuctions();
    }, [activeRole, router]);

    const fetchAuctions = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/auctions/mine");
            const data = await res.json();
            setAllAuctions((data.auctions || []) as Auction[]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const displayedAuctions = allAuctions.filter(a =>
        activeTab === "CANCELED" ? a.workflowStatus === "CANCELED" : a.workflowStatus === activeTab
    );

    // ─── Chat polling ──────────────────────────────────────────────────────────
    const fetchMessages = useCallback(async (auctionId: string) => {
        try {
            const res = await fetch(`/api/auctions/${auctionId}/messages`);
            const data = await res.json();
            setMessages(data.messages || []);
            setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
        } catch (e) { console.error(e); }
    }, []);

    const fetchPresence = useCallback(async (auctionId: string) => {
        try {
            const res = await fetch(`/api/auctions/${auctionId}/presence`);
            const data = await res.json();
            const entries = Object.values(data.presence || {}) as PresenceInfo[];
            const adminPresence = entries.find(p => p.role === "ADMIN");
            setOtherPresence(adminPresence || null);
        } catch (e) { console.error(e); }
    }, []);

    const sendHeartbeat = useCallback(async (auctionId: string, typing: boolean) => {
        try {
            await fetch(`/api/auctions/${auctionId}/presence`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isTyping: typing }),
            });
            setIAmOnline(true);
        } catch (e) { console.error(e); }
    }, []);

    // Start/stop polling when chat opens/closes
    useEffect(() => {
        if (!chatAuction) {
            if (pollRef.current) clearInterval(pollRef.current);
            if (presencePollRef.current) clearInterval(presencePollRef.current);
            setOtherPresence(null);
            setIAmOnline(false);
            return;
        }

        const aId = chatAuction.id;
        fetchMessages(aId);
        fetchPresence(aId);
        sendHeartbeat(aId, false);

        // Poll messages every 5s
        pollRef.current = setInterval(() => fetchMessages(aId), 5000);
        // Poll presence every 3s + send heartbeat
        presencePollRef.current = setInterval(() => {
            fetchPresence(aId);
            sendHeartbeat(aId, isTypingRef.current);
        }, 3000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (presencePollRef.current) clearInterval(presencePollRef.current);
        };
    }, [chatAuction, fetchMessages, fetchPresence, sendHeartbeat]);

    const openChat = (a: Auction) => setChatAuction(a);

    const handleTyping = (val: string) => {
        setNewMsg(val);
        if (!chatAuction) return;
        isTypingRef.current = true;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => { isTypingRef.current = false; }, 3000);
    };

    const sendMessage = async (fileUrl?: string, fileName?: string) => {
        if ((!newMsg.trim() && !fileUrl) || !chatAuction) return;
        setSendingMsg(true);
        try {
            const body: Record<string, string> = { text: newMsg.trim() || (fileName || "📎 مرفق") };
            if (fileUrl) { body.fileUrl = fileUrl; body.fileName = fileName || "مرفق"; }
            await fetch(`/api/auctions/${chatAuction.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            setNewMsg("");
            isTypingRef.current = false;
            await fetchMessages(chatAuction.id);
        } catch (e) { console.error(e); }
        finally { setSendingMsg(false); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !chatAuction) return;
        setUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (data.url) await sendMessage(data.url, file.name);
        } catch (e) { console.error(e); }
        finally { setUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
    };

    const handleCancel = async (auction: Auction) => {
        setCancellingId(auction.id);
        try {
            const res = await fetch(`/api/auctions/${auction.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cancelAuction: true }),
            });
            if (res.ok) {
                setAllAuctions(prev => prev.map(a => a.id === auction.id ? { ...a, workflowStatus: "CANCELED" } : a));
                setShowCancelConfirm(null);
            }
        } catch (e) { console.error(e); }
        finally { setCancellingId(null); }
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24" dir="rtl">
            <HeaderWithBack
                title="مزاداتي"
                action={
                    <Link href="/auctions/create" className="flex items-center gap-1 text-xs font-bold text-white bg-primary px-3 py-1.5 rounded-full">
                        <span className="material-symbols-outlined !text-[14px]">add</span>
                        جديد
                    </Link>
                }
            />

            {/* Tabs */}
            <div className="flex overflow-x-auto bg-bg-dark border-b border-slate-800 shrink-0 no-scrollbar">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2.5 text-xs font-bold transition border-b-2 ${activeTab === t.key ? `${t.border} ${t.color}` : "border-transparent text-slate-500"}`}
                    >
                        <span className="material-symbols-outlined !text-[16px]">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            <main className="flex-1 px-4 py-4 space-y-4">
                {loading && <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
                {!loading && displayedAuctions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <span className="material-symbols-outlined !text-[56px] text-slate-600">{TABS.find(t => t.key === activeTab)?.icon || "gavel"}</span>
                        <p className="text-slate-400 text-sm">لا توجد مزادات في هذه المرحلة</p>
                        {activeTab === "PENDING_APPROVAL" && (
                            <Link href="/auctions/create" className="mt-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm">إنشاء مزاد جديد</Link>
                        )}
                    </div>
                )}
                {!loading && displayedAuctions.map(auction => {
                    const statusInfo = statusConfig[auction.workflowStatus] || statusConfig["PENDING_APPROVAL"];
                    const canEdit = auction.workflowStatus === "PENDING_APPROVAL";
                    const canChat = auction.workflowStatus === "UNDER_REVIEW";
                    const canCancel = auction.workflowStatus === "PENDING_APPROVAL";
                    return (
                        <div key={auction.id} className="dark:bg-surface-highlight bg-white rounded-2xl border border-slate-700/50 overflow-hidden shadow-sm">
                            {(((auction as typeof auction & { images?: { id: string; imageUrl: string }[] }).images?.length) ?? 0) > 0 && (
                                <div className="flex gap-1 p-2 bg-slate-900/50 overflow-x-auto no-scrollbar">
                                    {(auction as typeof auction & { images?: { id: string; imageUrl: string }[] }).images!.map((img: { id: string; imageUrl: string }) => <img key={img.id} src={img.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />)}
                                </div>
                            )}
                            <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${statusInfo.color}`}>
                                        <span className="material-symbols-outlined !text-[13px]">{statusInfo.icon}</span>
                                        {statusInfo.label}
                                    </span>
                                    <span className="text-[11px] text-slate-500">{new Date(auction.createdAt).toLocaleDateString("ar-SY")}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base">{auction.title}</h3>
                                    {auction.items?.length > 0 ? (
                                        <p className="text-xs text-slate-400 mt-0.5">{auction.items.length} مواد معروضة</p>
                                    ) : (
                                        <p className="text-xs text-slate-400 mt-0.5">{categoryLabels[auction.category] || auction.category} — {auction.weight} {auction.weightUnit === "KG" ? "كغ" : "طن"}</p>
                                    )}
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><span className="material-symbols-outlined !text-[13px]">location_on</span>{auction.location}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-700/50">
                                    <div className="text-center"><p className="text-[10px] text-slate-500">السعر الابتدائي</p><p className="text-sm font-bold text-primary">{auction.startingBid.toLocaleString()}</p><p className="text-[9px] text-slate-600">{auction.startingBidCurrency === "USD" ? "$" : "ل.س"}</p></div>
                                    <div className="text-center"><p className="text-[10px] text-slate-500">التأمين</p><p className="text-sm font-bold text-white">{auction.securityDeposit > 0 ? auction.securityDeposit.toLocaleString() : "—"}</p><p className="text-[9px] text-slate-600">{auction.securityDepositCurrency === "USD" ? "$" : "ل.س"}</p></div>
                                    <div className="text-center"><p className="text-[10px] text-slate-500">المدة</p><p className="text-sm font-bold text-white">{auction.duration}</p><p className="text-[9px] text-slate-600">ساعة</p></div>
                                </div>
                                <div className="flex gap-2">
                                    {canEdit && (
                                        <Link href={`/auctions/${auction.id}/edit`} className="flex-1 flex items-center justify-center gap-1 text-xs font-bold bg-primary/10 text-primary border border-primary/30 py-2.5 rounded-xl">
                                            <span className="material-symbols-outlined !text-[14px]">edit</span>تعديل
                                        </Link>
                                    )}
                                    {canChat && (
                                        <button onClick={() => openChat(auction)} className="flex-1 flex items-center justify-center gap-1 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 py-2.5 rounded-xl">
                                            <span className="material-symbols-outlined !text-[14px]">chat</span>مراسلة الإدارة
                                        </button>
                                    )}
                                    {canCancel && (
                                        <button onClick={() => setShowCancelConfirm(auction)} className="flex items-center justify-center gap-1 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 py-2.5 px-3 rounded-xl">
                                            <span className="material-symbols-outlined !text-[14px]">delete</span>إلغاء
                                        </button>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500 flex items-start gap-1.5">
                                    <span className="material-symbols-outlined !text-[12px] mt-0.5">info</span>
                                    {statusInfo.hint}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </main>

            {/* Cancel Confirm */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-bg-dark border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined !text-[40px] text-red-400">warning</span>
                            <div><h3 className="font-bold text-white">إلغاء المزاد</h3><p className="text-xs text-slate-400 mt-0.5">"{showCancelConfirm.title}"</p></div>
                        </div>
                        <p className="text-sm text-slate-400">هل أنت متأكد من إلغاء هذا المزاد؟ لا يمكن التراجع عن هذا الإجراء.</p>
                        <div className="flex gap-3">
                            <button onClick={() => handleCancel(showCancelConfirm)} disabled={cancellingId === showCancelConfirm.id} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm disabled:opacity-50">
                                {cancellingId === showCancelConfirm.id ? "جاري الإلغاء..." : "نعم، إلغاء"}
                            </button>
                            <button onClick={() => setShowCancelConfirm(null)} className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-bold text-sm">تراجع</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════ CHAT MODAL ═══════════════════ */}
            {chatAuction && (
                <div className="fixed inset-0 z-[200] flex flex-col bg-bg-dark" dir="rtl">

                    {/* ── Header ── */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-bg-dark border-b border-slate-800 shrink-0">
                        <button onClick={() => setChatAuction(null)} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white shrink-0">
                            <span className="material-symbols-outlined !text-[20px]">arrow_forward</span>
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white leading-snug">مراسلة الإدارة</p>
                            <p className="text-xs text-slate-400 truncate">{chatAuction.title}</p>
                        </div>
                        {/* Status indicator */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {otherPresence?.isTyping ? (
                                <span className="text-[10px] text-blue-400 font-bold animate-pulse">يكتب...</span>
                            ) : (
                                <span className="text-[10px] text-slate-500">{otherPresence?.isOnline ? "متصل" : "غير متصل"}</span>
                            )}
                            <span className={`w-2.5 h-2.5 rounded-full ${otherPresence?.isOnline ? "bg-green-400" : "bg-amber-400"}`} />
                        </div>
                    </div>

                    {/* ── Messages ── */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-4 space-y-3">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined !text-[32px] text-blue-400">support_agent</span>
                                    </div>
                                    <p className="text-slate-300 font-bold text-sm">محادثة المراجعة</p>
                                    <p className="text-slate-500 text-xs max-w-[220px]">ابدأ بكتابة سؤالك أو استفسارك وسيرد عليك فريق الإدارة قريباً</p>
                                </div>
                            )}
                            {messages.map(m => {
                                // SELLER = me = RIGHT side (justify-start in RTL)
                                // ADMIN = other = LEFT side (justify-end in RTL)
                                const isSeller = m.payload?.senderRole === "SELLER";
                                return (
                                    <div key={m.id} className={`flex items-end gap-2 ${isSeller ? "justify-start" : "justify-end"}`}>
                                        {!isSeller && (
                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined !text-[12px] text-primary">admin_panel_settings</span>
                                            </div>
                                        )}
                                        <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl ${isSeller ? "bg-primary rounded-tr-none" : "bg-slate-800 border border-slate-700 rounded-tl-none"}`}>
                                            {!isSeller && <p className="text-[10px] font-bold text-primary mb-1">الإدارة</p>}
                                            {m.payload?.fileUrl ? (
                                                <a href={m.payload.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs underline text-blue-300">
                                                    <span className="material-symbols-outlined !text-[14px]">attach_file</span>
                                                    {m.payload.fileName || "مرفق"}
                                                </a>
                                            ) : (
                                                <p className="text-sm text-white leading-relaxed">{m.payload?.text}</p>
                                            )}
                                            <p className={`text-[10px] mt-1 ${isSeller ? "text-white/60" : "text-slate-500"}`}>
                                                {new Date(m.createdAt).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            {/* Other-side typing bubble */}
                            {otherPresence?.isTyping && (
                                <div className="flex justify-end items-end gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined !text-[12px] text-primary">admin_panel_settings</span>
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-slate-800 border border-slate-700 flex gap-1 items-center">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            )}
                            <div ref={msgEndRef} className="h-3" />
                        </div>
                    </div>

                    {/* ── My status bar (below messages) ── */}
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-bg-dark border-t border-slate-800/50 shrink-0">
                        <span className={`w-2 h-2 rounded-full ${iAmOnline ? "bg-green-400" : "bg-slate-600"}`} />
                        <span className="text-[10px] text-slate-500">أنت {iAmOnline ? "متصل" : "غير متصل"}</span>
                    </div>

                    {/* ── Input bar ── */}
                    <div className="shrink-0 bg-bg-dark border-t border-slate-800 px-3 py-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingFile}
                                title="إرفاق ملف"
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white shrink-0"
                            >
                                <span className="material-symbols-outlined !text-[20px]">{uploadingFile ? "hourglass_empty" : "attach_file"}</span>
                            </button>
                            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*,.pdf,.doc,.docx" />

                            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl flex items-center px-4 py-2 min-h-[44px]">
                                <textarea
                                    value={newMsg}
                                    onChange={e => {
                                        handleTyping(e.target.value);
                                        e.target.style.height = "auto";
                                        e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                                    }}
                                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                    placeholder="اكتب رسالتك..."
                                    rows={1}
                                    className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none resize-none leading-5"
                                />
                            </div>

                            <button
                                onClick={() => sendMessage()}
                                disabled={sendingMsg || !newMsg.trim()}
                                title="إرسال"
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white disabled:opacity-40 shrink-0"
                            >
                                <span className="material-symbols-outlined !text-[20px]">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNavigation />
        </div>
    );
}


