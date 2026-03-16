"use client";

import Link from "next/link";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth, ActiveRole } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TitleSelector } from "@/components/TitleSelector";
import { TitleBadge } from "@/components/TitleFormatter";
import { Gender, getTitleDisplay, getTitleById } from "@/lib/title-system";
import TrustBadge from "@/components/trust/TrustBadge";


const companyTypes = [
    { value: "INDIVIDUAL", label: "نشاط فردي" },
    { value: "SMALL_COMPANY", label: "شركة صغيرة" },
    { value: "MEDIUM_COMPANY", label: "شركة متوسطة" },
    { value: "LARGE_COMPANY", label: "شركة كبيرة" },
    { value: "FACTORY", label: "مصنع" },
    { value: "COLLECTION_CENTER", label: "مركز تجميع" },
];

const businessTypes = [
    { value: "TRADER", label: "تاجر خردة" },
    { value: "SCRAP_COLLECTOR", label: "جامع خردة" },
    { value: "FACTORY_OWNER", label: "صاحب مصنع" },
    { value: "RECYCLER", label: "معيد تدوير" },
    { value: "BROKER", label: "وسيط" },
    { value: "EXPORTER", label: "مصدر" },
    { value: "IMPORTER", label: "مستورد" },
];

const jobTitles = [
    { value: "OWNER", label: "صاحب الشركة / المالك" },
    { value: "CEO", label: "المدير التنفيذي" },
    { value: "GM", label: "المدير العام" },
    { value: "PURCHASE_MANAGER", label: "مدير المشتريات" },
    { value: "SALES_MANAGER", label: "مدير المبيعات" },
    { value: "OPERATIONS_MANAGER", label: "مدير العمليات" },
    { value: "LOGISTICS_MANAGER", label: "مدير اللوجستيات" },
    { value: "EMPLOYEE", label: "موظف" },
    { value: "OTHER", label: "أخرى" },
];

const clientBusinessTypes = [
    { value: "FREELANCE", label: "عمل حر" },
    { value: "SCRAP_COLLECTOR", label: "جامع خردة" },
    { value: "EXTRA_INCOME", label: "دخل إضافي" },
    { value: "OTHER", label: "أخرى" },
];

interface UserProfile {
    titleId: string;
    firstName: string;
    lastName: string;
    companyName: string;
    companyType: string;
    businessType: string;
    jobTitle: string;
    bio: string;
    avatar: string | null;
    gender: Gender;
    customBusinessType?: string;
}

