"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

interface SellerInfo {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    companyName: string | null;
    trader: { businessName: string; licenseNumber: string | null; governorate: string | null } | null;
}

interface AuctionItem { id: string; type: string; customType: string | null; weight: number; unit: string; isAccurate: boolean; }
interface AuctionDocument { id: string; fileUrl: string; fileName: string | null; fileSize: number | null; }
interface AuctionImage { id: string; imageUrl: string; order: number; }

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
    
    entryFee: number;
    duration: number;
    location: string;
    workflowStatus: string;
    type: string;
    organization: string | null;
    requiresESign: boolean;
    
    allowPreview: boolean;
    previewStartDate: string | null;
    previewEndDate: string | null;
    previewStartTime: string | null;
    previewEndTime: string | null;
    
    notes: string | null;
    shipmentDurationDays: number | null;
    
    createdAt: string;
    scheduledAt: string | null;
    endsAt: string | null;
    seller: SellerInfo;
    images: AuctionImage[];
    items: AuctionItem[];
    documents: AuctionDocument[];
}

interface Message {
    id: string;
    actorId: string;
    payload: { text: string; senderName: string; senderRole: "ADMIN" | "SELLER"; fileUrl?: string; fileName?: string };
    createdAt: string;
}

const TABS = [
    { key: "PENDING_APPROVAL", label: "انتظار", icon: "schedule", color: "text-amber-400" },
    { key: "UNDER_REVIEW", label: "مراجعة", icon: "find_in_page", color: "text-blue-400" },
    { key: "SCHEDULED", label: "منشور", icon: "check_circle", color: "text-green-400" },
    { key: "CANCELED", label: "ملغي/مرفوض", icon: "cancel", color: "text-red-400" },
];

const categoryLabels: Record<string, string> = {
    IRON: "حديد", COPPER: "نحاس أحمر", ALUMINUM: "ألمنيوم", PLASTIC: "بلاستيك",
    CARDBOARD: "كرتون", MIXED: "خلطة", BRASS: "نحاس أصفر", STEEL: "ستيل", ZINC: "زنك",
};

