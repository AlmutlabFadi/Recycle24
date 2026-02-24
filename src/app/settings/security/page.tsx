"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface Session {
    id: string;
    device: string;
    deviceType: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
}

interface SecurityLog {
    id: string;
    type: string;
    message: string;
    details: string;
    time: string;
}

export default function SecuritySettingsPage() {
    const { user, isAuthenticated } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();
    
    const [isLoading, setIsLoading] = useState(true);
    const [faceIdEnabled, setFaceIdEnabled] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [twoFactorMethod, setTwoFactorMethod] = useState("whatsapp");
    const [sessions, setSessions] = useState<Session[]>([]);
    const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const fetchSecurityData = async () => {
            setIsLoading(true);
            
            // Demo mode - simulate data
            if (!user?.id || !isAuthenticated) {
                setSessions([
                    {
                        id: "demo_session_1",
                        device: "iPhone 14 Pro",
                        deviceType: "phone",
                        location: "دمشق، سوريا",
                        lastActive: new Date().toISOString(),
                        isCurrent: true,
                    },
                    {
                        id: "demo_session_2",
                        device: "MacBook Pro",
                        deviceType: "laptop",
                        location: "حلب، سوريا",
                        lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                        isCurrent: false,
                    },
                ]);
                setSecurityLogs([
                    {
                        id: "log_1",
                        type: "success",
                        message: "تسجيل دخول ناجح",
                        details: "IP: 192.168.1.1 • Chrome",
                        time: new Date().toISOString(),
                    },
                    {
                        id: "log_2",
                        type: "info",
                        message: "تم تغيير كلمة المرور",
                        details: "بواسطة المستخدم",
                        time: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                    },
                ]);
                setFaceIdEnabled(false);
                setTwoFactorEnabled(false);
                setTwoFactorMethod("whatsapp");
                setIsLoading(false);
                return;
            }
            
            try {
                const response = await fetch(`/api/user/security?userId=${user.id}`);
                const data = await response.json();
                
                if (data.success) {
                    setSessions(data.sessions);
                    setSecurityLogs(data.securityLogs);
                    setFaceIdEnabled(data.securitySettings.faceIdEnabled);
                    setTwoFactorEnabled(data.securitySettings.twoFactorEnabled);
                    setTwoFactorMethod(data.securitySettings.twoFactorMethod || "whatsapp");
                }
            } catch (error) {
                console.error("Error fetching security data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchSecurityData();
    }, [user?.id, isAuthenticated]);

    const handleToggleFaceId = async (enabled: boolean) => {
        setIsUpdating(true);
        
        // Demo mode
        if (!user?.id) {
            setTimeout(() => {
                setFaceIdEnabled(enabled);
                addToast(enabled ? "تم تفعيل Face ID" : "تم إيقاف Face ID", "success");
                setIsUpdating(false);
            }, 500);
            return;
        }
        
        try {
            const response = await fetch("/api/user/security", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    action: "toggleFaceId",
                    enabled,
                }),
            });
            
            const data = await response.json();
            if (data.success) {
                setFaceIdEnabled(enabled);
                addToast(data.message, "success");
            }
        } catch (error) {
            addToast("حدث خطأ", "error");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleTerminateSession = async (sessionId: string) => {
        // Demo mode
        if (!user?.id) {
            setSessions(sessions.filter(s => s.id !== sessionId));
            addToast("تم تسجيل الخروج من الجهاز", "success");
            return;
        }
        
        try {
            const response = await fetch("/api/user/security", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    action: "terminateSession",
                    sessionId,
                }),
            });
            
            const data = await response.json();
            if (data.success) {
                setSessions(sessions.filter(s => s.id !== sessionId));
                addToast(data.message, "success");
            }
        } catch (error) {
            addToast("حدث خطأ", "error");
        }
    };

    const handleTerminateAllSessions = async () => {
        // Demo mode
        if (!user?.id) {
            setSessions(sessions.filter(s => s.isCurrent));
            addToast("تم تسجيل الخروج من جميع الأجهزة الأخرى", "success");
            return;
        }
        
        try {
            const response = await fetch("/api/user/security", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    action: "terminateAllSessions",
                }),
            });
            
            const data = await response.json();
            if (data.success) {
                setSessions(sessions.filter(s => s.isCurrent));
                addToast(data.message, "success");
            }
        } catch (error) {
            addToast("حدث خطأ", "error");
        }
    };

    const getLogColor = (type: string) => {
        switch (type) {
            case "success": return "bg-green-500 ring-green-500/20";
            case "error": return "bg-red-500 ring-red-500/20";
            case "warning": return "bg-yellow-500 ring-yellow-500/20";
            default: return "bg-blue-500 ring-blue-500/20";
        }
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case "phone": return "smartphone";
            case "laptop": return "laptop_mac";
            case "tablet": return "tablet_mac";
            default: return "devices";
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return "الآن";
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        return `منذ ${days} يوم`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark">
                <HeaderWithBack title="الأمان وتسجيل الدخول" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark">
            <HeaderWithBack title="الأمان وتسجيل الدخول" />

            <main className="flex-1 p-4 flex flex-col gap-6 pb-8">
                <section>
                    <h3 className="text-slate-400 text-sm font-semibold mb-3 px-1 uppercase tracking-wider">
                        المصادقة
                    </h3>
                    <div className="flex flex-col bg-surface-dark rounded-2xl overflow-hidden border border-slate-800 divide-y divide-slate-800">
                        <Link
                            href="/settings/security/change-password"
                            className="flex items-center gap-4 px-4 py-4 hover:bg-surface-highlight transition-colors group"
                        >
                            <div className="flex items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 size-10 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined !text-[20px]">lock_reset</span>
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className="text-base font-medium text-white">تغيير كلمة المرور</span>
                                <span className="text-xs text-slate-400 mt-0.5">آخر تحديث مؤخراً</span>
                            </div>
                            <span className="material-symbols-outlined text-slate-600 !text-[20px]">chevron_left</span>
                        </Link>

                        <Link
                            href="/settings/security/2fa"
                            className="flex items-center gap-4 px-4 py-4 hover:bg-surface-highlight transition-colors group"
                        >
                            <div className="flex items-center justify-center rounded-xl bg-green-500/10 text-green-400 shrink-0 size-10 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined !text-[20px]">phonelink_lock</span>
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className="text-base font-medium text-white">المصادقة الثنائية (2FA)</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {twoFactorEnabled && (
                                        <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    )}
                                    <span className={`text-xs font-medium ${twoFactorEnabled ? "text-green-400" : "text-slate-400"}`}>
                                        {twoFactorEnabled ? `${twoFactorMethod === "whatsapp" ? "واتساب" : twoFactorMethod === "sms" ? "SMS" : "البريد"} مفعل` : "غير مفعل"}
                                    </span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-600 !text-[20px]">chevron_left</span>
                        </Link>

                        <div className="flex items-center justify-between gap-4 px-4 py-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 shrink-0 size-10">
                                    <span className="material-symbols-outlined !text-[20px]">face</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-medium text-white">تفعيل Face ID</span>
                                    <span className="text-xs text-slate-400 mt-0.5">تسجيل دخول سريع وآمن</span>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={faceIdEnabled}
                                    onChange={(e) => handleToggleFaceId(e.target.checked)}
                                    disabled={isUpdating}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
                            الجلسات النشطة
                        </h3>
                        {sessions.length > 1 && (
                            <button 
                                onClick={handleTerminateAllSessions}
                                className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
                            >
                                تسجيل خروج من الجميع
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col bg-surface-dark rounded-2xl overflow-hidden border border-slate-800 divide-y divide-slate-800">
                        {sessions.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <span className="material-symbols-outlined text-4xl mb-2">devices</span>
                                <p>لا توجد جلسات نشطة</p>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={`flex items-start gap-4 px-4 py-4 ${session.isCurrent ? "relative overflow-hidden" : ""}`}
                                >
                                    {session.isCurrent && (
                                        <div className="absolute inset-y-0 right-0 w-1 bg-primary"></div>
                                    )}
                                    <div className={`flex items-center justify-center rounded-xl shrink-0 size-12 ${
                                        session.isCurrent ? "bg-slate-800 text-white" : "bg-slate-800 text-slate-400"
                                    }`}>
                                        <span className="material-symbols-outlined !text-[24px]">
                                            {getDeviceIcon(session.deviceType)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col flex-1 gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-base font-bold ${session.isCurrent ? "text-white" : "text-white font-medium"}`}>
                                                {session.device}
                                            </span>
                                            {session.isCurrent ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400">
                                                    هذا الجهاز
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => handleTerminateSession(session.id)}
                                                    className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined !text-[18px]">logout</span>
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined !text-[14px]">location_on</span>
                                                {session.location}
                                            </span>
                                            <span className="size-1 rounded-full bg-slate-600"></span>
                                            <span className={session.isCurrent ? "text-green-400 font-medium" : ""}>
                                                {formatTime(session.lastActive)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
                            سجل النشاط
                        </h3>
                    </div>
                    <div className="flex flex-col bg-surface-dark rounded-2xl overflow-hidden border border-slate-800">
                        {securityLogs.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <span className="material-symbols-outlined text-4xl mb-2">history</span>
                                <p>لا يوجد سجل نشاط</p>
                            </div>
                        ) : (
                            securityLogs.map((log, index) => (
                                <div
                                    key={log.id}
                                    className={`flex items-center gap-4 px-4 py-3 ${index < securityLogs.length - 1 ? "border-b border-slate-800" : ""}`}
                                >
                                    <div className="relative">
                                        <div className={`size-2.5 rounded-full ${getLogColor(log.type)} ring-4`}></div>
                                    </div>
                                    <div className="flex flex-col flex-1 gap-0.5">
                                        <span className={`text-sm font-medium ${log.type === "error" ? "text-red-400" : "text-white"}`}>
                                            {log.message}
                                        </span>
                                        <span className="text-[11px] text-slate-400" dir="ltr">
                                            {log.details}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400">{formatTime(log.time)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <div className="mt-2 px-4 text-center">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        إذا لاحظت أي نشاط غير مألوف، يرجى تغيير كلمة المرور فوراً والتواصل مع الدعم الفني.
                    </p>
                    <div className="mt-4">
                        <Link href="/support/chat" className="text-primary hover:text-primary/80 font-medium text-sm transition-colors">
                            اتصل بالدعم الفني
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
