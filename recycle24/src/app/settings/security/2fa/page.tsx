"use client";

import { useState, useEffect } from "react";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function TwoFactorAuthPage() {
    const { user, isAuthenticated } = useAuth();
    const { addToast } = useToast();
    
    const [isLoading, setIsLoading] = useState(true);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<"whatsapp" | "sms" | "email">("whatsapp");
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [setupStep, setSetupStep] = useState(1);
    const [verificationCode, setVerificationCode] = useState("");
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            
            // Demo mode
            if (!user?.id || !isAuthenticated) {
                setTwoFactorEnabled(false);
                setSelectedMethod("whatsapp");
                setIsLoading(false);
                return;
            }
            
            try {
                const response = await fetch(`/api/user/security?userId=${user.id}`);
                const data = await response.json();
                
                if (data.success) {
                    setTwoFactorEnabled(data.securitySettings.twoFactorEnabled);
                    setSelectedMethod(data.securitySettings.twoFactorMethod || "whatsapp");
                }
            } catch (error) {
                console.error("Error fetching 2FA settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchSettings();
    }, [user?.id, isAuthenticated]);

    const handleEnable2FA = () => {
        setShowSetupModal(true);
        setSetupStep(1);
        setVerificationCode("");
    };

    const handleDisable2FA = async () => {
        // Demo mode
        if (!user?.id) {
            setTwoFactorEnabled(false);
            addToast("تم إيقاف المصادقة الثنائية", "success");
            return;
        }
        
        try {
            const response = await fetch("/api/user/security", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    action: "toggle2FA",
                    enabled: false,
                }),
            });
            
            const data = await response.json();
            if (data.success) {
                setTwoFactorEnabled(false);
                addToast("تم إيقاف المصادقة الثنائية", "success");
            }
        } catch (error) {
            addToast("حدث خطأ", "error");
        }
    };

    const handleSendCode = async () => {
        setIsSendingCode(true);
        
        // Demo mode - simulate sending code
        if (!user?.id) {
            setTimeout(() => {
                addToast(`تم إرسال رمز التحقق عبر ${selectedMethod === "whatsapp" ? "واتساب" : selectedMethod === "sms" ? "SMS" : "البريد الإلكتروني"}`, "success");
                setSetupStep(2);
                setIsSendingCode(false);
            }, 1000);
            return;
        }
        
        try {
            const response = await fetch("/api/user/security", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    type: "2fa",
                    method: selectedMethod,
                }),
            });
            
            const data = await response.json();
            if (data.success) {
                addToast(data.message, "success");
                setSetupStep(2);
            }
        } catch (error) {
            addToast("حدث خطأ أثناء إرسال الرمز", "error");
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleVerify = async () => {
        if (verificationCode.length !== 6) return;
        
        setIsVerifying(true);
        
        // Demo mode - accept any 6-digit code
        if (!user?.id) {
            setTimeout(() => {
                setTwoFactorEnabled(true);
                addToast("تم تفعيل المصادقة الثنائية بنجاح", "success");
                setShowSetupModal(false);
                setIsVerifying(false);
            }, 1000);
            return;
        }
        
        try {
            const response = await fetch("/api/user/security", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    action: "toggle2FA",
                    enabled: true,
                    method: selectedMethod,
                }),
            });
            
            const data = await response.json();
            if (data.success) {
                setTwoFactorEnabled(true);
                addToast("تم تفعيل المصادقة الثنائية بنجاح", "success");
                setShowSetupModal(false);
            }
        } catch (error) {
            addToast("حدث خطأ", "error");
        } finally {
            setIsVerifying(false);
        }
    };

    const methods = [
        {
            id: "whatsapp" as const,
            label: "واتساب",
            icon: "chat",
            color: "text-green-500",
            bgColor: "bg-green-500/10",
            available: true,
        },
        {
            id: "sms" as const,
            label: "SMS",
            icon: "sms",
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            available: true,
        },
        {
            id: "email" as const,
            label: "البريد الإلكتروني",
            icon: "mail",
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            available: true,
        },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark">
                <HeaderWithBack title="المصادقة الثنائية" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark">
            <HeaderWithBack title="المصادقة الثنائية" />

            <main className="flex-1 p-4 space-y-6">
                <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-500 !text-[24px]">phonelink_lock</span>
                        </div>
                        <div>
                            <h3 className="text-white font-bold">المصادقة الثنائية (2FA)</h3>
                            <p className="text-sm text-slate-400">طبقة حماية إضافية لحسابك</p>
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl ${twoFactorEnabled ? "bg-green-500/10 border border-green-500/30" : "bg-surface-dark border border-slate-600"}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={`material-symbols-outlined ${twoFactorEnabled ? "text-green-500" : "text-slate-500"}`}>
                                    {twoFactorEnabled ? "check_circle" : "cancel"}
                                </span>
                                <span className={`font-medium ${twoFactorEnabled ? "text-green-400" : "text-slate-400"}`}>
                                    {twoFactorEnabled ? "مفعل" : "غير مفعل"}
                                </span>
                            </div>
                            {twoFactorEnabled && (
                                <span className="text-xs text-slate-400">
                                    عبر {selectedMethod === "whatsapp" ? "واتساب" : selectedMethod === "sms" ? "SMS" : "البريد"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-5 space-y-4">
                    <h3 className="text-white font-bold">كيف تعمل المصادقة الثنائية؟</h3>
                    
                    <div className="space-y-3">
                        {[
                            { step: 1, title: "تسجيل الدخول", desc: "أدخل كلمة المرور كالمعتاد" },
                            { step: 2, title: "رمز التحقق", desc: "سنرسل رمز تحقق إلى جهازك" },
                            { step: 3, title: "الدخول الآمن", desc: "أدخل الرمز للوصول إلى حسابك" },
                        ].map((item) => (
                            <div key={item.step} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                                    {item.step}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{item.title}</p>
                                    <p className="text-sm text-slate-400">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-5 space-y-4">
                    <h3 className="text-white font-bold">المزايا</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: "security", label: "حماية إضافية" },
                            { icon: "lock", label: "تشفير الرموز" },
                            { icon: "notifications_active", label: "تنبيهات فورية" },
                            { icon: "verified_user", label: "حساب موثق" },
                        ].map((item) => (
                            <div key={item.icon} className="flex items-center gap-2 p-3 bg-surface-dark rounded-lg">
                                <span className="material-symbols-outlined text-primary !text-[20px]">{item.icon}</span>
                                <span className="text-sm text-white">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={twoFactorEnabled ? handleDisable2FA : handleEnable2FA}
                    className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                        twoFactorEnabled
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                            : "bg-primary text-white hover:bg-primary/90"
                    }`}
                >
                    <span className="material-symbols-outlined">
                        {twoFactorEnabled ? "toggle_off" : "toggle_on"}
                    </span>
                    {twoFactorEnabled ? "إيقاف المصادقة الثنائية" : "تفعيل المصادقة الثنائية"}
                </button>
            </main>

            {/* Setup Modal */}
            {showSetupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-surface-dark border border-slate-700 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white">تفعيل المصادقة الثنائية</h3>
                            <button
                                onClick={() => setShowSetupModal(false)}
                                className="size-8 rounded-full hover:bg-surface-highlight flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {setupStep === 1 && (
                                <>
                                    <p className="text-sm text-slate-400">
                                        اختر طريقة استلام رمز التحقق
                                    </p>
                                    <div className="space-y-2">
                                        {methods.map((method) => (
                                            <button
                                                key={method.id}
                                                onClick={() => setSelectedMethod(method.id)}
                                                className={`w-full p-3 rounded-xl border transition flex items-center gap-3 ${
                                                    selectedMethod === method.id
                                                        ? "border-primary bg-primary/10"
                                                        : "border-slate-600 hover:border-primary/50"
                                                }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl ${method.bgColor} flex items-center justify-center`}>
                                                    <span className={`material-symbols-outlined ${method.color}`}>{method.icon}</span>
                                                </div>
                                                <span className="text-white font-medium">{method.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleSendCode}
                                        disabled={isSendingCode}
                                        className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSendingCode ? (
                                            <>
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                جاري الإرسال...
                                            </>
                                        ) : (
                                            "إرسال رمز التحقق"
                                        )}
                                    </button>
                                </>
                            )}

                            {setupStep === 2 && (
                                <>
                                    <p className="text-sm text-slate-400">
                                        أدخل الرمز المرسل عبر {selectedMethod === "whatsapp" ? "واتساب" : selectedMethod === "sms" ? "SMS" : "البريد الإلكتروني"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        (في الوضع التجريبي: أدخل أي 6 أرقام)
                                    </p>
                                    <input
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                                        placeholder="000000"
                                        dir="ltr"
                                        className="w-full bg-surface-highlight border border-slate-600 rounded-lg px-3 py-3 text-white text-center text-2xl tracking-widest placeholder-slate-500 focus:border-primary focus:outline-none"
                                        maxLength={6}
                                    />
                                    <button
                                        onClick={handleSendCode}
                                        className="w-full text-sm text-primary hover:underline"
                                    >
                                        إعادة إرسال الرمز
                                    </button>
                                    <button
                                        onClick={handleVerify}
                                        disabled={verificationCode.length !== 6 || isVerifying}
                                        className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isVerifying ? (
                                            <>
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                جاري التحقق...
                                            </>
                                        ) : (
                                            "تأكيد وتفعيل"
                                        )}
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
