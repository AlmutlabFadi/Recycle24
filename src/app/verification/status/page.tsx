"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

interface VerificationData {
    status: VerificationStatus | "UNDER_REVIEW" | "NOT_STARTED";
    rejectionReason?: string;
    missingDocuments?: string[];
    submittedAt: string;
}

type FieldStatuses = Record<string, { status: string }>;

type VerificationDocument = {
    id: string;
    type: string;
    status?: string;
    fileUrl?: string;
};

function VerificationStatusContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetRole = searchParams.get("role");
    const { user, activeRole } = useAuth();
    const [data, setData] = useState<VerificationData & { fieldStatuses?: FieldStatuses; documents?: VerificationDocument[]; isDriver?: boolean }>({
        status: "PENDING",
        submittedAt: new Date().toISOString()
    });
    const [loading, setLoading] = useState(true);

    // Countdown timer state
    const [hours, setHours] = useState(24);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);

    const docTypeMap: Record<string, string> = {
        IDENTITY_FRONT: "الهوية (وجه)",
        IDENTITY_BACK: "الهوية (خلف)",
        BUSINESS_LICENSE: "السجل التجاري",
        TRADER_REGISTRATION: "شهادة مزاولة المهنة",
        CHAMBER_MEMBERSHIP: "شهادة غرفة التجارة",
        LOCATION_PROOF: "إثبات موقع المستودع",
        DRIVING_LICENSE: "رخصة القيادة",
        ID_CARD: "الهوية الوطنية",
        LICENSE: "رخصة القيادة",
        VEHICLE_REG: "ملكية المركبة",
        INSURANCE: "تأمين المركبة",
        SELFIE: "صورة شخصية",
    };

    const fieldLabelMap: Record<string, string> = {
        name: "الاسم الكامل",
        businessName: "اسم المنشأة",
        licenseNumber: "رقم الترخيص",
        taxNumber: "الرقم الضريبي",
        governorate: "المحافظة",
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((prev) => {
                if (prev > 0) return prev - 1;
                setMinutes((m) => {
                    if (m > 0) return m - 1;
                    setHours((h) => (h > 0 ? h - 1 : 0));
                    return m > 0 ? m - 1 : 59;
                });
                return 59;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const checkStatus = async () => {
            if (!user?.id) return;
            try {
                const response = await fetch(`/api/verification?userId=${user.id}`);
                const result = await response.json();
                
                if (result.success && result.trader) {
                    setData({
                        status: result.trader.verificationStatus || result.trader.status || "PENDING",
                        rejectionReason: result.trader.rejectionReason,
                        missingDocuments: result.trader.missingDocuments,
                        submittedAt: result.trader.createdAt,
                        fieldStatuses: result.trader.fieldStatuses || {},
                        documents: result.trader.documents || [],
                        isDriver: result.trader.isDriver
                    });
                }
            } catch (error) {
                console.error("Error fetching status:", error);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, [user?.id]);

    const isDriver = data.isDriver || targetRole === "DRIVER" || activeRole === "DRIVER";
    const isTraderContext = !isDriver && (targetRole === "TRADER" || activeRole === "TRADER");
    const isClient = !isDriver && !isTraderContext;

    const commonBenefits = [
        {
            icon: "verified",
            title: "موثوقية أعلى",
            description: "شارت موثق تزيد من مصداقيتك في المنصة"
        },
        {
            icon: "gpp_good",
            title: "حماية كاملة",
            description: "تأمين المعاملات والمدفوعات لجميع الأطراف"
        }
    ];

    const traderBenefits = [
        ...commonBenefits,
        {
            icon: "business_center",
            title: "وصول للمناقصات",
            description: "إمكانية الدخول في المناقصات الكبيرة والحكومية"
        },
        {
            icon: "storefront",
            title: "متجر موسع",
            description: "لا حدود لعدد المعاملات أو حجم التداول"
        }
    ];

    const driverBenefits = [
        ...commonBenefits,
        {
            icon: "local_shipping",
            title: "طلبات نقل حصرية",
            description: "الوصول لطلبات النقل الكبيرة والمصانع"
        },
        {
            icon: "distance",
            title: "تتبع ذكي",
            description: "تفعيل نظام التتبع والخرائط المتقدم"
        }
    ];

    const clientBenefits = [
        ...commonBenefits,
        {
            icon: "local_offer",
            title: "عروض مخصصة",
            description: "الحصول على عروض أفضل من التجار الموثوقين"
        },
        {
            icon: "support_agent",
            title: "أولوية الدعم",
            description: "أولوية في معالجة طلبات الدعم والمساعدة"
        }
    ];

    const benefits = isDriver ? driverBenefits : (isTraderContext ? traderBenefits : clientBenefits);
    const pageTitle = isDriver ? "توثيق حساب السائق" : (isTraderContext ? "توثيق حساب التاجر" : "توثيق حساب العميل");

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "APPROVED":
            case "VERIFIED":
            case "ACTIVE":
                return <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined !text-xs">check_circle</span>
                    مقبول
                </span>;
            case "RESUBMIT":
                return <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined !text-xs">refresh</span>
                    يرجى التعديل
                </span>;
            case "REJECTED":
                return <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined !text-xs">cancel</span>
                    مرفوض
                </span>;
            default:
                return <span className="text-[10px] bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined !text-xs">schedule</span>
                    قيد المراجعة
                </span>;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title={pageTitle} />

            <main className="flex-1 p-4 pb-24">
                {/* Main Status Icon */}
                <div className="flex flex-col items-center text-center mb-8 pt-4">
                    {/* Status Icon with glow */}
                    <div className="relative mb-6">
                        <div className={`absolute inset-0 rounded-full blur-2xl ${
                            data.status === 'REJECTED' ? 'bg-red-500/20' : 
                            data.status === 'APPROVED' ? 'bg-emerald-500/20' : 
                            'bg-blue-500/20'
                        } scale-150`}></div>
                        <div className={`relative size-24 rounded-full bg-gradient-to-br ${
                            data.status === 'REJECTED' ? 'from-red-600 to-red-800 shadow-red-500/30' : 
                            data.status === 'APPROVED' ? 'from-emerald-500 to-emerald-700 shadow-emerald-500/30' : 
                            'from-blue-600 to-blue-800 shadow-blue-500/30'
                        } flex items-center justify-center shadow-2xl border border-white/10`}>
                            <span className={`material-symbols-outlined !text-[48px] ${
                                data.status === 'REJECTED' ? 'text-white' : 
                                data.status === 'APPROVED' ? 'text-white' : 
                                'text-yellow-400'
                            } filled`}>
                                {data.status === "REJECTED" ? "error" : data.status === "APPROVED" ? "verified" : "hourglass_top"}
                            </span>
                        </div>
                    </div>

                    <h1 className="text-xl font-black text-white mb-2">
                        {data.status === "APPROVED" 
                            ? "🎉 مبروك! حسابك موثق" 
                            : data.status === "REJECTED" 
                                ? "الطلب مرفوض" 
                                : (isClient ? "جاري التحقق من الحساب" : (isDriver ? "جاري التحقق من بيانات السائق" : "جاري التحقق من الهوية"))}
                    </h1>
                    
                    {/* APPROVED: Congratulations Screen */}
                    {data.status === "APPROVED" && (
                        <>
                            <p className="text-sm text-slate-400 mb-6">
                                تم التحقق من حسابك بنجاح! يمكنك الآن الاستفادة من جميع المزايا المتاحة.
                            </p>

                            {/* Verification Badge */}
                            <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 max-w-sm mx-auto mb-6">
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <span className="material-symbols-outlined !text-[40px] text-emerald-500 filled">verified</span>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-white">
                                            {isDriver ? "سائق موثق" : isTraderContext ? "تاجر موثق" : "عميل موثق"}
                                        </p>
                                        <p className="text-[10px] text-emerald-500 font-bold">حساب موثق ✓</p>
                                    </div>
                                </div>
                                <div className="border-t border-emerald-500/20 pt-4 space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="material-symbols-outlined !text-sm text-emerald-500">check_circle</span>
                                        تم التحقق من الهوية
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="material-symbols-outlined !text-sm text-emerald-500">check_circle</span>
                                        تم التحقق من المستندات
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="material-symbols-outlined !text-sm text-emerald-500">check_circle</span>
                                        الحساب مفعل بالكامل
                                    </div>
                                </div>
                            </div>

                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition"
                            >
                                <span className="material-symbols-outlined !text-sm">home</span>
                                العودة للرئيسية
                            </Link>
                        </>
                    )}

                    {/* REJECTED: Show rejection details + re-submit button */}
                    {data.status === "REJECTED" && (
                        <div className="mt-4 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 max-w-sm mx-auto text-right">
                            <p className="text-sm font-bold text-red-500 mb-2">أسباب الرفض:</p>
                            <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc list-inside mb-4">
                                {data.rejectionReason ? (
                                    <li>{data.rejectionReason}</li>
                                ) : (
                                    <>
                                        <li>سجل تجاري أو رخصة مركبة ساري المفعول</li>
                                        <li>مستندات واضحة وغير منتهية الصلاحية</li>
                                        <li>البيانات المدخلة مطابقة للمستندات المرفقة</li>
                                    </>
                                )}
                            </ul>
                            
                            {/* Granular Feedback */}
                            <div className="space-y-2 border-t border-red-500/20 pt-4">
                                <p className="text-[10px] font-bold text-slate-400 mb-2">تفاصيل مراجعة البيانات:</p>
                                {Object.entries(data.fieldStatuses || {}).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between text-[11px] bg-black/20 p-2 rounded-lg capitalize">
                                        <span className="text-slate-300">{fieldLabelMap[key] || key}</span>
                                        <StatusBadge status={val.status} />
                                    </div>
                                ))}
                                {data.documents?.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between text-[11px] bg-black/20 p-2 rounded-lg">
                                        <span className="text-slate-300">{docTypeMap[doc.type] || doc.type}</span>
                                        <StatusBadge status={doc.status} />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-red-500/20 flex flex-col gap-3">
                                <Link
                                    href={`/verification?role=${targetRole || activeRole || "CLIENT"}&resubmit=true`}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition"
                                >
                                    <span className="material-symbols-outlined !text-sm">refresh</span>
                                    إعادة تقديم الطلب
                                </Link>
                                <p className="text-xs text-slate-400">يرجى الاتصال بخدمة العملاء لاستكمال الطلب:</p>
                                <p className="text-lg font-black text-white" dir="ltr">0944-123-456</p>
                            </div>
                        </div>
                    )}

                    {/* PENDING / UNDER_REVIEW: Show progress */}
                    {(data.status === "PENDING" || data.status === "UNDER_REVIEW") && (
                        <>
                            {/* Beautiful Patient Message */}
                            <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 max-w-sm mx-auto">
                                <p className="text-sm font-bold text-primary mb-1">طلب التوثيق قيد المراجعة</p>
                                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                    نرجو منك التحلي بالصبر، فريق العمل يقوم بمراجعة بياناتك حالياً.
                                </p>
                                
                                <div className="space-y-2 border-t border-primary/20 pt-4 text-right">
                                    <p className="text-[10px] font-bold text-slate-500 mb-2">المراحل التي تمت دراستها والموافقة عليها:</p>
                                    {Object.entries(data.fieldStatuses || {}).map(([key, val]) => (
                                        <div key={key} className="flex items-center justify-between text-[11px] bg-white/5 p-2 rounded-lg capitalize">
                                            <span className="text-slate-300">{fieldLabelMap[key] || key}</span>
                                            <StatusBadge status={val.status} />
                                        </div>
                                    ))}
                                    {data.documents?.reduce((acc: VerificationDocument[], doc) => {
                                        if (!acc.find((d) => d.type === doc.type)) acc.push(doc);
                                        return acc;
                                    }, []).map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between text-[11px] bg-white/5 p-2 rounded-lg">
                                            <span className="text-slate-300">{docTypeMap[doc.type] || doc.type}</span>
                                            <StatusBadge status={doc.status} />
                                        </div>
                                    ))}
                                    {(Object.keys(data.fieldStatuses || {}).length === 0 && (!data.documents || data.documents.length === 0)) && (
                                        <p className="text-center py-2 text-[10px] text-slate-500 italic">بانتظار بدء المراجعة من قبل الإدارة</p>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-slate-400 max-w-xs leading-relaxed mt-6">
                                {isDriver 
                                    ? "يقوم فريقنا بمراجعة رخصة القيادة ومعلومات المركبة للتأكد من جاهزيتك للعمل."
                                    : (isTraderContext 
                                        ? "يقوم فريقنا بمراجعة مستندات السجل التجاري والهوية للتأكد من صحة البيانات." 
                                        : "يتم التحقق من بيانات حسابك الشخصي لضمان أمان العمليات.")}
                            </p>
                        </>
                    )}
                </div>

                {/* Show progress/timer/benefits only for PENDING/UNDER_REVIEW */}
                {(data.status === "PENDING" || data.status === "UNDER_REVIEW") && (
                <>
                {/* Progress Bar Section */}
                <div className="bg-surface-dark rounded-2xl p-5 border border-slate-700/50 mb-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-primary">65%</span>
                        <span className="text-sm font-bold text-white">اكتمال المراجعة</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-800 rounded-full mb-4 overflow-hidden">
                        <div className="h-full w-[65%] bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-1000"></div>
                    </div>

                    {/* Steps */}
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex flex-col items-center gap-1">
                            <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[14px]">check</span>
                            </div>
                            <span className="text-slate-400 font-medium">تم الاستلام</span>
                        </div>
                        <div className="flex-1 h-px bg-slate-700 mx-2"></div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center animate-pulse">
                                <span className="text-[10px] font-bold">⏳</span>
                            </div>
                            <span className="text-primary font-bold">المراجعة</span>
                        </div>
                        <div className="flex-1 h-px bg-slate-700 mx-2"></div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="size-6 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center">
                                <span className="text-[10px] font-bold">3</span>
                            </div>
                            <span className="text-slate-500 font-medium">القرار النهائي</span>
                        </div>
                    </div>
                </div>

                {/* Countdown Timer */}
                <div className="bg-surface-dark rounded-2xl p-5 border border-slate-700/50 mb-5">
                    <p className="text-xs text-slate-500 text-center mb-3">الوقت المتبقي (تقديري)</p>
                    <div className="flex items-center justify-center gap-2">
                        {/* Seconds */}
                        <div className="flex flex-col items-center">
                            <div className="bg-surface-highlight border border-slate-600 rounded-xl px-5 py-3 min-w-[64px] text-center">
                                <span className="text-2xl font-black text-white font-english">{String(seconds).padStart(2, '0')}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1.5">ثانية</span>
                        </div>
                        <span className="text-xl font-bold text-slate-600 mb-4">:</span>
                        {/* Minutes */}
                        <div className="flex flex-col items-center">
                            <div className="bg-surface-highlight border border-slate-600 rounded-xl px-5 py-3 min-w-[64px] text-center">
                                <span className="text-2xl font-black text-white font-english">{String(minutes).padStart(2, '0')}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1.5">دقيقة</span>
                        </div>
                        <span className="text-xl font-bold text-slate-600 mb-4">:</span>
                        {/* Hours */}
                        <div className="flex flex-col items-center">
                            <div className="bg-surface-highlight border border-slate-600 rounded-xl px-5 py-3 min-w-[64px] text-center">
                                <span className="text-2xl font-black text-white font-english">{String(hours).padStart(2, '0')}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1.5">ساعة</span>
                        </div>
                    </div>
                </div>

                    {/* Benefits After Approval */}
                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <span className="material-symbols-outlined text-yellow-500 !text-[20px] filled">lock</span>
                            <h3 className="text-base font-bold text-white">سيتم تفعيل بعد الموافقة</h3>
                        </div>

                        <div className="bg-gradient-to-br from-surface-dark to-surface-highlight rounded-2xl p-5 border border-slate-700/50">
                            {/* Role Badge Card */}
                                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-700/50">
                                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary !text-[28px] filled">verified</span>
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-white">
                                            {isClient ? "عميل موثوق" : (isDriver ? "سائق موثق" : "تاجر محترف موثق")}
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            {isClient ? "Recycle24 Verified Client" : (isDriver ? "Recycle24 Certified Driver" : "Recycle24 Certified Trader")}
                                        </p>
                                    </div>
                                </div>

                            {/* Benefits List */}
                            <div className="space-y-3">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-slate-800/50 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-primary !text-[18px]">{benefit.icon as string}</span>
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-bold text-white mb-0.5">{benefit.title}</h5>
                                            <p className="text-xs text-slate-400">{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-primary !text-[24px] filled">support_agent</span>
                            <div>
                                <h4 className="text-sm font-bold text-white">هل تحتاج مساعدة؟</h4>
                                <p className="text-xs text-slate-500">تواصل مع فريق الدعم للاستفسارات العاجلة</p>
                            </div>
                        </div>
                    </div>

                    {/* Support Button */}
                    <Link
                        href="/support"
                        className="w-full flex items-center justify-center py-3.5 rounded-xl border border-slate-700 text-white font-bold text-sm hover:bg-surface-highlight transition"
                    >
                        تواصل مع الدعم الفني
                    </Link>
                </>
                )}
                </main>
            </div>
        );
    }

export default function VerificationStatusPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-bg-dark font-display items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400">جاري التحميل...</p>
            </div>
        }>
            <VerificationStatusContent />
        </Suspense>
    );
}
