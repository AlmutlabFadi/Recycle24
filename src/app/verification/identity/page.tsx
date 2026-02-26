"use client";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function IdentityVerificationPage() {
    const { user, isAuthenticated, activeRole } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();
    
    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);
    const [commercialDoc, setCommercialDoc] = useState<string | null>(null);
    const [taxId, setTaxId] = useState("");
    const [businessName, setBusinessName] = useState("");
    // Client specific fields
    const [licensePlate, setLicensePlate] = useState("");
    const [vehicleType, setVehicleType] = useState("");
    const [vehicleColor, setVehicleColor] = useState("");
    const [governorate, setGovernorate] = useState("دمشق");

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isTrader = activeRole === "TRADER";

    useEffect(() => {
        if (user?.firstName && user?.lastName) {
            setBusinessName(`${user.firstName} ${user.lastName}`);
        }
    }, [user]);

    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (val: string | null) => void,
        documentType?: string
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
        if (!validTypes.includes(file.type)) {
            addToast("نوع الملف غير مدعوم. استخدم JPG, PNG أو PDF", "error");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            addToast("حجم الملف يجب أن يكون أقل من 5MB", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setter(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!isAuthenticated || !user) {
            addToast("يجب تسجيل الدخول أولاً", "error");
            return;
        }

        if (!frontImage || !backImage) {
            addToast("يرجى رفع صور الهوية (الوجه والخلف)", "error");
            return;
        }

        if (isTrader && !businessName) {
            addToast("يرجى إدخال اسم النشاط التجاري", "error");
            return;
        }

        if (!isTrader && (!licensePlate || !vehicleType || !vehicleColor)) {
            addToast("يرجى إدخال جميع معلومات المركبة", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/verification", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(isTrader ? {
                    userId: user.id,
                    businessName,
                    licenseNumber: taxId || undefined,
                    location: "",
                } : {
                    userId: user.id,
                    licensePlate,
                    vehicleType,
                    vehicleColor,
                    governorate,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || "فشل إرسال طلب التوثيق");
            }

            addToast("تم إرسال طلب التوثيق بنجاح! سيتم مراجعته خلال 24-48 ساعة", "success");
            router.push("/verification/status");
        } catch (error) {
            const message = error instanceof Error ? error.message : "حدث خطأ";
            addToast(message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = frontImage && backImage && (isTrader ? businessName : (licensePlate && vehicleType && vehicleColor));

    return (
        <>
            <HeaderWithBack title="تحقق من الهوية" />

            <main className="flex-col pb-28">
                <div className="w-full px-6 py-5 bg-bg-dark">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="h-1.5 w-16 rounded-full bg-primary"></div>
                        <div className="h-1.5 w-16 rounded-full bg-primary"></div>
                        <div className="h-1.5 w-16 rounded-full bg-slate-700"></div>
                    </div>
                </div>

                <div className="px-5 mb-6">
                    <h1 className="text-2xl font-black text-white mb-1">
                        {isTrader ? "Identity Verification" : "Client Verification"}
                    </h1>
                    <p className="text-base text-slate-400 mb-1">
                        {isTrader ? "التحقق من الهوية (تاجر موثق)" : "توثيق حساب العميل (الحصول على شارة موثق ومعروف)"}
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed mt-3">
                        {isTrader 
                            ? "يرجى رفع صور واضحة للمستندات لتفعيل حساب التاجر الموثق." 
                            : "يرجى تزويدنا بصور الهوية ومعلومات مركبتك الخاصة لتصبح عميلاً موثقاً."}
                    </p>
                </div>

                <div className="px-5 flex flex-col gap-6">
                    {/* ID Uploads (Both) */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary !text-[22px]">badge</span>
                            <h3 className="text-base font-bold text-white">الهوية الوطنية</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-2">
                            <div>
                                <p className="text-xs font-bold text-slate-400 mb-2">الوجه الأمامي</p>
                                <label className="relative flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-700 rounded-xl bg-surface-dark cursor-pointer hover:border-primary/50 transition group overflow-hidden">
                                    {frontImage ? (
                                        <div className="relative w-full h-full">
                                            <img src={frontImage} alt="Front ID" className="absolute inset-0 w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white !text-[24px]">edit</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1.5 text-slate-500 group-hover:text-primary transition">
                                            <span className="material-symbols-outlined !text-[28px]">photo_camera</span>
                                            <span className="text-xs font-bold">رفع صورة</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, setFrontImage, "IDENTITY_FRONT")}
                                    />
                                </label>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-400 mb-2">الوجه الخلفي</p>
                                <label className="relative flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-700 rounded-xl bg-surface-dark cursor-pointer hover:border-primary/50 transition group overflow-hidden">
                                    {backImage ? (
                                        <div className="relative w-full h-full">
                                            <img src={backImage} alt="Back ID" className="absolute inset-0 w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white !text-[24px]">edit</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1.5 text-slate-500 group-hover:text-primary transition">
                                            <span className="material-symbols-outlined !text-[28px]">file_open</span>
                                            <span className="text-xs font-bold">اختر صورة</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, setBackImage, "IDENTITY_BACK")}
                                    />
                                </label>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-600 text-center">الصيغ المدعومة: JPG, PNG (الحد الأقصى 5MB)</p>
                    </div>

                    {isTrader ? (
                        <>
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-primary !text-[22px]">store</span>
                                    <h3 className="text-base font-bold text-white">اسم النشاط التجاري</h3>
                                </div>
                                <input
                                    type="text"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    placeholder="أدخل اسم النشاط التجاري أو اسمك"
                                    className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition"
                                />
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-primary !text-[22px]">description</span>
                                    <h3 className="text-base font-bold text-white">السجل التجاري (اختياري)</h3>
                                </div>

                                <label className="flex items-center gap-4 p-4 rounded-xl bg-surface-dark border border-slate-700 cursor-pointer hover:border-primary/50 transition group">
                                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-primary !text-[28px]">upload_file</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {commercialDoc ? (
                                            <div>
                                                <p className="text-sm font-bold text-green-400 flex items-center gap-1">
                                                    <span className="material-symbols-outlined !text-[16px]">check_circle</span>
                                                    تم رفع المستند
                                                </p>
                                                <p className="text-xs text-slate-500">اضغط لتغيير الملف</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm font-bold text-white">رفع المستند</p>
                                                <p className="text-xs text-slate-500">PDF, JPG أو PNG</p>
                                            </div>
                                        )}
                                    </div>
                                    <span className="material-symbols-outlined text-slate-500 group-hover:text-primary !text-[20px] transition">cloud_upload</span>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, setCommercialDoc, "BUSINESS_LICENSE")}
                                    />
                                </label>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary !text-[22px]">receipt_long</span>
                                        <h3 className="text-base font-bold text-white">الرقم الضريبي</h3>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">اختياري</span>
                                </div>

                                <input
                                    type="text"
                                    value={taxId}
                                    onChange={(e) => setTaxId(e.target.value)}
                                    placeholder="أدخل الرقم الضريبي (اختياري)"
                                    className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-primary !text-[22px]">directions_car</span>
                                    <h3 className="text-base font-bold text-white">معلومات المركبة</h3>
                                </div>
                                <div className="grid gap-4">
                                    <input
                                        type="text"
                                        value={licensePlate}
                                        onChange={(e) => setLicensePlate(e.target.value)}
                                        placeholder="رقم اللوحة (مثال: دمشق 123456)"
                                        className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={vehicleType}
                                            onChange={(e) => setVehicleType(e.target.value)}
                                            placeholder="نوع المركبة"
                                            className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition"
                                        />
                                        <input
                                            type="text"
                                            value={vehicleColor}
                                            onChange={(e) => setVehicleColor(e.target.value)}
                                            placeholder="اللون"
                                            className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition"
                                        />
                                    </div>
                                    <select
                                        value={governorate}
                                        onChange={(e) => setGovernorate(e.target.value)}
                                        className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary transition appearance-none"
                                    >
                                        <option value="دمشق">دمشق</option>
                                        <option value="ريف دمشق">ريف دمشق</option>
                                        <option value="حلب">حلب</option>
                                        <option value="حمص">حمص</option>
                                        <option value="حماة">حماة</option>
                                        <option value="اللاذقية">اللاذقية</option>
                                        <option value="طرطوس">طرطوس</option>
                                        <option value="درعا">درعا</option>
                                        <option value="السويداء">السويداء</option>
                                        <option value="دير الزور">دير الزور</option>
                                        <option value="الحسكة">الحسكة</option>
                                        <option value="الرقة">الرقة</option>
                                        <option value="إدلب">إدلب</option>
                                        <option value="القنيطرة">القنيطرة</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex items-center justify-center gap-2 py-3">
                        <span className="material-symbols-outlined text-green-500 !text-[16px]">lock</span>
                        <span className="text-xs text-green-500/80 font-medium">بياناتك مشفرة وآمنة 100%</span>
                    </div>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-bg-dark/90 backdrop-blur-lg border-t border-slate-800 max-w-md mx-auto">
                <button
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
                    className={`w-full flex items-center justify-center gap-2 text-white font-bold text-base py-4 rounded-xl shadow-lg transition-all ${
                        isFormValid && !isSubmitting
                            ? "bg-primary hover:bg-primary/90"
                            : "bg-slate-700 cursor-not-allowed opacity-50"
                    }`}
                >
                    {isSubmitting ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            جاري الإرسال...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined !text-[20px]">send</span>
                            <span>إرسال طلب التوثيق</span>
                        </>
                    )}
                </button>
            </div>
        </>
    );
}
