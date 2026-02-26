"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface MediaFile {
    url: string;
    type: 'image' | 'video';
    file: File;
}

export default function NewStolenReportPage() {
    const router = useRouter();
    const { activeRole } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        reportingOrg: "",
        type: "",
        customItemType: "", // For "Other" type

        description: "",
        location: "",
        contactPhone: "",
        plateNumber: "",
        vehicleType: "",
        vehicleColor: "",
        stolenDate: "",
    });

    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [itemFiles, setItemFiles] = useState<MediaFile[]>([]); // New state for item photos
    const itemFileInputRef = useRef<HTMLInputElement>(null); // New ref for item photos

    // Handle File Selection for Evidence
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const newMedia = files.map(file => ({
                url: URL.createObjectURL(file),
                type: file.type.startsWith('video') ? 'video' : 'image' as 'video' | 'image',
                file
            }));
            setMediaFiles(prev => [...prev, ...newMedia]);
        }
    };

    // Handle File Selection for Item Photos
    const handleItemFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const newMedia = files.map(file => ({
                url: URL.createObjectURL(file),
                type: file.type.startsWith('video') ? 'video' : 'image' as 'video' | 'image',
                file
            }));
            setItemFiles(prev => [...prev, ...newMedia]);
        }
    };

    // Remove Media
    const removeMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Remove Item Photo
    const removeItemMedia = (index: number) => {
        setItemFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        // ... (truncated here, but placed above return)
        e.preventDefault();
        setIsSubmitting(true);
        // ... existing logic ...
        try {
            const res = await fetch("/api/stolen-reports", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reportingOrg: formData.reportingOrg,
                    type: formData.type === "معدات أخرى" ? formData.customItemType : formData.type,
                    description: formData.description,
                    location: formData.location,
                    contactPhone: formData.contactPhone,
                    plateNumber: formData.plateNumber,
                    vehicleType: formData.vehicleType,
                    vehicleColor: formData.vehicleColor,
                    stolenDate: formData.stolenDate,
                    images: [], 
                    videos: []
                }),
            });
            const data = await res.json();
            if (data.success) {
                alert("تم تقديم البلاغ بنجاح!");
                router.push("/stolen-reports");
            } else {
                alert(data.error || "حدث خطأ أثناء تقديم البلاغ");
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert("فشل الاتصال بالخادم");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (activeRole !== "TRADER") {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark font-display items-center justify-center p-4">
                <HeaderWithBack title="إبلاغ عن سرقة" />
                <div className="text-center mt-20">
                    <span className="material-symbols-outlined !text-[64px] text-red-500 mb-4">gavel</span>
                    <h2 className="text-xl font-bold text-white mb-2">عذراً، غير مصرح لك</h2>
                    <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                        هذا الحساب حساب عميل وغير مصرح له بإضافة بلاغات. يجب أن يكون لك حساب تاجر.
                    </p>
                    <button onClick={() => router.back()} className="px-6 py-3 bg-surface-highlight text-white rounded-xl hover:bg-slate-700 transition">
                        العودة للسابق
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="إبلاغ عن سرقة" />

            <main className="flex-1 pb-24 p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Alert */}
                    <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-400 !text-[24px]">report</span>
                            <div>
                                <h3 className="font-bold text-red-400 text-sm mb-1">تحذير هام</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    الإبلاغ الكاذب عن سرقة يعد جريمة يعاقب عليها القانون. يرجى التأكد من صحة جميع المعلومات.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Reporting Organization */}
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                        <label className="text-sm font-bold text-white mb-2 block">الجهة المبلغة *</label>
                        <select
                            required
                            value={formData.reportingOrg}
                            onChange={(e) => setFormData({ ...formData, reportingOrg: e.target.value })}
                            className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-sm text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">اختر الجهة...</option>
                            <option value="مديرية كهرباء دمشق">مديرية كهرباء دمشق</option>
                            <option value="مديرية كهرباء ريف دمشق">مديرية كهرباء ريف دمشق</option>
                            <option value="مديرية الاتصالات">مديرية الاتصالات</option>
                            <option value="مديرية النقل">مديرية النقل</option>
                            <option value="وزارة الدفاع">وزارة الدفاع</option>
                            <option value="بلدية دمشق">بلدية دمشق</option>
                            <option value="بلدية حلب">بلدية حلب</option>
                            <option value="بلدية حمص">بلدية حمص</option>
                            <option value="شركة مياه الشرب">شركة مياه الشرب</option>
                            <option value="أخرى">أخرى</option>
                        </select>

                        {/* Dynamic "Other" field */}
                        {formData.reportingOrg === "أخرى" && (
                            <input
                                type="text"
                                placeholder="اكتب اسم الجهة المبلغة..."
                                className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary mt-3 animate-in fade-in slide-in-from-top-2 duration-300"
                                required
                            />
                        )}
                    </div>

                    {/* Item Type */}
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                        <label className="text-sm font-bold text-white mb-2 block">نوع المادة المسروقة *</label>
                        <select
                            required
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-sm text-white focus:ring-2 focus:ring-primary"
                        >
                            <option value="">اختر النوع...</option>
                            <option value="كابل كهرباء">كابل كهرباء</option>
                            <option value="كابل إنترنت">كابل إنترنت</option>
                            <option value="خط كهرباء هوائي">خط كهرباء هوائي</option>
                            <option value="راقارات">راقارات (Radiators)</option>
                            <option value="أغطية بالوعات">أغطية بالوعات</option>
                            <option value="حديد مباني">حديد مباني</option>
                            <option value="نحاس">نحاس</option>
                            <option value="ألمنيوم">ألمنيوم</option>
                            <option value="معدات أخرى">معدات أخرى</option>
                        </select>

                        {/* Custom Item Type Input */}
                        {formData.type === "معدات أخرى" && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 mt-3">
                                <label className="text-xs text-slate-400 mb-1 block">اسم المادة أو المعدات</label>
                                <input
                                    type="text"
                                    value={formData.customItemType}
                                    onChange={(e) => setFormData({ ...formData, customItemType: e.target.value })}
                                    placeholder="اكتب اسم المادة المسروقة..."
                                    className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                        <label className="text-sm font-bold text-white mb-2 block">وصف تفصيلي *</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="اذكر تفاصيل دقيقة عن المادة المسروقة..."
                            className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary resize-none"
                        />
                    </div>

                    {/* Stolen Item Photos Section (New) */}
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-bold text-white block">صور المواد المسروقة (إن وجدت)</label>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">اختياري</span>
                        </div>
                        
                        {/* Item Media Grid */}
                        {itemFiles.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-4 animate-in fade-in">
                                {itemFiles.map((media, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group">
                                        {media.type === 'video' ? (
                                            <video src={media.url} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={media.url} alt="Item" className="w-full h-full object-cover" />
                                        )}
                                        
                                        {/* Delete Button */}
                                        <button
                                            type="button"
                                            onClick={() => removeItemMedia(index)}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200"
                                        >
                                            <div className="bg-red-500/80 p-2 rounded-full hover:bg-red-600 transition">
                                                <span className="material-symbols-outlined text-white !text-[20px]">delete</span>
                                            </div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Item Photo Button */}
                        <input
                            type="file"
                            ref={itemFileInputRef}
                            onChange={handleItemFileSelect}
                            className="hidden"
                            multiple
                            accept="image/*,video/*"
                        />
                        <button
                            type="button"
                            onClick={() => itemFileInputRef.current?.click()}
                            className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-primary hover:bg-primary/5 rounded-xl text-slate-400 hover:text-primary transition flex flex-col items-center gap-1"
                        >
                            <span className="material-symbols-outlined !text-[28px]">add_photo_alternate</span>
                            <span className="text-xs font-bold">إضافة صور المواد</span>
                        </button>
                    </div>

                    {/* Media Upload Section (Evidence) */}
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-bold text-white block">إرفاق أدلة تفصيلية (صور/فيديو)</label>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">اختياري</span>
                        </div>
                        
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 mb-4 flex gap-3">
                            <span className="material-symbols-outlined text-blue-400">info</span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                يرجى إرفاق أي صور أو فيديوهات قد تساعد في التحقيق، مثل:
                                <br/>• صور تظهر السارق أو السيارة المشبوهة.
                                <br/>• صور لرقم اللوحة بوضوح إن وجدت.
                            </p>
                        </div>

                        {/* Media Grid */}
                        {mediaFiles.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-4 animate-in fade-in">
                                {mediaFiles.map((media, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group">
                                        {media.type === 'video' ? (
                                            <video src={media.url} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={media.url} alt="Evidence" className="w-full h-full object-cover" />
                                        )}
                                        
                                        {/* Type Indicator */}
                                        {media.type === 'video' && (
                                            <div className="absolute top-1 right-1 bg-black/60 rounded px-1">
                                                <span className="material-symbols-outlined text-white !text-[14px]">videocam</span>
                                            </div>
                                        )}

                                        {/* Delete Button */}
                                        <button
                                            type="button"
                                            onClick={() => removeMedia(index)}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200"
                                        >
                                            <div className="bg-red-500/80 p-2 rounded-full hover:bg-red-600 transition">
                                                <span className="material-symbols-outlined text-white !text-[20px]">delete</span>
                                            </div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Button */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            multiple
                            accept="image/*,video/*"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-primary hover:bg-primary/5 rounded-xl text-slate-400 hover:text-primary transition flex flex-col items-center gap-1"
                        >
                            <span className="material-symbols-outlined !text-[28px]">add_a_photo</span>
                            <span className="text-xs font-bold">اضغط لإضافة ملفات</span>
                        </button>
                    </div>

                    {/* Location */}
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                        <label className="text-sm font-bold text-white mb-2 block">موقع السرقة *</label>
                        <input
                            type="text"
                            required
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="مثال: منطقة ببيلا - ريف دمشق"
                            className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Vehicle Details */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-400 px-1">تفاصيل المركبة (إن وجدت)</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                                <label className="text-sm font-bold text-white mb-2 block">رقم اللوحة</label>
                                <input
                                    type="text"
                                    value={formData.plateNumber}
                                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                                    placeholder="أدخل رقم اللوحة..."
                                    className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                                <label className="text-sm font-bold text-white mb-2 block">نوع المركبة</label>
                                <input
                                    type="text"
                                    value={formData.vehicleType}
                                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                    placeholder="مثال: كيا، تويوتا..."
                                    className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50 col-span-2">
                                <label className="text-sm font-bold text-white mb-2 block">لون المركبة</label>
                                <input
                                    type="text"
                                    value={formData.vehicleColor}
                                    onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                                    placeholder="مثال: أبيض، أسود..."
                                    className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                        <label className="text-sm font-bold text-white mb-2 block">تاريخ اكتشاف السرقة *</label>
                        <input
                            type="date"
                            required
                            value={formData.stolenDate}
                            onChange={(e) => setFormData({ ...formData, stolenDate: e.target.value })}
                            className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-sm text-white focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Contact Phone */}
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700/50">
                        <label className="text-sm font-bold text-white mb-2 block">رقم الاتصال للإبلاغ الفوري *</label>
                        <input
                            type="tel"
                            required
                            value={formData.contactPhone}
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            placeholder="094XXXXXXX"
                            className="w-full bg-bg-dark border border-slate-700 rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary font-english"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 text-white rounded-xl font-bold transition shadow-lg ${
                                isSubmitting ? "bg-slate-600 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                            }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                {isSubmitting ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <span className="material-symbols-outlined">send</span>
                                )}
                                {isSubmitting ? "جاري الإرسال..." : "إرسال البلاغ"}
                            </span>
                        </button>
                    </div>

                    {/* Legal Notice */}
                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                        <h4 className="text-xs font-bold text-blue-400 mb-2">ملاحظة قانونية</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            بتقديم هذا البلاغ، أؤكد أن جميع المعلومات صحيحة وأتحمل المسؤولية القانونية الكاملة عن أي معلومات خاطئة.
                        </p>
                    </div>
                </form>
            </main>
        </div>
    );
}
