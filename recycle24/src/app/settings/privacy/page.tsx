"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface PrivacySetting {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
}

interface AccountStats {
    memberSince: string;
    auctionsCount: number;
    dealsCount: number;
    bidsCount: number;
}

export default function PrivacySettingsPage() {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [settings, setSettings] = useState<PrivacySetting[]>([]);
    const [accountStats, setAccountStats] = useState<AccountStats | null>(null);

    useEffect(() => {
        const fetchPrivacyData = async () => {
            if (!user?.id) return;
            
            setIsLoading(true);
            try {
                const response = await fetch(`/api/user/privacy?userId=${user.id}`);
                const data = await response.json();
                
                if (data.success) {
                    setSettings([
                        {
                            id: "showPhone",
                            title: "إظهار رقم الهاتف",
                            description: "إظهار رقم الهاتف للمشترين الموثقين فقط",
                            enabled: data.privacySettings.showPhone,
                        },
                        {
                            id: "hideWarehouseLocation",
                            title: "إخفاء موقع المستودع",
                            description: "إخفاء موقع المستودع من البحث العام",
                            enabled: data.privacySettings.hideWarehouseLocation,
                        },
                        {
                            id: "allowFactoryContact",
                            title: "السماح بتواصل المصانع",
                            description: "السماح للمصانع بالتواصل معي مباشرة",
                            enabled: data.privacySettings.allowFactoryContact,
                        },
                    ]);
                    setAccountStats(data.accountStats);
                }
            } catch (error) {
                console.error("Error fetching privacy data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchPrivacyData();
    }, [user?.id]);

    const toggleSetting = async (id: string) => {
        if (!user?.id) return;
        
        const newSettings = settings.map(s => 
            s.id === id ? { ...s, enabled: !s.enabled } : s
        );
        setSettings(newSettings);
        
        try {
            const response = await fetch("/api/user/privacy", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    action: "updatePrivacy",
                    showPhone: newSettings.find(s => s.id === "showPhone")?.enabled,
                    hideWarehouseLocation: newSettings.find(s => s.id === "hideWarehouseLocation")?.enabled,
                    allowFactoryContact: newSettings.find(s => s.id === "allowFactoryContact")?.enabled,
                }),
            });
            
            const data = await response.json();
            if (data.success) {
                addToast("تم تحديث إعدادات الخصوصية", "success");
            }
        } catch (error) {
            addToast("حدث خطأ أثناء التحديث", "error");
            setSettings(settings);
        }
    };

    const handleExportData = async () => {
        if (!user?.id) return;
        
        setIsExporting(true);
        try {
            const response = await fetch("/api/user/privacy", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    action: "exportData",
                }),
            });
            
            const data = await response.json();
            if (data.success) {
                const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `recycle24-data-${user.id}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                addToast("تم تصدير البيانات بنجاح", "success");
            }
        } catch (error) {
            addToast("حدث خطأ أثناء التصدير", "error");
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user?.id || deleteConfirmation !== "حذف حسابي") return;
        
        setIsDeleting(true);
        try {
            const response = await fetch("/api/user/privacy", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    action: "deleteAccount",
                }),
            });
            
            const data = await response.json();
            if (data.success) {
                addToast("تم حذف الحساب بنجاح", "success");
                window.location.href = "/";
            }
        } catch (error) {
            addToast("حدث خطأ أثناء الحذف", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark">
                <HeaderWithBack title="الخصوصية والبيانات" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark">
            <HeaderWithBack title="الخصوصية والبيانات" />

            <main className="flex-1 p-4 pb-12 space-y-6">
                <section>
                    <div className="px-2 pb-2">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                            إعدادات الظهور
                        </h2>
                    </div>
                    <div className="bg-surface-dark rounded-xl overflow-hidden border border-slate-800 divide-y divide-slate-800">
                        {settings.map((setting) => (
                            <div key={setting.id} className="p-4 flex items-center justify-between gap-4">
                                <div className="flex flex-col flex-1">
                                    <span className="text-base font-medium text-white">{setting.title}</span>
                                    <span className="text-xs text-slate-400 mt-1">{setting.description}</span>
                                </div>
                                <div className="shrink-0">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={setting.enabled}
                                            onChange={() => toggleSetting(setting.id)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="px-4 pt-2 text-xs text-slate-500 leading-relaxed">
                        يساعد ضبط إعدادات الظهور في حماية خصوصيتك مع ضمان وصول الفرص التجارية المناسبة إليك.
                    </p>
                </section>

                {accountStats && (
                    <section>
                        <div className="px-2 pb-2">
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                                إحصائيات الحساب
                            </h2>
                        </div>
                        <div className="bg-surface-dark rounded-xl border border-slate-800 p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">عضو منذ</span>
                                <span className="text-white text-sm font-medium">{formatDate(accountStats.memberSince)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">المزادات</span>
                                <span className="text-white text-sm font-medium">{accountStats.auctionsCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">الصفقات</span>
                                <span className="text-white text-sm font-medium">{accountStats.dealsCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">المزايدات</span>
                                <span className="text-white text-sm font-medium">{accountStats.bidsCount}</span>
                            </div>
                        </div>
                    </section>
                )}

                <section>
                    <div className="px-2 pb-2 mt-2">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                            إدارة البيانات
                        </h2>
                    </div>
                    <div className="bg-surface-dark rounded-xl overflow-hidden border border-slate-800 divide-y divide-slate-800">
                        <button
                            onClick={handleExportData}
                            disabled={isExporting}
                            className="w-full p-4 flex items-center justify-between gap-3 transition-colors hover:bg-surface-highlight"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                                    <span className="material-symbols-outlined text-lg">download</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-medium text-white">تصدير بياناتي</span>
                                    <span className="text-xs text-slate-400">احصل على نسخة من بيانات حسابك</span>
                                </div>
                            </div>
                            {isExporting ? (
                                <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                            ) : (
                                <span className="material-symbols-outlined text-slate-500">chevron_left</span>
                            )}
                        </button>

                        <Link
                            href="/help/privacy"
                            className="w-full p-4 flex items-center justify-between gap-3 transition-colors hover:bg-surface-highlight"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-300">
                                    <span className="material-symbols-outlined text-lg">policy</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-medium text-white">سياسة الخصوصية</span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-500">chevron_left</span>
                        </Link>

                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="w-full p-4 flex items-center justify-between gap-3 transition-colors hover:bg-red-900/10"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-900/30 text-red-400">
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-medium text-red-400">حذف الحساب</span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-red-800">chevron_left</span>
                        </button>
                    </div>
                </section>

                <div className="px-4 py-4 flex flex-col items-center gap-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-slate-400 mb-2">
                        <span className="material-symbols-outlined text-2xl">security</span>
                    </div>
                    <p className="text-center text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                        نحن نلتزم بحماية بياناتك وفقاً لأعلى معايير الأمان والخصوصية العالمية. جميع بياناتك مشفرة ومحمية.
                    </p>
                    <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-widest">
                        Recycle24 v2.4.0
                    </p>
                </div>
            </main>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-surface-dark border border-slate-700 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-red-500">حذف الحساب</h3>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-red-500">warning</span>
                                    <span className="text-red-500 font-bold">تحذير!</span>
                                </div>
                                <p className="text-sm text-slate-300">
                                    هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك بشكل دائم.
                                </p>
                            </div>

                            {accountStats && (
                                <div className="bg-surface-highlight rounded-xl p-3 space-y-2">
                                    <p className="text-sm text-slate-400">البيانات التي سيتم حذفها:</p>
                                    <ul className="text-sm text-slate-300 space-y-1">
                                        <li>• {accountStats.auctionsCount} مزاد</li>
                                        <li>• {accountStats.dealsCount} صفقة</li>
                                        <li>• {accountStats.bidsCount} مزايدة</li>
                                        <li>• المحفظة والمعاملات</li>
                                        <li>• الإعدادات والتفضيلات</li>
                                    </ul>
                                </div>
                            )}

                            <div>
                                <label className="text-sm text-slate-400 mb-1.5 block">
                                    اكتب &quot;حذف حسابي&quot; للتأكيد
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder="حذف حسابي"
                                    className="w-full bg-surface-highlight border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="p-4 flex gap-2 border-t border-slate-700">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmation("");
                                }}
                                className="flex-1 py-3 bg-surface-highlight border border-slate-600 text-white rounded-xl font-bold hover:bg-surface-dark transition"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmation !== "حذف حسابي" || isDeleting}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        جاري الحذف...
                                    </>
                                ) : (
                                    "حذف الحساب"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