function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ar-SY");
}
function fmtTime(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminAuctionsPage() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("PENDING_APPROVAL");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [processing, setProcessing] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMsg, setNewMsg] = useState("");
    const [sendingMsg, setSendingMsg] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [otherPresence, setOtherPresence] = useState<{ name: string; isOnline: boolean; isTyping: boolean } | null>(null);
    const msgEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const presencePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isTypingRef = useRef(false);
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedAuction = auctions.find(a => a.id === selectedId) || null;

    const fetchAuctions = async (wf: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/auctions?workflowStatus=${wf}`);
            const data = await res.json();
            setAuctions(data.auctions || []);
            setSelectedId(null);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAuctions(tab); }, [tab]);

    const fetchMessages = useCallback(async (auctionId: string) => {
        const res = await fetch(`/api/auctions/${auctionId}/messages`);
        const data = await res.json();
        setMessages(data.messages || []);
        setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, []);

    const fetchPresence = useCallback(async (auctionId: string) => {
        try {
            const res = await fetch(`/api/auctions/${auctionId}/presence`);
            const data = await res.json();
            const entries = Object.values(data.presence || {}) as { name: string; isOnline: boolean; isTyping: boolean; role: string }[];
            const sellerPresence = entries.find(p => p.role === "SELLER");
            setOtherPresence(sellerPresence || null);
        } catch (e) { console.error(e); }
    }, []);

    const sendHeartbeat = useCallback(async (auctionId: string, typing: boolean) => {
        try {
            await fetch(`/api/auctions/${auctionId}/presence`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isTyping: typing }),
            });
        } catch (e) { console.error(e); }
    }, []);

    // Start polling when UNDER_REVIEW auction is selected
    useEffect(() => {
        if (!selectedId || !selectedAuction || selectedAuction.workflowStatus !== "UNDER_REVIEW") {
            if (pollRef.current) clearInterval(pollRef.current);
            if (presencePollRef.current) clearInterval(presencePollRef.current);
            setOtherPresence(null);
            return;
        }
        const aId = selectedId;
        fetchMessages(aId);
        fetchPresence(aId);
        sendHeartbeat(aId, false);

        pollRef.current = setInterval(() => fetchMessages(aId), 3000);
        presencePollRef.current = setInterval(() => {
            fetchPresence(aId);
            sendHeartbeat(aId, isTypingRef.current);
        }, 3000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (presencePollRef.current) clearInterval(presencePollRef.current);
        };
    }, [selectedId, selectedAuction?.workflowStatus, fetchMessages, fetchPresence, sendHeartbeat]);

    const selectAuction = (a: Auction) => {
        setSelectedId(a.id);
        setMessages([]);
    };

    const handleAction = async (id: string, action: "start_review" | "approve" | "reject", reason?: string) => {
        setProcessing(id);
        try {
            const res = await fetch(`/api/admin/auctions/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, rejectionReason: reason }),
            });
            if (res.ok) {
                setAuctions(prev => prev.filter(a => a.id !== id));
                setSelectedId(null);
                setRejectModal(false);
                setRejectReason("");
                if (action === "start_review") {
                    setTab("UNDER_REVIEW");
                }
            } else {
                const err = await res.json();
                alert(err.error || "حدث خطأ");
            }
        } catch (e) { console.error(e); }
        finally { setProcessing(null); }
    };

    const sendMessage = async (fileUrl?: string, fileName?: string) => {
        if ((!newMsg.trim() && !fileUrl) || !selectedAuction) return;
        setSendingMsg(true);
        try {
            const body: Record<string, string> = { text: newMsg.trim() || (fileName || "📎 مرفق") };
            if (fileUrl) { body.fileUrl = fileUrl; body.fileName = fileName || "مرفق"; }
            await fetch(`/api/auctions/${selectedAuction.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            setNewMsg("");
            isTypingRef.current = false;
            await fetchMessages(selectedAuction.id);
        } catch (e) { console.error(e); }
        finally { setSendingMsg(false); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
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

    const sa = selectedAuction;

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col" dir="rtl">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">gavel</span>
                    <h1 className="font-black text-white text-base">مراجعة المزادات</h1>
                </div>
                <Link href="/admin/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    <span className="material-symbols-outlined !text-[16px]">arrow_forward</span>
                    لوحة التحكم
                </Link>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT PANEL - List + Tabs */}
                <div className="w-80 shrink-0 border-l border-slate-800 flex flex-col overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-800 shrink-0 bg-slate-900">
                        {TABS.map(t => (
                            <button
                                key={t.key}
                                onClick={() => { setTab(t.key); }}
                                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition border-b-2 ${
                                    tab === t.key ? `border-primary ${t.color}` : "border-transparent text-slate-500 hover:text-slate-300"
                                }`}
                            >
                                <span className="material-symbols-outlined !text-[16px]">{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    {/* Auction List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading && <div className="flex justify-center h-32 items-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
                        {!loading && auctions.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
                                <span className="material-symbols-outlined !text-[40px]">gavel</span>
                                <p className="text-xs">لا توجد مزادات</p>
                            </div>
                        )}
                        {!loading && auctions.map(a => (
                            <button
                                key={a.id}
                                onClick={() => selectAuction(a)}
                                className={`w-full text-right p-3 border-b border-slate-800 hover:bg-slate-900 transition ${selectedId === a.id ? "bg-slate-800 border-r-2 border-r-primary" : ""}`}
                            >
                                <p className="font-bold text-white text-xs leading-snug truncate">{a.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{a.seller?.name} • {categoryLabels[a.category] || a.category}</p>
                                <p className="text-[10px] text-slate-500">{fmtDate(a.createdAt)}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* RIGHT PANEL - Details */}
                <div className="flex-1 overflow-y-auto">
                    {!sa && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                            <span className="material-symbols-outlined !text-[64px]">gavel</span>
                            <p className="text-sm">اختر مزاداً من القائمة</p>
                        </div>
                    )}

                    {sa && (
                        <div className="p-6 space-y-5">
                            {/* Title & Status */}
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-white">{sa.title}</h2>
                                    {sa.items.length === 0 && (
                                        <p className="text-sm text-slate-400 mt-1">
                                            {categoryLabels[sa.category] || sa.category} — {sa.weight} {sa.weightUnit === "KG" ? "كغ" : "طن"}
                                        </p>
                                    )}
                                </div>
                                <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border ${
                                    sa.workflowStatus === "PENDING_APPROVAL" ? "text-amber-400 bg-amber-400/10 border-amber-500/20" :
                                    sa.workflowStatus === "UNDER_REVIEW" ? "text-blue-400 bg-blue-400/10 border-blue-500/20" :
                                    sa.workflowStatus === "SCHEDULED" ? "text-green-400 bg-green-400/10 border-green-500/20" :
                                    "text-red-400 bg-red-400/10 border-red-500/20"
                                }`}>
                                    {TABS.find(t => t.key === sa.workflowStatus)?.label || sa.workflowStatus}
                                </span>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "الموقع", value: sa.location, icon: "location_on" },
                                    { label: "نوع المزاد", value: sa.type === "PRIVATE" ? "خاص" : (sa.organization ? `حكومي - ${sa.organization}` : "حكومي"), icon: "category" },
                                    
                                    { 
                                        label: `السعر الابتدائي (${sa.pricingMode === "per_material" ? "لكل مادة مفردة" : "سعر موحد"})`, 
                                        value: `${sa.startingBid.toLocaleString()} ${sa.startingBidCurrency === "USD" ? "$" : "ل.س"} / ${sa.startingBidUnit === "total" ? "لكامل الكمية" : sa.startingBidUnit === "ton" ? "طن" : sa.startingBidUnit === "piece" ? "قطعة" : "كغ"}`, 
                                        icon: "price_change" 
                                    },
                                    { 
                                        label: "سعر الشراء الفوري", 
                                        value: sa.buyNowPrice ? `${sa.buyNowPrice.toLocaleString()} ${sa.buyNowPriceCurrency === "USD" ? "$" : "ل.س"} / ${sa.startingBidUnit === "total" ? "لكامل الكمية" : sa.startingBidUnit === "ton" ? "طن" : sa.startingBidUnit === "piece" ? "قطعة" : "كغ"}` : "—", 
                                        icon: "bolt" 
                                    },
                                    {
                                        label: `التأمين ⚠️ ${sa.securityDeposit === 0 ? "غير محدد" : "مطلوب عبر " + (sa.securityDepositMethod === "platform" ? "المنصة" : "الدفع المباشر")}`,
                                        value: sa.securityDeposit > 0 ? `${sa.securityDeposit.toLocaleString()} ${sa.securityDepositCurrency === "USD" ? "$" : "ل.س"}` : "❌ غير محدد",
                                        icon: "verified_user",
                                        highlight: sa.securityDeposit === 0
                                    },
                                    { label: "مدة النقل", value: sa.shipmentDurationDays ? `${sa.shipmentDurationDays} يوم` : "غير محدد", icon: "local_shipping" },
                                    { label: "مدة المزاد", value: `${sa.duration} ساعة`, icon: "timer" },
                                    { label: "توقيع إلكتروني", value: sa.requiresESign ? "مطلوب ✅" : "غير مطلوب", icon: "draw" },
                                ].map(item => (
                                    <div
                                        key={item.label}
                                        className={`rounded-xl p-3 border ${(item as { highlight?: boolean }).highlight ? "bg-red-500/10 border-red-500/30" : "bg-slate-900 border-slate-800"}`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="material-symbols-outlined !text-[14px] text-slate-500">{item.icon}</span>
                                            <p className="text-[10px] text-slate-500">{item.label}</p>
                                        </div>
                                        <p className={`text-sm font-bold ${(item as { highlight?: boolean }).highlight ? "text-red-400" : "text-white"}`}>{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Dates + Times */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
                                        <span className="material-symbols-outlined !text-[13px]">event</span>
                                        بداية المزاد
                                    </p>
                                    <p className="text-sm font-bold text-white">{fmtDate(sa.scheduledAt)}</p>
                                    <p className="text-xs text-slate-400">{fmtTime(sa.scheduledAt)}</p>
                                </div>
                                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
                                        <span className="material-symbols-outlined !text-[13px]">event_busy</span>
                                        ساعة الإغلاق
                                    </p>
                                    <p className="text-sm font-bold text-white">{fmtDate(sa.endsAt)}</p>
                                    <p className="text-xs text-slate-400">{fmtTime(sa.endsAt)}</p>
                                </div>
                            </div>

                            {/* Items / Materials */}
                            {sa.items.length > 0 && (
                                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                                    <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-3">
                                        <span className="material-symbols-outlined !text-[15px]">inventory</span>
                                        السلع المعروضة ({sa.items.length})
                                    </h3>
                                    <div className="space-y-2 text-sm text-white">
                                        {sa.items.map((item, idx) => (
                                            <div key={item.id} className="flex items-center justify-between border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold">{idx + 1}. {item.type === "أخرى" && item.customType ? item.customType : item.type}</span>
                                                    <span className="text-xs text-slate-400">
                                                        الوزن: {item.weight.toLocaleString()} {item.unit === "ton" ? "طن" : item.unit === "piece" ? "قطعة" : item.unit === "kg" ? "كغ" : item.unit === "total" ? "للكل" : item.unit}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.isAccurate ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                                                        {item.isAccurate ? "وزن دقيق" : "وزن تقريبي"}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes & Preview */}
                            {(sa.notes || sa.allowPreview) && (
                                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-4">
                                    {sa.allowPreview && (
                                        <div>
                                            <h3 className="text-xs font-bold text-blue-400 flex items-center gap-1 mb-2">
                                                <span className="material-symbols-outlined !text-[15px]">visibility</span>
                                                مسموح بالمعاينة
                                            </h3>
                                            <p className="text-xs text-white">
                                                من {fmtDate(sa.previewStartDate)} إلى {fmtDate(sa.previewEndDate)} <br />
                                                الوقت: {sa.previewStartTime || "—"} حتى {sa.previewEndTime || "—"}
                                            </p>
                                        </div>
                                    )}
                                    {sa.notes && (
                                        <div className={sa.allowPreview ? "pt-3 border-t border-slate-800" : ""}>
                                            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-2">
                                                <span className="material-symbols-outlined !text-[15px]">notes</span>
                                                ملاحظات المعلن
                                            </h3>
                                            <p className="text-xs text-white whitespace-pre-wrap">{sa.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Seller Info */}
                            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                                <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-3">
                                    <span className="material-symbols-outlined !text-[15px]">person</span>
                                    معلومات المعلن
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {[
                                        { label: "الاسم", value: sa.seller.name },
                                        { label: "الهاتف", value: sa.seller.phone, eng: true },
                                        { label: "البريد الإلكتروني", value: sa.seller.email, eng: true },
                                        { label: "اسم الشركة", value: sa.seller.companyName || sa.seller.trader?.businessName },
                                        { label: "رقم الترخيص", value: sa.seller.trader?.licenseNumber, eng: true },
                                        { label: "المحافظة", value: sa.seller.trader?.governorate },
                                    ].filter(i => i.value).map(item => (
                                        <div key={item.label}>
                                            <p className="text-[10px] text-slate-500">{item.label}</p>
                                            <p className={`font-bold text-white text-xs ${item.eng ? "font-english" : ""}`}>{item.value || "—"}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Images */}
                            {sa.images.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[15px]">image</span>
                                        الصور والمرفقات ({sa.images.length})
                                    </h3>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {sa.images.map(img => (
                                            <a key={img.id} href={img.imageUrl} target="_blank" rel="noreferrer" className="shrink-0">
                                                <img src={img.imageUrl} alt="" className="w-28 h-28 object-cover rounded-xl border border-slate-700 hover:border-primary transition" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Documents */}
                            {sa.documents.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[15px]">feed</span>
                                        ملفات الشروط والأحكام ({sa.documents.length})
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {sa.documents.map(doc => (
                                            <a 
                                                key={doc.id} 
                                                href={doc.fileUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl p-3 flex items-center gap-3 transition group"
                                            >
                                                <span className="material-symbols-outlined text-blue-400 group-hover:scale-110 transition-transform">picture_as_pdf</span>
                                                <div className="flex-1 truncate">
                                                    <p className="text-xs text-white font-bold truncate">{doc.fileName || "ملف"}</p>
                                                    {doc.fileSize && <p className="text-[10px] text-slate-500 mt-0.5">{(doc.fileSize / 1024).toFixed(1)} KB</p>}
                                                </div>
                                                <span className="material-symbols-outlined text-slate-500 group-hover:text-blue-400 !text-[16px]">open_in_new</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {sa.images.length === 0 && sa.documents.length === 0 && (
                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400 flex items-center gap-2">
                                    <span className="material-symbols-outlined !text-[16px]">warning</span>
                                    لا توجد صور أو ملفات مرفقة بهذا المزاد
                                </div>
                            )}

                            {/* Chat - UNDER_REVIEW only */}
                            {sa.workflowStatus === "UNDER_REVIEW" && (
                                <div className="bg-slate-900 rounded-xl border border-blue-500/20 overflow-hidden">
                                    {/* Chat header with presence */}
                                    <div className="bg-blue-500/10 px-4 py-3 border-b border-blue-500/20 flex items-center gap-2">
                                        <span className="material-symbols-outlined !text-[18px] text-blue-400">chat</span>
                                        <h3 className="text-sm font-bold text-blue-400">محادثة مع المعلن</h3>
                                        <div className="mr-auto flex items-center gap-2">
                                            {otherPresence?.isTyping ? (
                                                <span className="text-[10px] text-green-400 font-bold animate-pulse">{otherPresence.name} يكتب...</span>
                                            ) : (
                                                <span className={`text-[10px] font-bold ${otherPresence?.isOnline ? "text-green-400" : "text-slate-500"}`}>
                                                    {otherPresence?.isOnline ? `● ${otherPresence.name} متصل` : "○ المعلن غير متصل"}
                                                </span>
                                            )}
                                            <span className={`w-2 h-2 rounded-full ${otherPresence?.isOnline ? "bg-green-400" : "bg-amber-400"}`} />
                                        </div>
                                    </div>
                                    <div className="h-52 overflow-y-auto p-3 space-y-2" dir="rtl">
                                        {messages.length === 0 && (
                                            <p className="text-center text-slate-500 text-xs py-8">ابدأ المحادثة مع المعلن</p>
                                        )}
                                        {messages.map(m => {
                                            // In RTL: ADMIN=right (justify-start), SELLER=left (justify-end)
                                            const isAdmin = m.payload?.senderRole === "ADMIN";
                                            return (
                                                <div key={m.id} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                                                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
                                                        isAdmin ? "bg-primary/20 rounded-tr-none" : "bg-slate-700 rounded-tl-none"
                                                    }`}>
                                                        <p className={`text-[9px] font-bold mb-1 ${isAdmin ? "text-primary" : "text-slate-400"}`}>
                                                            {m.payload?.senderName}
                                                        </p>
                                                        {m.payload?.fileUrl ? (
                                                            <a href={m.payload.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 underline">
                                                                <span className="material-symbols-outlined !text-[12px]">attach_file</span>
                                                                {m.payload.fileName || "مرفق"}
                                                            </a>
                                                        ) : (
                                                            <p className="text-white">{m.payload?.text}</p>
                                                        )}
                                                        <p className="text-[9px] text-slate-500 mt-1">{fmtTime(m.createdAt)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {/* Typing bubble for seller */}
                                        {otherPresence?.isTyping && (
                                            <div className="flex justify-end">
                                                <div className="px-3 py-2 rounded-xl rounded-tl-none bg-slate-700 flex gap-1 items-center">
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                </div>
                                            </div>
                                        )}
                                        <div ref={msgEndRef} />
                                    </div>
                                    <div className="flex gap-2 p-3 border-t border-slate-800" dir="rtl">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingFile}
                                            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 border border-slate-700 shrink-0"
                                            title="إرفاق ملف"
                                        >
                                            <span className="material-symbols-outlined !text-[16px]">{uploadingFile ? "hourglass_empty" : "attach_file"}</span>
                                        </button>
                                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*,.pdf,.doc,.docx" />
                                        <input
                                            value={newMsg}
                                            onChange={e => {
                                                setNewMsg(e.target.value);
                                                isTypingRef.current = true;
                                                if (typingTimeout.current) clearTimeout(typingTimeout.current);
                                                typingTimeout.current = setTimeout(() => { isTypingRef.current = false; }, 3000);
                                            }}
                                            onKeyDown={e => e.key === "Enter" && sendMessage()}
                                            placeholder="اكتب رسالة..."
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-primary"
                                        />
                                        <button
                                            onClick={() => sendMessage()}
                                            disabled={sendingMsg || !newMsg.trim()}
                                            className="bg-primary text-white px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined !text-[14px]">send</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-2 pb-8">
                                {sa.workflowStatus === "PENDING_APPROVAL" && (
                                    <button
                                        onClick={() => handleAction(sa.id, "start_review")}
                                        disabled={processing === sa.id}
                                        className="w-full mt-4 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition"
                                    >
                                        <span className="material-symbols-outlined !text-[18px]">find_in_page</span>
                                        نقل المزاد إلى قيد المراجعة
                                    </button>
                                )}
                                
                                {["PENDING_APPROVAL", "UNDER_REVIEW"].includes(sa.workflowStatus) && (
                                    <>
                                        {sa.workflowStatus === "UNDER_REVIEW" && (
                                            <button
                                                onClick={() => handleAction(sa.id, "approve")}
                                                disabled={processing === sa.id}
                                                className="w-full mt-4 py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition"
                                            >
                                                <span className="material-symbols-outlined !text-[18px]">check_circle</span>
                                                الموافقة ونشر المزاد
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setRejectModal(true)}
                                            disabled={processing === sa.id}
                                            className="w-full mt-2 py-3.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition"
                                        >
                                            <span className="material-symbols-outlined !text-[18px]">cancel</span>
                                            إلغاء المزاد نهائياً
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reject Modal */}
            {rejectModal && sa && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4">
                    <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-700 space-y-4">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-400">cancel</span>
                            رفض المزاد
                        </h3>
                        <p className="text-sm text-slate-400">"{sa.title}"</p>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="سبب الرفض (سيُرسل للمعلن)..."
                            rows={3}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleAction(sa.id, "reject", rejectReason)}
                                disabled={processing === sa.id}
                                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm disabled:opacity-50"
                            >
                                {processing === sa.id ? "جاري الرفض..." : "تأكيد الرفض"}
                            </button>
                            <button onClick={() => { setRejectModal(false); setRejectReason(""); }} className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-bold text-sm">
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
