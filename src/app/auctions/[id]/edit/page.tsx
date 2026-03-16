"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useAuth } from "@/contexts/AuthContext";

interface AuctionItem { type: string; customType: string | null; weight: number; unit: string; isAccurate: boolean;  }
interface TermsFile { url: string; name: string; size: number; }
interface AuctionImage { id: string; imageUrl: string; order: number; }

export default function EditAuctionPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const auctionId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    
    // Core details
    const [title, setTitle] = useState("");
    const [organization, setOrganization] = useState("");

    // Materials (items)
    const [materials, setMaterials] = useState<AuctionItem[]>([]);
    const [currentMaterial, setCurrentMaterial] = useState<AuctionItem>({
        type: "IRON", customType: "", weight: 0, unit: "TON", isAccurate: false
    });
    const [showMaterialModal, setShowMaterialModal] = useState(false);

    // Images
    const [existingImages, setExistingImages] = useState<AuctionImage[]>([]);

    // Locations
    const [governorate, setGovernorate] = useState("");
    const [address, setAddress] = useState("");

    // Pricing
    const [pricingMode, setPricingMode] = useState("TOTAL");
    const [startingPrice, setStartingPrice] = useState("");
    const [currency, setCurrency] = useState("SYP");

    // Preview
    const [allowPreview, setAllowPreview] = useState(false);
    const [previewStartDate, setPreviewStartDate] = useState("");
    const [previewEndDate, setPreviewEndDate] = useState("");
    const [previewStartTime, setPreviewStartTime] = useState("");
    const [previewEndTime, setPreviewEndTime] = useState("");

    // Terms
    const [termsFiles, setTermsFiles] = useState<TermsFile[]>([]);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    
    // Deposit & Dates
    const [securityDeposit, setSecurityDeposit] = useState("");
    const [depositCurrency, setDepositCurrency] = useState("SYP");
    const [depositMethod, setDepositMethod] = useState("BANK_TRANSFER");
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [hasDuration, setHasDuration] = useState(true);
    const [days, setDays] = useState("");
    const [hours, setHours] = useState("");
    const [shipmentDays, setShipmentDays] = useState("");

    // Notes
    const [notes, setNotes] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!auctionId) return;
        fetch(`/api/auctions/${auctionId}`)
            .then(r => r.json())
            .then(d => {
                const a = d.auction;
                if (!a) { setError("المزاد غير موجود"); setLoading(false); return; }
                if (a.workflowStatus !== "PENDING_APPROVAL") {
                    setError("لا يمكن تعديل هذا المزاد في الوضع الحالي");
                    setLoading(false); return;
                }
                
                setTitle(a.title || "");
                setOrganization(a.organization || "");
                
                // Location splitting heuristics
                const locParts = (a.location || "").split(", ");
                if (locParts.length > 1) {
                    setGovernorate(locParts[0]);
                    setAddress(locParts.slice(1).join(", "));
                } else {
                    setGovernorate(a.location || "");
                }

                setPricingMode(a.pricingMode || "TOTAL");
                setStartingPrice(String(a.startingBid || ""));
                setCurrency(a.startingBidCurrency || "SYP");
                
                setAllowPreview(a.allowPreview || false);
                if (a.previewStartDate) setPreviewStartDate(new Date(a.previewStartDate).toISOString().split('T')[0]);
                if (a.previewEndDate) setPreviewEndDate(new Date(a.previewEndDate).toISOString().split('T')[0]);
                setPreviewStartTime(a.previewStartTime || "");
                setPreviewEndTime(a.previewEndTime || "");

                setSecurityDeposit(String(a.securityDeposit || ""));
                setDepositCurrency(a.securityDepositCurrency || "SYP");
                setDepositMethod(a.securityDepositMethod || "BANK_TRANSFER");

                if (a.scheduledAt) {
                    const dObj = new Date(a.scheduledAt);
                    setStartDate(dObj.toISOString().split('T')[0]);
                    setStartTime(`${String(dObj.getHours()).padStart(2, '0')}:${String(dObj.getMinutes()).padStart(2, '0')}`);
                }

                setShipmentDays(String(a.shipmentDurationDays || ""));
                setNotes(a.notes || "");
                setExistingImages(a.images || []);

                // Fetch full details for items and documents using a separate admin call (since public route doesn't include them yet!)
                // (or just rely on the new public route returning everything we need)
                fetch(`/api/admin/auctions`)
                    .then(res => res.json())
                    .then(adminData => {
                        const target = adminData.auctions?.find((ax: any) => ax.id === auctionId);
                        if (target) {
                            if (target.items) {
                                setMaterials(target.items.map((it: any) => ({
                                    type: it.type, customType: it.customType, weight: it.weight, unit: it.unit, isAccurate: it.isAccurate
                                })));
                            }
                            if (target.documents) {
                                setTermsFiles(target.documents.map((doc: any) => ({
                                    url: doc.fileUrl, name: doc.fileName || "ملف", size: doc.fileSize || 0
                                })));
                            }
                        }
                    });

                setLoading(false);
            })
            .catch(() => { setError("فشل تحميل بيانات المزاد"); setLoading(false); });
    }, [auctionId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingDoc(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (data.url) {
                setTermsFiles(prev => [...prev, { url: data.url, name: file.name, size: file.size }]);
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (e) {
            console.error("Upload failed", e);
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleRemoveDoc = (index: number) => {
        setTermsFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddMaterial = () => {
        if (!currentMaterial.weight || currentMaterial.weight <= 0) return;
        setMaterials(prev => [...prev, { ...currentMaterial }]);
        setCurrentMaterial({ type: "IRON", customType: "", weight: 0, unit: "TON", isAccurate: false });
        setShowMaterialModal(false);
    };

    const handleRemoveMaterial = (idx: number) => {
        setMaterials(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let sDate = undefined;
            if (startDate && startTime) {
                sDate = new Date(`${startDate}T${startTime}`);
            }

            const payload = {
                title, 
                organization,
                governorate,
                address,
                
                pricingMode,
                startingPrice: startingPrice ? Number(startingPrice) : undefined,
                startingBidCurrency: currency,
                startingBidUnit: pricingMode === "TOTAL" ? "TOTAL" : "PER_UNIT",
                
                allowPreview,
                previewStartDate: previewStartDate || null,
                previewEndDate: previewEndDate || null,
                previewStartTime,
                previewEndTime,

                securityDeposit: securityDeposit ? Number(securityDeposit) : 0,
                securityDepositCurrency: depositCurrency,
                securityDepositMethod: depositMethod,

                startDate: sDate,
                
                shipmentDurationDays: shipmentDays ? Number(shipmentDays) : undefined,
                notes,

                items: materials,
                documents: termsFiles.map(f => ({ fileUrl: f.url, fileName: f.name, fileSize: f.size }))
            };

            const res = await fetch(`/api/auctions/${auctionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "فشل الحفظ");
            router.push("/auctions/my-auctions");
        } catch (e) {
            setError(e instanceof Error ? e.message : "فشل الحفظ");
            setSaving(false);
        }
    };

    if (loading) return <div className="flex flex-col min-h-screen bg-bg-dark items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    if (error) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark">
                <HeaderWithBack title="تعديل المزاد" />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <span className="material-symbols-outlined !text-[60px] text-red-500 mb-4">error</span>
                    <h3 className="text-white font-bold text-lg mb-2">غير متاح</h3>
                    <p className="text-slate-400 text-sm mb-6">{error}</p>
                    <button onClick={() => router.push("/auctions/my-auctions")} className="bg-primary text-white px-6 py-3 rounded-xl font-bold">مزاداتي</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display pb-12" dir="rtl">
            <HeaderWithBack title="تعديل المزاد" />

            <main className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
                    <span className="material-symbols-outlined !text-[18px] text-amber-400 mt-0.5">info</span>
                    <p className="text-xs text-amber-400">يمكنك التعديل فقط أثناء انتظار مراجعة الإدارة. (لتعديل الصور، تواصل مع الإدارة).</p>
                </div>

                {existingImages.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white">الصور المرفوعة مسبقاً</label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {existingImages.map(img => (
                                <img key={img.id} src={img.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-700" />
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-primary border-b border-slate-800 pb-2">المعلومات الأساسية</h2>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white">عنوان المزاد</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 outline-none" placeholder="مثال: خردة حديد وسيارات" />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white">المؤسسة / الشركة</label>
                        <input value={organization} onChange={e => setOrganization(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 outline-none" placeholder="اسم الجهة البائعة" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white">المحافظة</label>
                            <select value={governorate} onChange={e => setGovernorate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 outline-none">
                                <option value="">اختر...</option>
                                <option value="دمشق">دمشق</option>
                                <option value="ريف دمشق">ريف دمشق</option>
                                <option value="حلب">حلب</option>
                                <option value="حمص">حمص</option>
                                <option value="حماة">حماة</option>
                                <option value="اللاذقية">اللاذقية</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white">العنوان التفصيلي</label>
                            <input value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 outline-none" placeholder="المنطقة، الشارع" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h2 className="text-lg font-bold text-primary">المواد المعروضة</h2>
                        <button onClick={() => setShowMaterialModal(true)} type="button" className="text-xs font-bold bg-primary/20 text-primary px-3 py-1.5 rounded-lg flex items-center gap-1">
                            <span className="material-symbols-outlined !text-[14px]">add</span> إضافة مادة
                        </button>
                    </div>

                    {materials.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-700 rounded-xl">لم تتم إضافة أي مواد</p>
                    ) : (
                        <div className="space-y-3">
                            {materials.map((m, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-900 border border-slate-700 p-3 rounded-xl">
                                    <div>
                                        <p className="font-bold text-sm text-white">{m.type === "OTHER" ? (m.customType || "أخرى") : m.type}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{m.weight} {m.unit === "KG" ? "كغ" : "طن"} {m.isAccurate ? "(دقيق)" : "(تقريبي)"}</p>
                                    </div>
                                    <button onClick={() => handleRemoveMaterial(idx)} type="button" className="text-red-400 p-2"><span className="material-symbols-outlined !text-[18px]">delete</span></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-primary border-b border-slate-800 pb-2">التسعير</h2>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white">طريقة التسعير</label>
                        <select value={pricingMode} onChange={e => setPricingMode(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 outline-none">
                            <option value="TOTAL">السعر الإجمالي (للمزاد كاملاً)</option>
                            <option value="FIXED_BASKET">سلة أسعار (سعر منفصل لكل نوع)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white">سعر البدء المتوقع</label>
                            <input type="number" value={startingPrice} onChange={e => setStartingPrice(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white font-mono focus:ring-2 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white">العملة</label>
                            <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 outline-none">
                                <option value="SYP">ليرة سورية</option>
                                <option value="USD">دولار أمريكي</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-primary border-b border-slate-800 pb-2">شروط الاشتراك والضمانات</h2>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white">مبلغ التأمين</label>
                            <input type="number" value={securityDeposit} onChange={e => setSecurityDeposit(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white font-mono focus:ring-2 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white">العملة</label>
                            <select value={depositCurrency} onChange={e => setDepositCurrency(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 outline-none">
                                <option value="SYP">ليرة سورية</option>
                                <option value="USD">دولار أمريكي</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-white">ملفات الشروط والعقود (PDF/Word)</label>
                            <button onClick={() => fileInputRef.current?.click()} type="button" disabled={uploadingDoc} className="text-xs font-bold bg-slate-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                                <span className="material-symbols-outlined !text-[14px]">attach_file</span> إرفاق
                            </button>
                            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
                        </div>
                        <div className="space-y-2 mt-2">
                            {termsFiles.map((f, i) => (
                                <div key={i} className="flex items-center justify-between bg-slate-900 border border-slate-700 p-2.5 rounded-xl">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="material-symbols-outlined text-slate-400">description</span>
                                        <p className="text-sm text-white truncate">{f.name}</p>
                                    </div>
                                    <button onClick={() => handleRemoveDoc(i)} type="button" className="text-red-400 p-1"><span className="material-symbols-outlined !text-[18px]">close</span></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-primary border-b border-slate-800 pb-2">التواريخ والاستلام</h2>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white">تاريخ البدء</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white">ساعة البدء</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 outline-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white">مدة الترحيل المسموحة (أيام)</label>
                        <input type="number" value={shipmentDays} onChange={e => setShipmentDays(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white font-mono focus:ring-2 outline-none" placeholder="مثال: 15" />
                    </div>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

                <button
                    onClick={handleSave}
                    disabled={saving || !title}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base disabled:opacity-50 transition mt-6"
                >
                    {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
            </main>

            {/* Material Modal */}
            {showMaterialModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end p-4 pb-8">
                    <div className="bg-bg-dark border border-slate-700 rounded-t-2xl p-6 w-full max-w-sm mx-auto space-y-4 shadow-lg mb-0 animate-slide-up">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-white text-lg">إضافة مادة</h3>
                            <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-slate-300">النوع</label>
                            <select value={currentMaterial.type} onChange={e => setCurrentMaterial({...currentMaterial, type: e.target.value, customType: ""})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white">
                                <option value="IRON">حديد</option><option value="COPPER">نحاس</option><option value="ALUMINUM">ألمنيوم</option>
                                <option value="PLASTIC">بلاستيك</option><option value="CARDBOARD">كرتون</option><option value="MIXED">خلطة مباني</option>
                                <option value="OTHER">أخرى...</option>
                            </select>
                            {currentMaterial.type === "OTHER" && (
                                <input placeholder="حدد النوع..." value={currentMaterial.customType || ""} onChange={e => setCurrentMaterial({...currentMaterial, customType: e.target.value})} className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" />
                            )}
                        </div>

                        <div className="flex gap-2">
                            <div className="space-y-2 flex-[2]">
                                <label className="text-sm text-slate-300">الكمية</label>
                                <input type="number" value={currentMaterial.weight || ""} onChange={e => setCurrentMaterial({...currentMaterial, weight: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono" />
                            </div>
                            <div className="space-y-2 flex-1">
                                <label className="text-sm text-slate-300">الوحدة</label>
                                <select value={currentMaterial.unit} onChange={e => setCurrentMaterial({...currentMaterial, unit: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white">
                                    <option value="TON">طن</option><option value="KG">كغ</option>
                                </select>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer mt-2 bg-slate-900 border border-slate-700 p-3 rounded-xl hover:bg-slate-800">
                            <input type="checkbox" checked={currentMaterial.isAccurate} onChange={e => setCurrentMaterial({...currentMaterial, isAccurate: e.target.checked})} className="accent-primary w-4 h-4" />
                            <span className="text-sm text-slate-300 pointer-events-none">الوزن تقريبي (على الميزان القبان)</span>
                        </label>

                        <button onClick={handleAddMaterial} className="w-full bg-primary text-white py-3 rounded-xl font-bold mt-4 disabled:opacity-50" disabled={!currentMaterial.weight}>إضافة المادة</button>
                    </div>
                </div>
            )}
            <style jsx>{`
                .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
                @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
