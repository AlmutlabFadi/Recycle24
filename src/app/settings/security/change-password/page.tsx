"use client";

import { useState } from "react";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function ChangePasswordPage() {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validatePassword = (password: string) => {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password),
        };
        return checks;
    };

    const passwordChecks = validatePassword(newPassword);
    const isPasswordValid = Object.values(passwordChecks).every(Boolean);
    const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";

    const handleSubmit = async () => {
        if (!currentPassword) {
            addToast("يرجى إدخال كلمة المرور الحالية", "error");
            return;
        }
        
        if (!isPasswordValid) {
            addToast("كلمة المرور الجديدة لا تستوفي الشروط", "error");
            return;
        }
        
        if (!passwordsMatch) {
            addToast("كلمتا المرور غير متطابقتين", "error");
            return;
        }

        setIsSubmitting(true);
        
        // Demo mode - simulate password change
        if (!user?.id) {
            setTimeout(() => {
                addToast("تم تغيير كلمة المرور بنجاح", "success");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setIsSubmitting(false);
            }, 1500);
            return;
        }

        try {
            const response = await fetch("/api/user/security", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    action: "changePassword",
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "فشل تغيير كلمة المرور");
            }

            addToast("تم تغيير كلمة المرور بنجاح", "success");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            const message = error instanceof Error ? error.message : "حدث خطأ";
            addToast(message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark">
            <HeaderWithBack title="تغيير كلمة المرور" />

            <main className="flex-1 p-4 space-y-6">
                <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-5 space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">lock_reset</span>
                        كلمة المرور الحالية
                    </h3>

                    <div className="relative">
                        <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور الحالية"
                            className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                            dir="ltr"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                            <span className="material-symbols-outlined">
                                {showCurrentPassword ? "visibility_off" : "visibility"}
                            </span>
                        </button>
                    </div>
                    {!user?.id && (
                        <p className="text-xs text-slate-500">
                            (الوضع التجريبي: أدخل أي كلمة مرور)
                        </p>
                    )}
                </div>

                <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-5 space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500">key</span>
                        كلمة المرور الجديدة
                    </h3>

                    <div className="relative">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور الجديدة"
                            className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                            dir="ltr"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                            <span className="material-symbols-outlined">
                                {showNewPassword ? "visibility_off" : "visibility"}
                            </span>
                        </button>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-slate-400">يجب أن تحتوي كلمة المرور على:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: "length", label: "8 أحرف على الأقل" },
                                { key: "uppercase", label: "حرف كبير" },
                                { key: "lowercase", label: "حرف صغير" },
                                { key: "number", label: "رقم" },
                                { key: "special", label: "رمز خاص (!@#$%)" },
                            ].map((check) => (
                                <div
                                    key={check.key}
                                    className={`flex items-center gap-2 text-xs ${
                                        passwordChecks[check.key as keyof typeof passwordChecks]
                                            ? "text-green-400"
                                            : "text-slate-500"
                                    }`}
                                >
                                    <span className="material-symbols-outlined !text-[16px]">
                                        {passwordChecks[check.key as keyof typeof passwordChecks]
                                            ? "check_circle"
                                            : "radio_button_unchecked"}
                                    </span>
                                    {check.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-5 space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">verified</span>
                        تأكيد كلمة المرور
                    </h3>

                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="أعد إدخال كلمة المرور الجديدة"
                        className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                        dir="ltr"
                    />

                    {confirmPassword && (
                        <div className={`flex items-center gap-2 text-xs ${passwordsMatch ? "text-green-400" : "text-red-400"}`}>
                            <span className="material-symbols-outlined !text-[16px]">
                                {passwordsMatch ? "check_circle" : "cancel"}
                            </span>
                            {passwordsMatch ? "كلمتا المرور متطابقتان" : "كلمتا المرور غير متطابقتين"}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!currentPassword || !isPasswordValid || !passwordsMatch || isSubmitting}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            جاري التحديث...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">save</span>
                            تغيير كلمة المرور
                        </>
                    )}
                </button>

                <div className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-xs text-slate-400 text-center">
                        بعد تغيير كلمة المرور، سيتم تسجيل خروجك من جميع الأجهزة الأخرى.
                    </p>
                </div>
            </main>
        </div>
    );
}