interface DriverProfile {
    id: string;
    fullName: string;
    phone: string;
    city: string | null;
    status: string;
    ratingAvg: number;
    ratingCount: number;
    vehicles: Array<{ plateNumber: string; make: string | null; color: string | null }>;
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, logout, updateUser, activeRole, switchRole } = useAuth();
    const { addToast } = useToast();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [safetyScore, setSafetyScore] = useState<number | null>(null);
    const isTrader = activeRole === "TRADER";
    const isAdmin = activeRole === "ADMIN";
    const dealsCount = Array.isArray((user as { deals?: unknown[] } | null)?.deals)
        ? (user as { deals?: unknown[] }).deals?.length ?? 0
        : 0;
    const driverMenuItems = activeRole === "DRIVER" ? [
        { icon: "route", label: "طلبات النقل", href: "/driver/bookings" },
        { icon: "history", label: "سجل التوصيل", href: "/driver/history" },
        { icon: "verified", label: "توثيق السائق", href: "/verification/status?role=DRIVER" },
    ] : [];

    const currentMenuItems = isAdmin ? [
        { icon: "settings", label: "إعدادات الحساب", href: "/settings/account" },
        { icon: "security", label: "الأمان والخصوصية", href: "/settings/security" },
        { icon: "rocket_launch", label: "مركز القيادة والتحكم", href: "/admin/dashboard" },
        { icon: "account_balance", label: "رصيد النظام والمالية", href: "/admin/finance" },
        { icon: "monitoring", label: "مراقبة الأسواق والمعاملات", href: "/admin/marketplace" },
        { icon: "person_search", label: "حوكمة المستخدمين والأدوار", href: "/admin/users" },
        { icon: "verified", label: "التوثيق المستندي", href: "/admin/verification" },
        { icon: "design_services", label: "مصمم باقات الاشتراك", href: "/admin/subscriptions/packages" },
        { icon: "loyalty", label: "إعدادات المكافآت", href: "/admin/rewards" },
        { icon: "security", label: "مركز الأمان (SOC)", href: "/admin/soc" },
        { icon: "history_edu", label: "سجل التدقيق العام", href: "/gsocc/audit" },
        { icon: "analytics", label: "أسعار السوق (رقابة)", href: "/market" },
        { icon: "support_agent", label: "مكتب الدعم والعمليات", href: "/admin/support" },
        { icon: "help", label: "مركز المساعدة الإداري", href: "/help" },
    ] : [
        { icon: "settings", label: "إعدادات الحساب", href: "/settings/account" },
        { icon: "security", label: "الأمان والخصوصية", href: "/settings/security" },
        { icon: "dashboard", label: "لوحة التحكم", href: "/dashboard" },
        ...driverMenuItems,
        { icon: "account_balance_wallet", label: isTrader ? "الرصيد التشغيلي" : "المحفظة", href: "/wallet" },
        { icon: "verified_user", label: "التوثيق", href: "/verification" },
        { icon: "gavel", label: "المزادات", href: "/auctions" },
        { icon: "local_offer", label: isTrader ? "الطلبات" : "عروضي", href: "/offers" },
        { icon: "handshake", label: "الصفقات", href: "/deals" },
        { icon: "local_shipping", label: "النقل والشحن", href: "/transport" },
        { icon: "notifications_active", label: "تنبيهات الأسعار", href: "/price-alerts" },
        { icon: "work", label: "مركز الوظائف", href: "/jobs" },
        ...(isTrader ? [{ icon: "psychology", label: "الاستشارات", href: "/consultations" }] : []),
        { icon: "analytics", label: "أسعار السوق", href: "/market" },
        { icon: "workspace_premium", label: isTrader ? "اشتراكات التاجر" : "اشتراكات العميل", href: "/subscription/plans" },
        { icon: "redeem", label: "المكافآت", href: "/rewards/store" },
        { icon: "report", label: "البلاغات", href: "/stolen-reports" },
        ...(isTrader ? [{ icon: "school", label: "أكاديمية التدريب", href: "/academy" }] : []),
        { icon: "support_agent", label: "الدعم الفني", href: "/support/chat" },
        { icon: "help", label: "المساعدة", href: "/help" },
    ];

    const initialProfile = useMemo(() => ({
        titleId: user?.titleId || "",
        firstName: user?.firstName || user?.name?.split(' ')[0] || "",
        lastName: user?.lastName || user?.name?.split(' ').slice(1).join(' ') || "",
        companyName: "",
        companyType: "INDIVIDUAL",
        businessType: isTrader ? "TRADER" : "FREELANCE",
        jobTitle: "OWNER",
        bio: "",
        avatar: null as string | null,
        gender: (user?.gender || "male") as Gender,
        customBusinessType: "",
    }), [user, isTrader]);

    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<UserProfile>(initialProfile);
    const [trustData, setTrustData] = useState<{trustScore: number, successRate: number, totalReviews: number} | null>(null);
    const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
    const [driverProfileLoading, setDriverProfileLoading] = useState(false);

    useEffect(() => {
        const fetchSafetyScore = async () => {
            try {
                const response = await fetch("/api/safety/checklists/summary", { cache: "no-store" });
                const data = await response.json();
                if (response.ok) setSafetyScore(data.latestScore ?? null);
            } catch (error) {
                console.error("Safety score fetch error:", error);
            }
        };

        const fetchTrustData = async () => {
            if (!user?.id) return;
            try {
                const response = await fetch(`/api/profile?userId=${user.id}`);
                const data = await response.json();
                if (response.ok && data.user) {
                    const tData = data.user.trader || data.user.driver;
                    if (tData) {
                        setTrustData({
                            trustScore: tData.trustScore,
                            successRate: tData.successRate,
                            totalReviews: tData.totalReviews
                        });
                    }
                }
            } catch (error) {
                console.error("Trust data fetch error:", error);
            }
        };

        fetchSafetyScore();
        if (user?.id) {
            fetchTrustData();
        }
    }, [user?.id]);

    useEffect(() => {
        const fetchDriverProfile = async () => {
            if (activeRole !== "DRIVER") return;
            setDriverProfileLoading(true);
            try {
                const response = await fetch("/api/driver/me", { cache: "no-store" });
                const data = await response.json();
                if (response.ok && data.driver) {
                    setDriverProfile(data.driver);
                } else {
                    setDriverProfile(null);
                }
            } catch (error) {
                console.error("Driver profile fetch error:", error);
                setDriverProfile(null);
            } finally {
                setDriverProfileLoading(false);
            }
        };

        fetchDriverProfile();
    }, [activeRole]);

    const handleTitleChange = (titleId: string, gender: Gender) => {
        setProfile({ ...profile, titleId, gender });
    };

    const handleLogout = () => {
        logout();
    };

    const getUserTypeLabel = (type: string) => {
        switch (type) {
            case "TRADER": return "تاجر خردة";
            case "CLIENT": return "عميل";
            case "BUYER": return "مشتري";
            case "DRIVER": return "سائق";
            case "GOVERNMENT": return "جهة حكومية";
            case "ADMIN": return "مدير";
            default: return "مستخدم";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING": return { label: "قيد المراجعة", color: "text-yellow-500", bg: "bg-yellow-500/10" };
            case "APPROVED": return { label: "موثق", color: "text-green-500", bg: "bg-green-500/10" };
            case "REJECTED": return { label: "مرفوض", color: "text-red-500", bg: "bg-red-500/10" };
            default: return { label: status, color: "text-slate-400", bg: "bg-slate-500/10" };
        }
    };

    const getTitleLabel = (titleId: string, gender: Gender) => {
        if (!titleId) return "";
        return getTitleDisplay(titleId, gender);
    };

    const getTitleBadge = (titleId: string, gender: Gender) => {
        if (!titleId) return null;
        const title = getTitleById(titleId);
        if (!title) return null;
        return {
            text: getTitleDisplay(titleId, gender),
            category: title.category,
        };
    };

    const getCompanyTypeLabel = (value: string) => {
        return companyTypes.find(c => c.value === value)?.label || "";
    };

    const getClientBusinessLabel = (value: string) => {
        return clientBusinessTypes.find(c => c.value === value)?.label || "";
    };

    const getJobTitleLabel = (value: string) => {
        return jobTitles.find(j => j.value === value)?.label || "";
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setProfile({ ...profile, avatar: url });
        }
    };

    const handleSaveProfile = () => {
        const fullName = `${profile.firstName} ${profile.lastName}`.trim();
        updateUser({ 
            name: fullName,
            firstName: profile.firstName,
            lastName: profile.lastName,
            titleId: profile.titleId,
            gender: profile.gender,
        });
        setIsEditing(false);
    };

    const handleRequestTraderRole = async () => {
        setIsUpgrading(true);
        try {
            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.id,
                    upgradeToTrader: true
                }),
            });
            const data = await response.json();
            if (data.success) {
                addToast("تم إرسال طلب الترقية بنجاح", "success");
                setShowUpgradeModal(false);
                // Refresh session or redirect
                router.push("/verification/status");
            } else {
                addToast(data.error || "فشل إرسال الطلب", "error");
            }
        } catch (error) {
            console.error("Trader upgrade error:", error);
            addToast("حدث خطأ أثناء الاتصال بالخادم", "error");
        } finally {
            setIsUpgrading(false);
        }
    };

    const handleRoleSwitch = (role: ActiveRole) => {
        if (role === "TRADER") {
            // User is an approved/active trader — allow role switch directly.
            const isApproved = user?.userType === "TRADER" && (user?.status === "APPROVED" || user?.status === "ACTIVE");
            if (!isApproved) {
                router.push("/verification?role=TRADER");
                return;
            }
        }
        switchRole(role);
    };

    const isTraderApproved = user?.userType === "TRADER" && (user?.status === "APPROVED" || user?.status === "ACTIVE");

    if (isLoading) {
        return (
            <>
                <div className="flex items-center justify-center min-h-screen bg-bg-dark">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-slate-400">جاري التحميل...</p>
                    </div>
                </div>
                <BottomNavigation />
            </>
        );
    }

    if (!isAuthenticated) {
        return (
            <>
                <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
                    <div className="flex items-center justify-center p-4">
                        <h1 className="text-base font-bold text-white">حسابي</h1>
                    </div>
                </header>

                <main className="flex-1 pb-24">
                    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-primary !text-[48px]">person</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">مرحباً بك في Metalix24</h2>
                        <p className="text-slate-400 text-center mb-8">سجل دخولك للوصول إلى حسابك وإدارة صفقاتك</p>
                        
                        <div className="w-full max-w-sm space-y-3">
                            <Link
                                href="/login"
                                className="w-full h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition text-lg"
                            >
                                <span className="material-symbols-outlined">login</span>
                                تسجيل الدخول
                            </Link>
                            <Link
                                href="/register"
                                className="w-full h-14 bg-surface-highlight border border-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-surface-dark transition text-lg"
                            >
                                <span className="material-symbols-outlined">person_add</span>
                                إنشاء حساب جديد
                            </Link>
                        </div>

                        <div className="mt-10 w-full max-w-sm">
                            <p className="text-sm text-slate-500 text-center mb-4">تصفح بدون حساب</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/market" className="flex flex-col items-center p-4 bg-surface-highlight rounded-xl border border-slate-700 hover:border-primary/50 transition">
                                    <span className="material-symbols-outlined text-primary mb-2">analytics</span>
                                    <span className="text-sm text-slate-300">أسعار السوق</span>
                                </Link>
                                <Link href="/auctions" className="flex flex-col items-center p-4 bg-surface-highlight rounded-xl border border-slate-700 hover:border-primary/50 transition">
                                    <span className="material-symbols-outlined text-primary mb-2">gavel</span>
                                    <span className="text-sm text-slate-300">المزادات</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>

                <BottomNavigation />
            </>
        );
    }

    const statusBadge = getStatusBadge(user?.status || "PENDING");

    return (
        <>
            <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
                <div className="flex items-center justify-between p-4">
                    <Link href="/notifications" className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition">
                        <span className="material-symbols-outlined text-white">notifications</span>
                    </Link>
                    <h1 className="text-base font-bold text-white">{isAdmin ? "حساب الإدارة" : "حسابي"}</h1>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition"
                    >
                        <span className="material-symbols-outlined text-white">{isEditing ? "close" : "edit"}</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 pb-24">
                {/* Profile Card */}
                <div className="px-4 mt-4">
                    <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-5">
                        {/* Avatar & Name */}
                        <div className="text-center">
                            <div className="relative mx-auto size-24 mb-4">
                                <div className="size-24 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center overflow-hidden">
                                    {profile.avatar ? (
                                        <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-primary !text-[48px]">person</span>
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition shadow-lg">
                                        <span className="material-symbols-outlined !text-[18px]">photo_camera</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                    </label>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="space-y-3">
                                    {/* Smart Title Selector */}
                                    <TitleSelector
                                        value={profile.titleId}
                                        onChange={handleTitleChange}
                                        label="اللقب"
                                    />
                                    
                                    {/* Name Inputs */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={profile.firstName}
                                            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                            placeholder="الاسم الأول"
                                            className="bg-surface-dark border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                                        />
                                        <input
                                            type="text"
                                            value={profile.lastName}
                                            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                            placeholder="اسم العائلة"
                                            className="bg-surface-dark border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    {isTrader ? (
                                        <>
                                            {/* Company Name */}
                                            <input
                                                type="text"
                                                value={profile.companyName}
                                                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                                                placeholder="اسم الشركة / المنشأة"
                                                className="w-full bg-surface-dark border border-slate-600 rounded-lg px-4 py-2 text-white text-center focus:outline-none focus:border-primary"
                                            />

                                            {/* Company Type */}
                                            <select
                                                value={profile.companyType}
                                                onChange={(e) => setProfile({ ...profile, companyType: e.target.value })}
                                                className="w-full bg-surface-dark border border-slate-600 rounded-lg px-4 py-2 text-white text-center focus:outline-none focus:border-primary"
                                                title="نوع الشركة"
                                            >
                                                {companyTypes.map((c) => (
                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                ))}
                                            </select>

                                            {/* Business Type */}
                                            <select
                                                value={profile.businessType}
                                                onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                                                className="w-full bg-surface-dark border border-slate-600 rounded-lg px-4 py-2 text-white text-center focus:outline-none focus:border-primary"
                                                title="نوع النشاط"
                                            >
                                                {businessTypes.map((b) => (
                                                    <option key={b.value} value={b.value}>{b.label}</option>
                                                ))}
                                            </select>

                                            {/* Job Title */}
                                            <select
                                                value={profile.jobTitle}
                                                onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                                                className="w-full bg-surface-dark border border-slate-600 rounded-lg px-4 py-2 text-white text-center focus:outline-none focus:border-primary"
                                                title="المسمى الوظيفي"
                                            >
                                                {jobTitles.map((j) => (
                                                    <option key={j.value} value={j.value}>{j.label}</option>
                                                ))}
                                            </select>
                                        </>
                                    ) : (
                                        <>
                                            {/* Client Business Type */}
                                            <select
                                                value={profile.businessType}
                                                onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                                                className="w-full bg-surface-dark border border-slate-600 rounded-lg px-4 py-2 text-white text-center focus:outline-none focus:border-primary"
                                                title="نوع النشاط التجاري"
                                            >
                                                {clientBusinessTypes.map((c) => (
                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                ))}
                                            </select>
                                            
                                            {/* Custom Business Type input if 'OTHER' */}
                                            {profile.businessType === "OTHER" && (
                                                <input
                                                    type="text"
                                                    value={profile.customBusinessType || ""}
                                                    onChange={(e) => setProfile({ ...profile, customBusinessType: e.target.value })}
                                                    placeholder="يرجى تحديد النشاط..."
                                                    className="w-full bg-surface-dark border border-slate-600 rounded-lg px-4 py-2 text-white text-center focus:outline-none focus:border-primary"
                                                />
                                            )}
                                        </>
                                    )}

                                    {/* Bio */}
                                    <textarea
                                        value={profile.bio}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        placeholder="نبذة قصيرة عنك وعن نشاطك التجاري..."
                                        rows={3}
                                        className="w-full bg-surface-dark border border-slate-600 rounded-lg px-4 py-2 text-white text-center focus:outline-none focus:border-primary resize-none"
                                    />

                                    {/* Save Button */}
                                    <button
                                        onClick={handleSaveProfile}
                                        className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined !text-[20px]">save</span>
                                        حفظ التغييرات
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Title Badge */}
                                    {getTitleBadge(profile.titleId, profile.gender) && (
                                        <TitleBadge 
                                            titleId={profile.titleId} 
                                            gender={profile.gender} 
                                            size="sm" 
                                        />
                                    )}
                                    
                                    <div className="flex items-center justify-center gap-2">
                                        <h2 className="text-xl font-bold text-white">
                                            {getTitleLabel(profile.titleId, profile.gender)} {profile.firstName || profile.lastName || user?.name || "مستخدم"}
                                        </h2>
                                        {(user?.status === "APPROVED" || user?.status === "ACTIVE") && (
                                            <span className="material-symbols-outlined text-blue-500 !text-[20px] filled" title="حساب موثق">verified</span>
                                        )}
                                    </div>
                                    
                                    {isTrader && profile.companyName && (
                                        <p className="text-sm text-primary font-semibold mt-1">{profile.companyName}</p>
                                    )}
                                    
                                    <p className="text-sm text-slate-400 mt-0.5">
                                        {isTrader ? (
                                            `${getCompanyTypeLabel(profile.companyType)} • ${getUserTypeLabel(user?.userType || "TRADER")}`
                                        ) : (
                                            `${profile.businessType === "OTHER" ? (profile.customBusinessType || "أخرى") : getClientBusinessLabel(profile.businessType)} • عميل`
                                        )}
                                    </p>

                                    {isTrader && profile.jobTitle && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            {getJobTitleLabel(profile.jobTitle)}
                                        </p>
                                    )}
                                    
                                    <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${statusBadge.color} ${statusBadge.bg}`}>
                                        {statusBadge.label}
                                    </span>
                                    {safetyScore !== null && (
                                        <span className="inline-block mt-2 mr-2 text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                                            جاهزية السلامة: {safetyScore}%
                                        </span>
                                    )}
                                    
                                    {(isTrader || activeRole === "DRIVER") && (!isEditing) && trustData && (
                                        <div className="mt-4 flex justify-center">
                                            <TrustBadge 
                                                score={trustData.trustScore} 
                                                successRate={trustData.successRate} 
                                                totalReviews={trustData.totalReviews} 
                                            />
                                        </div>
                                    )}

                                    {/* Bio */}
                                    {profile.bio && (
                                        <p className="text-sm text-slate-400 mt-4 px-2 leading-relaxed">
                                            {profile.bio}
                                        </p>
                                    )}

                                    {/* Contact Info */}
                                    <div className="mt-4 space-y-2">
                                        {user?.phone && (
                                            <div className="text-sm text-slate-400 flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined !text-[16px]">phone</span>
                                                <span dir="ltr">+963 {user.phone}</span>
                                            </div>
                                        )}
                                        {user?.email && (
                                            <div className="text-sm text-slate-400 flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined !text-[16px]">email</span>
                                                <span dir="ltr">{user.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Stats */}
                        {!isEditing && (
                            <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-700/50">
                                <div className="text-center">
                                    <p className="text-xl font-bold text-white font-english">
                                        {isAdmin ? "👑" : dealsCount}
                                    </p>
                                    <p className="text-[10px] text-slate-500">{isAdmin ? "مدير النظام" : "صفقة"}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-white font-english">
                                        {isAdmin ? "100%" : "0★"}
                                    </p>
                                    <p className="text-[10px] text-slate-500">{isAdmin ? "صلاحيات" : "التقييم"}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-white font-english">
                                        {isAdmin ? "∞" : "0"}
                                    </p>
                                    <p className="text-[10px] text-slate-500">{isAdmin ? "وصول كامل" : "نقطة"}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Role Toggle Switch */}
                {isAuthenticated && !isEditing && (
                    <div className="px-4 mt-4">
                        <div className="flex flex-col gap-3">
                            <h3 className="text-[10px] font-bold text-slate-500 px-2 uppercase tracking-wider">
                                {isAdmin ? "تبديل المحاكاة (أدمن)" : "تبديل وضع الحساب"}
                            </h3>
                            <div className="flex bg-surface-highlight border border-slate-700 rounded-2xl p-1 w-full shadow-lg overflow-x-auto no-scrollbar">
                                {[
                                    { role: "CLIENT", label: "عميل", icon: "shopping_bag" },
                                    { role: "TRADER", label: "تاجر", icon: "storefront" },
                                    { role: "DRIVER", label: "سائق", icon: "local_shipping" },
                                    { role: "GOVERNMENT", label: "حكومي", icon: "account_balance" },
                                    ...(isAdmin ? [{ role: "ADMIN", label: "أدمن", icon: "admin_panel_settings" }] : [])
                                ].map((r) => (
                                    <button
                                        key={r.role}
                                        onClick={() => handleRoleSwitch(r.role as ActiveRole)}
                                        className={`flex-1 min-w-[70px] py-2.5 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
                                            activeRole === r.role 
                                                ? "bg-primary text-white shadow-lg shadow-orange-500/20 scale-[1.02]" 
                                                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                        }`}
                                    >
                                        <span className="material-symbols-outlined !text-[18px]">{r.icon}</span>
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Verification Alert */}
                {user?.status === "PENDING" && !isEditing && (
                    <div className="px-4 mt-4">
                        <Link href="/verification" className="block bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-yellow-500 !text-[24px]">warning</span>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-yellow-500">أكمل التوثيق</p>
                                    <p className="text-xs text-slate-400 mt-1">يرجى إكمال توثيق حسابك للوصول لجميع الميزات</p>
                                </div>
                                <span className="material-symbols-outlined text-yellow-500 !text-[20px]">chevron_left</span>
                            </div>
                        </Link>
                    </div>
                )}

                {activeRole === "DRIVER" && !isEditing && (
                    <div className="px-4 mt-4">
                        <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-bold text-white">بيانات السائق</h3>
                                    <p className="text-xs text-slate-500">إدارة معلوماتك الأساسية كسائق</p>
                                </div>
                                {driverProfileLoading && (
                                    <span className="text-xs text-slate-500">جاري التحديث...</span>
                                )}
                            </div>

                            {driverProfile ? (
                                <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                                    <div className="bg-surface-dark rounded-xl p-3 border border-slate-800">
                                        <p className="text-[10px] text-slate-500 mb-1">الاسم</p>
                                        <p className="text-sm font-bold text-white">{driverProfile.fullName}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">{driverProfile.city || "غير محدد"}</p>
                                    </div>
                                    <div className="bg-surface-dark rounded-xl p-3 border border-slate-800">
                                        <p className="text-[10px] text-slate-500 mb-1">الحالة</p>
                                        <p className="text-sm font-bold text-white">{driverProfile.status}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            {driverProfile.ratingAvg.toFixed(1)} ★ ({driverProfile.ratingCount})
                                        </p>
                                    </div>
                                    <div className="bg-surface-dark rounded-xl p-3 border border-slate-800">
                                        <p className="text-[10px] text-slate-500 mb-1">رقم الهاتف</p>
                                        <p className="text-sm font-bold text-white" dir="ltr">{driverProfile.phone}</p>
                                    </div>
                                    <div className="bg-surface-dark rounded-xl p-3 border border-slate-800">
                                        <p className="text-[10px] text-slate-500 mb-1">المركبات</p>
                                        <p className="text-sm font-bold text-white">
                                            {driverProfile.vehicles?.length ? driverProfile.vehicles.length : "لا توجد"}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-400">
                                    <p className="mb-3">لا يوجد ملف سائق مفعل لهذا الحساب.</p>
                                    <Link
                                        href="/verification?role=DRIVER"
                                        className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold"
                                    >
                                        <span className="material-symbols-outlined !text-[18px]">verified</span>
                                        ابدأ توثيق السائق
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Menu Grid */}
                {!isEditing && (
                    <>
                        <div className="px-4 mt-6">
                            <div className="flex flex-col gap-1">
                                {currentMenuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-highlight transition group"
                                    >
                                        <div className="size-10 rounded-lg bg-surface-dark flex items-center justify-center text-slate-400 group-hover:text-primary transition shrink-0">
                                            <span className="material-symbols-outlined !text-[22px]">{item.icon}</span>
                                        </div>
                                        <span className="flex-1 text-sm font-semibold text-slate-200 group-hover:text-white transition">
                                            {item.label}
                                        </span>
                                        <span className="material-symbols-outlined text-slate-600 !text-[18px]">chevron_left</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="px-4 mt-6 mb-4">
                            <button 
                                onClick={handleLogout}
                                className="w-full h-12 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm border border-red-500/20 hover:bg-red-500/20 transition flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined !text-[20px]">logout</span>
                                تسجيل الخروج
                            </button>
                        </div>
                    </>
                )}
            </main>

            {/* Upgrade Modal Removed as per user request to go directly to verification landing page */}
            <BottomNavigation />
        </>
    );
}
