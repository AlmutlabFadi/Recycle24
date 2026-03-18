"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

interface TraderDocument {
    id: string;
    type: string;
    fileUrl: string;
    status: string;
}

interface Trader {
    id: string;
    userId: string;
    businessName: string;
    verificationStatus: string;
    rejectionReason?: string;
    updatedAt: string;
    user: {
        name: string | null;
        phone: string | null;
        email: string | null;
    };
    documents: TraderDocument[];
}

    const statusMap: Record<string, { label: string; color: string; bg: string }> = {
        PENDING: { label: "قيد الانتظار", color: "text-amber-500", bg: "bg-amber-500/10" },
        UNDER_REVIEW: { label: "قيد المعالجة", color: "text-blue-500", bg: "bg-blue-500/10" },
        APPROVED: { label: "تم التوثيق", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        VERIFIED: { label: "تم التوثيق", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        REJECTED: { label: "مرفوض", color: "text-red-500", bg: "bg-red-500/10" },
    };

const docTypeMap: Record<string, string> = {
    IDENTITY_FRONT: "الهوية (وجه)",
    IDENTITY_BACK: "الهوية (خلف)",
    BUSINESS_LICENSE: "السجل التجاري",
    TRADER_REGISTRATION: "شهادة مزاولة المهنة",
    CHAMBER_MEMBERSHIP: "شهادة غرفة التجارة",
    LOCATION_PROOF: "إثبات موقع المستودع",
    DRIVING_LICENSE: "رخصة القيادة",
    VEHICLE_REGISTRATION: "ترخيص المركبة",
    SELFIE: "صورة شخصية",
};

// Document types allowed per account type
const allowedDocsByType: Record<string, string[]> = {
    CLIENT: ["IDENTITY_FRONT", "IDENTITY_BACK", "SELFIE"],
    GOVERNMENT: ["IDENTITY_FRONT", "IDENTITY_BACK", "SELFIE", "BUSINESS_LICENSE"],
    TRADER: ["IDENTITY_FRONT", "IDENTITY_BACK", "BUSINESS_LICENSE", "TRADER_REGISTRATION", "CHAMBER_MEMBERSHIP", "LOCATION_PROOF", "SELFIE"],
    DRIVER: ["IDENTITY_FRONT", "IDENTITY_BACK", "DRIVING_LICENSE", "VEHICLE_REGISTRATION", "SELFIE"],
};

export default function AdminVerificationPage() {
    const [traders, setTraders] = useState<any[]>([]); // Renamed loosely as it now holds diverse roles
    const [loading, setLoading] = useState(true);
    const [activeStatus, setActiveStatus] = useState("PENDING");
    const [activeType, setActiveType] = useState("TRADER");
    const [counts, setCounts] = useState<Record<string, number>>({ TRADER: 0, DRIVER: 0, CLIENT: 0, GOVERNMENT: 0 });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTrader, setSelectedTrader] = useState<any | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    
    // Granular statuses state
    const [fieldStatuses, setFieldStatuses] = useState<Record<string, { status: string; note: string }>>({});
    const [documentStatuses, setDocumentStatuses] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchTraders();
    }, [activeStatus, activeType]);

    // Initialize granular statuses when a trader is selected
    useEffect(() => {
        if (selectedTrader) {
            setFieldStatuses(selectedTrader.fieldStatuses || {});
            const docStatuses: Record<string, string> = {};
            (selectedTrader.documents || []).forEach((doc: any) => {
                docStatuses[doc.id] = doc.status;
            });
            setDocumentStatuses(docStatuses);
        }
    }, [selectedTrader]);

    async function fetchTraders() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/verification?status=${activeStatus}&type=${activeType}`);
            const data = await res.json();
            if (data.success) {
                setTraders(data.data);
                setCounts(data.counts);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateStatus(traderId: string, status: string) {
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/admin/verification/${traderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    status, 
                    type: activeType, // Pass the type so the API knows which model to update
                    rejectionReason: status === "REJECTED" ? rejectionReason : undefined,
                    fieldStatuses,
                    documentStatuses: Object.entries(documentStatuses).map(([id, s]) => ({ id, status: s }))
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSelectedTrader(null);
                setRejectionReason("");
                setFieldStatuses({});
                setDocumentStatuses({});
                fetchTraders();
            }
        } catch (error) {
            console.error("Error updating status:", error);
        } finally {
            setIsUpdating(false);
        }
    }

    const filteredTraders = Array.isArray(traders) ? traders.filter(t => {
        const name = (activeType === "TRADER" ? t.businessName : (t.user?.name || t.name)) || "";
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               t.user?.phone?.includes(searchQuery) ||
               t.phone?.includes(searchQuery);
    }) : [];

    function toggleFieldStatus(field: string, status: string) {
        setFieldStatuses(prev => ({
            ...prev,
            [field]: { status: prev[field]?.status === status ? "PENDING" : status, note: prev[field]?.note || "" }
        }));
    }

    function toggleDocStatus(docId: string, status: string) {
        setDocumentStatuses(prev => ({
            ...prev,
            [docId]: prev[docId] === status ? "PENDING" : status
        }));
    }

    const StatButton = ({ current, target, onClick, icon, colorClass }: any) => (
        <button
            onClick={onClick}
            className={`size-8 rounded-lg flex items-center justify-center transition-all border ${
                current === target 
                    ? `${colorClass} border-transparent shadow-lg text-white` 
                    : "bg-surface-highlight border-slate-700 text-slate-500 hover:text-white"
            }`}
        >
            <span className="material-symbols-outlined !text-lg">{icon}</span>
        </button>
    );

    // Document Viewer Component
    const [previewDoc, setPreviewDoc] = useState<string | null>(null);

    const InternalDocumentViewer = ({ url, onClose }: { url: string; onClose: () => void }) => (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md">
            <button onClick={onClose} className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined">close</span>
            </button>
            <div className="relative max-w-4xl max-h-[80vh] w-full flex items-center justify-center">
                <img src={url} alt="الوثيقة" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10" />
            </div>
            <div className="mt-8 flex gap-4">
                <a href={url} download target="_blank" className="flex items-center gap-2 bg-primary px-6 py-3 rounded-xl text-white hover:bg-primary-dark transition-all shadow-xl shadow-primary/20">
                    <span className="material-symbols-outlined">download</span>
                    <span className="font-bold">تحميل المستند</span>
                </a>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            {previewDoc && <InternalDocumentViewer url={previewDoc} onClose={() => setPreviewDoc(null)} />}
            <HeaderWithBack title="إدارة التوثيق والتحقق" />

            <main className="flex-1 p-4 lg:max-w-6xl lg:mx-auto w-full">
                {/* Role Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                    {[
                        { id: "TRADER", label: "التجار", icon: "storefront" },
                        { id: "DRIVER", label: "السائقين", icon: "local_shipping" },
                        { id: "CLIENT", label: "العملاء", icon: "person" },
                        { id: "GOVERNMENT", label: "الحكومي", icon: "account_balance" },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveType(tab.id)}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                activeType === tab.id 
                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                                : "bg-surface-highlight border-slate-800 text-slate-400 hover:text-white"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined">{tab.icon}</span>
                                <span className="font-bold text-sm">{tab.label}</span>
                            </div>
                            {counts[tab.id] > 0 && (
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                    activeType === tab.id ? "bg-white text-primary" : "bg-primary text-white"
                                }`}>
                                    {counts[tab.id]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Status Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2 border-b border-slate-800/50">
                    {["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setActiveStatus(status)}
                            className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                                activeStatus === status
                                    ? "bg-white/10 text-white border border-white/20"
                                    : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            {statusMap[status].label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="ابحث بالاسم، اسم العمل، أو رقم الهاتف..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface-highlight border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-white focus:border-primary transition outline-none"
                    />
                </div>

                {/* Export Buttons */}
                <div className="relative mb-6">
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600/10 border border-emerald-600/30 text-emerald-500 rounded-2xl font-bold text-sm hover:bg-emerald-600/20 transition"
                    >
                        <span className="material-symbols-outlined !text-lg">download</span>
                        تصدير Excel
                        <span className="material-symbols-outlined !text-sm">{showExportMenu ? 'expand_less' : 'expand_more'}</span>
                    </button>

                    {showExportMenu && (
                        <div className="absolute top-full mt-2 right-0 bg-surface-dark border border-slate-700 rounded-2xl shadow-2xl z-50 min-w-[280px] p-2 space-y-1">
                            {[
                                { label: `تصدير العرض الحالي (${statusMap[activeStatus]?.label || activeStatus})`, type: activeType, status: activeStatus, icon: "filter_alt" },
                                { label: "تصدير الحسابات الموثقة", type: "ALL", status: "APPROVED", icon: "verified" },
                                { label: "تصدير الحسابات المرفوضة", type: "ALL", status: "REJECTED", icon: "cancel" },
                                { label: "تصدير جميع التجار", type: "TRADER", status: "ALL", icon: "storefront" },
                                { label: "تصدير جميع السائقين", type: "DRIVER", status: "ALL", icon: "local_shipping" },
                                { label: "تصدير جميع العملاء", type: "CLIENT", status: "ALL", icon: "person" },
                                { label: "تصدير الحسابات الحكومية", type: "GOVERNMENT", status: "ALL", icon: "account_balance" },
                                { label: "تصدير كل الحسابات", type: "ALL", status: "ALL", icon: "select_all" },
                            ].map((opt, i) => (
                                <button
                                    key={i}
                                    disabled={isExporting}
                                    onClick={async () => {
                                        setIsExporting(true);
                                        try {
                                            const res = await fetch(`/api/admin/verification/export?type=${opt.type}&status=${opt.status}`);
                                            if (!res.ok) throw new Error("فشل التصدير");
                                            const blob = await res.blob();
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement("a");
                                            a.href = url;
                                            a.download = `Recycle24_${opt.type}_${opt.status}_${new Date().toISOString().split("T")[0]}.xlsx`;
                                            document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                            URL.revokeObjectURL(url);
                                        } catch (err) {
                                            console.error("Export failed:", err);
                                            alert("فشل تصدير البيانات. حاول مرة أخرى.");
                                        } finally {
                                            setIsExporting(false);
                                            setShowExportMenu(false);
                                        }
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition text-right disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined !text-lg text-slate-500">{opt.icon}</span>
                                    {isExporting ? "جاري التصدير..." : opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Traders List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : filteredTraders.length === 0 ? (
                    <div className="text-center py-20 bg-surface-highlight rounded-3xl border border-slate-800">
                        <span className="material-symbols-outlined !text-6xl text-slate-600 mb-4">person_search</span>
                        <p className="text-slate-400 font-medium">لا يوجد طلبات توثيق مطابقة</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTraders.map((trader) => {
                            const isUserFallback = activeType === "CLIENT" || activeType === "GOVERNMENT";
                            let vStatus = trader.verificationStatus || trader.status || "PENDING";
                            if (vStatus === "VERIFIED") vStatus = "APPROVED";
                            if (isUserFallback && trader.isVerified) vStatus = "APPROVED";
                            
                            const tStatus = statusMap[vStatus] || statusMap["PENDING"];
                            const name = isUserFallback ? (trader.user?.name || trader.name || trader.businessName || "بدون اسم") : (trader.businessName || trader.fullName || trader.user?.name || "بدون اسم");
                            const subName = isUserFallback ? "" : trader.user?.name;
                            const phone = isUserFallback ? (trader.user?.phone || trader.phone) : (trader.user?.phone || trader.phone);
                            const allDocs = trader.documents || [];
                            const allowedTypes = allowedDocsByType[activeType] || [];
                            const docs = allDocs.filter((d: any) => allowedTypes.includes(d.type));
                            const icon = activeType === "TRADER" ? "store" : activeType === "DRIVER" ? "local_shipping" : activeType === "GOVERNMENT" ? "account_balance" : "person";

                            return (
                            <div
                                key={trader.id}
                                onClick={() => setSelectedTrader(trader)}
                                className="bg-surface-highlight border border-slate-700 rounded-3xl p-5 hover:border-primary/50 transition cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition">
                                        <span className="material-symbols-outlined !text-2xl">{icon}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${tStatus.bg} ${tStatus.color}`}>
                                        {tStatus.label}
                                    </span>
                                </div>
                                <h3 className="text-white font-bold mb-1">{name}</h3>
                                {subName && <p className="text-sm text-slate-400 mb-4">{subName}</p>}
                                {!subName && <p className="text-sm text-transparent mb-4">.</p>}
                                
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="material-symbols-outlined !text-sm">call</span>
                                        <span className="font-english">{phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="material-symbols-outlined !text-sm">calendar_month</span>
                                        <span>{new Date(trader.updatedAt || trader.createdAt).toLocaleDateString("ar-SY")}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                    <span className="text-[10px] text-slate-500">{docs.length} مستندات مرفقة</span>
                                    <span className="text-primary text-xs font-bold flex items-center gap-1">
                                        {vStatus === "UNDER_REVIEW" ? "متابعة المعالجة" : "مراجعة الطلب"}
                                        <span className="material-symbols-outlined !text-sm">arrow_back</span>
                                    </span>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </main>

            {/* Detail Modal */}
            {selectedTrader && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-bg-dark border border-slate-800 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-surface-highlight/30">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">تفاصيل التوثيق - {activeType === "TRADER" ? "تاجر" : activeType === "DRIVER" ? "سائق" : "حساب"}</h2>
                                <p className="text-sm text-slate-400">{(activeType === "TRADER" ? selectedTrader.businessName : (selectedTrader.user?.name || selectedTrader.name))}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedTrader(null)}
                                className="size-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 transition"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                            {/* Personal Info Bar */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-highlight/20 p-6 rounded-3xl border border-slate-800">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">الاسم الكامل</p>
                                    <p className="text-sm text-white font-medium">{selectedTrader.user?.name || selectedTrader.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">رقم الهاتف</p>
                                    <p className="text-sm text-white font-english">{selectedTrader.user?.phone || selectedTrader.phone}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">نوع الحساب</p>
                                    <p className="text-sm text-primary font-bold">{selectedTrader.user?.userType || selectedTrader.userType || activeType}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تاريخ الانضمام</p>
                                    <p className="text-sm text-white">{new Date(selectedTrader.user?.createdAt || selectedTrader.createdAt).toLocaleDateString("ar-SY")}</p>
                                </div>
                            </div>

                            {/* Role Specific Fields */}
                            {activeType === "TRADER" && (
                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined !text-sm">store</span>
                                        بيانات طلب التوثيق - تاجر
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: "businessName", label: "الاسم التجاري", value: selectedTrader.businessName || selectedTrader.trader?.businessName },
                                            { id: "registrationNumber", label: "رقم السجل التجاري", value: selectedTrader.registrationNumber || selectedTrader.trader?.registrationNumber },
                                            { id: "taxNumber", label: "الرقم الضريبي", value: selectedTrader.taxNumber || selectedTrader.trader?.taxNumber },
                                            { id: "chamberRegistrationNumber", label: "رقم غرفة التجارة", value: selectedTrader.chamberRegistrationNumber || selectedTrader.trader?.chamberRegistrationNumber },
                                            { id: "fatherName", label: "اسم الأب", value: selectedTrader.fatherName || selectedTrader.trader?.fatherName },
                                            { id: "motherName", label: "اسم الأم", value: selectedTrader.motherName || selectedTrader.trader?.motherName },
                                            { id: "dateOfBirth", label: "تاريخ الميلاد", value: (selectedTrader.dateOfBirth || selectedTrader.trader?.dateOfBirth) ? new Date(selectedTrader.dateOfBirth || selectedTrader.trader?.dateOfBirth).toLocaleDateString("ar-SY") : null },
                                        ].map(field => field.value && (
                                            <div key={field.id} className="flex items-center justify-between p-4 bg-surface-highlight/40 rounded-2xl border border-slate-800">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 mb-0.5">{field.label}</p>
                                                    <p className="text-sm text-white font-medium">{field.value}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <StatButton current={fieldStatuses[field.id]?.status} target="APPROVED" icon="check" colorClass="bg-emerald-600" onClick={() => toggleFieldStatus(field.id, "APPROVED")} />
                                                    <StatButton current={fieldStatuses[field.id]?.status} target="REJECTED" icon="close" colorClass="bg-red-600" onClick={() => toggleFieldStatus(field.id, "REJECTED")} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Client/Government: Only show personal identity fields */}
                            {(activeType === "CLIENT" || activeType === "GOVERNMENT") && (
                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined !text-sm">person_check</span>
                                        بيانات التحقق من الهوية
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: "fullName", label: "الاسم الكامل", value: selectedTrader.user?.name || selectedTrader.name || selectedTrader.trader?.fullName },
                                            { id: "fatherName", label: "اسم الأب", value: selectedTrader.trader?.fatherName },
                                            { id: "motherName", label: "اسم الأم", value: selectedTrader.trader?.motherName },
                                            { id: "dateOfBirth", label: "تاريخ الميلاد", value: selectedTrader.trader?.dateOfBirth ? new Date(selectedTrader.trader.dateOfBirth).toLocaleDateString("ar-SY") : null },
                                        ].map(field => field.value && (
                                            <div key={field.id} className="flex items-center justify-between p-4 bg-surface-highlight/40 rounded-2xl border border-slate-800">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 mb-0.5">{field.label}</p>
                                                    <p className="text-sm text-white font-medium">{field.value}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <StatButton current={fieldStatuses[field.id]?.status} target="APPROVED" icon="check" colorClass="bg-emerald-600" onClick={() => toggleFieldStatus(field.id, "APPROVED")} />
                                                    <StatButton current={fieldStatuses[field.id]?.status} target="REJECTED" icon="close" colorClass="bg-red-600" onClick={() => toggleFieldStatus(field.id, "REJECTED")} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {activeType === "DRIVER" && (
                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined !text-sm">minor_crash</span>
                                        بيانات المركبة والسائق
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedTrader.vehicles?.[0] && (
                                            <>
                                                <div className="p-4 bg-surface-highlight/40 rounded-2xl border border-slate-800">
                                                    <p className="text-[10px] text-slate-500 mb-0.5">رقم اللوحة</p>
                                                    <p className="text-sm text-white font-bold">{selectedTrader.vehicles[0].plateNumber}</p>
                                                </div>
                                                <div className="p-4 bg-surface-highlight/40 rounded-2xl border border-slate-800">
                                                    <p className="text-[10px] text-slate-500 mb-0.5">نوع المركبة</p>
                                                    <p className="text-sm text-white font-medium">{selectedTrader.vehicles[0].make}</p>
                                                </div>
                                            </>
                                        )}
                                        <div className="p-4 bg-surface-highlight/40 rounded-2xl border border-slate-800">
                                            <p className="text-[10px] text-slate-500 mb-0.5">المحافظة / المدينة</p>
                                            <p className="text-sm text-white font-medium">{selectedTrader.city || selectedTrader.location || "---"}</p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Documents Section - Filtered by account type */}
                            <section>
                                {(() => {
                                    const allowed = allowedDocsByType[activeType] || [];
                                    const allDocs = selectedTrader.documents || [];
                                    // Filter docs by type and deduplicate by type+url
                                    const seen = new Set<string>();
                                    const filteredDocs = allDocs.filter((doc: any) => {
                                        if (!allowed.includes(doc.type)) return false;
                                        const key = `${doc.type}_${doc.fileUrl}`;
                                        if (seen.has(key)) return false;
                                        seen.add(key);
                                        return true;
                                    });
                                    return (
                                        <>
                                            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined !text-sm">description</span>
                                                المستندات والمرفقات ({filteredDocs.length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {filteredDocs.map((doc: any) => (
                                                    <div key={doc.id} className="p-4 bg-surface-highlight/40 rounded-3xl border border-slate-800 flex flex-col gap-4">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs text-white font-bold">{docTypeMap[doc.type] || doc.type}</p>
                                                            <div className="flex gap-1">
                                                                <StatButton current={documentStatuses[doc.id]} target="APPROVED" icon="check" colorClass="bg-emerald-600" onClick={() => toggleDocStatus(doc.id, "APPROVED")} />
                                                                <StatButton current={documentStatuses[doc.id]} target="REJECTED" icon="close" colorClass="bg-red-600" onClick={() => toggleDocStatus(doc.id, "REJECTED")} />
                                                            </div>
                                                        </div>
                                                        <div 
                                                            onClick={() => setPreviewDoc(doc.fileUrl)}
                                                            className="relative aspect-video rounded-2xl border border-slate-700 overflow-hidden group cursor-zoom-in"
                                                        >
                                                            <img src={doc.fileUrl} alt={docTypeMap[doc.type] || doc.type} className="w-full h-full object-cover group-hover:scale-105 transition" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-white shadow-lg">zoom_in</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {filteredDocs.length === 0 && (
                                                    <p className="text-center py-4 text-slate-500 text-sm col-span-2">لا يوجد مستندات مرفقة لهذا الحساب</p>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </section>

                            {/* Rejection Note */}
                            <div className="space-y-3">
                                <label className="text-xs text-slate-500 font-bold block text-right">ملاحظات إضافية (تظهر للمستخدم)</label>
                                <textarea
                                    className="w-full bg-surface-highlight border border-slate-800 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none transition h-24 text-right"
                                    placeholder="اكتب سبب الرفض أو ملاحظات للمعالجة..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="p-6 border-t border-slate-800 bg-surface-highlight/30 flex flex-col md:flex-row gap-3">
                            {(selectedTrader.verificationStatus === "PENDING" || selectedTrader.status === "PENDING") && selectedTrader.verificationStatus !== "UNDER_REVIEW" ? (
                                <button
                                    onClick={() => handleUpdateStatus(selectedTrader.id, "UNDER_REVIEW")}
                                    disabled={isUpdating}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">visibility</span>
                                    <span>بدء المعالجة</span>
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedTrader.id, "APPROVED")}
                                        disabled={isUpdating}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">verified</span>
                                        <span>اعتماد وتوثيق الحساب</span>
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedTrader.id, "REJECTED")}
                                        disabled={isUpdating}
                                        className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold py-4 rounded-2xl border border-red-600/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">block</span>
                                        <span>رفض الطلب نهائياً</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
