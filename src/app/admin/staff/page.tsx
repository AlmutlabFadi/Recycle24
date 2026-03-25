"use client";

import { useEffect, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

const OWNER_EMAIL = "emixdigitall@gmail.com";

type Permission = {
    id: string;
    key: string;
    label: string;
};

type Role = { 
    id: string; 
    name: string;
    rolePermissions?: Array<{ permission: Permission }>;
};

type User = {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    userType: string;
    role: string;
    currentAdminStatus: string;
    adminAccessEnabled: boolean;
    lastActiveAt: string | null;
    userRoles: Array<{ role: Role }>;
};

type Invite = {
    id: string;
    code: string;
    email: string | null;
    phone: string | null;
    status: string;
    role: { name: string };
    createdAt: string;
    expiresAt: string | null;
};

const PERMISSION_CATEGORIES = [
    {
        name: "التحكم في النظام والمحتوى",
        icon: "settings_suggest",
        permissions: ["MANAGE_ACCESS", "MANAGE_KNOWLEDGE", "UPLOAD_MEDIA", "ACCESS_SAFETY", "ACCESS_CONSULTATIONS", "ACCESS_ACADEMY"]
    },
    {
        name: "العمليات المالية والتشغيل",
        icon: "account_balance",
        permissions: ["MANAGE_FINANCE", "FINANCE_FINAL_APPROVE", "MANAGE_REWARDS"]
    },
    {
        name: "إدارة المستخدمين والدعم",
        icon: "group_work",
        permissions: ["MANAGE_USERS", "MANAGE_DRIVERS", "REVIEW_DRIVER_DOCS", "MANAGE_SUPPORT"]
    }
];

export default function StaffManagementPage() {
    const { addToast } = useToast();
    const [staff, setStaff] = useState<User[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [inviteForm, setInviteForm] = useState({ email: "", phone: "", roleId: "", expiresAt: "" });

    // Staff Detail Modal
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editedRoleIds, setEditedRoleIds] = useState<string[]>([]);
    const [savingRoles, setSavingRoles] = useState(false);

    // Confirm Action Modal (warn/remove/block)
    const [actionModal, setActionModal] = useState<{ type: "remove" | "warn" | "block" | null; user: User | null }>({ type: null, user: null });
    const [actionReason, setActionReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [staffRes, inviteRes, roleRes] = await Promise.all([
                fetch("/api/admin/staff/list"),
                fetch("/api/admin/access/invites"),
                fetch("/api/admin/access/roles"),
            ]);
            if (staffRes.ok && inviteRes.ok && roleRes.ok) {
                const staffData = await staffRes.json();
                const inviteData = await inviteRes.json();
                const roleData = await roleRes.json();
                setStaff(staffData.users || []);
                setInvites(inviteData.invites || []);
                setAllRoles(roleData.roles || []);
                
                // Get unique permissions from all available roles
                const perms: Permission[] = [];
                const seen = new Set();
                roleData.roles.forEach((r: Role) => {
                    r.rolePermissions?.forEach(rp => {
                        if (!seen.has(rp.permission.key)) {
                            seen.add(rp.permission.key);
                            perms.push(rp.permission);
                        }
                    });
                });
                setAllPermissions(perms);
            }
        } catch {
            addToast("تعذر تحميل البيانات", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ─── Staff Detail Modal ──────────────────────────────────
    const openStaffDetail = (user: User) => {
        setSelectedUser(user);
        setEditedRoleIds(user.userRoles.map(ur => ur.role.id));
    };

    const closeStaffDetail = () => {
        setSelectedUser(null);
        setEditedRoleIds([]);
    };

    const toggleRole = (roleId: string) => {
        setEditedRoleIds(prev =>
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    // Toggle a granular permission by adding/removing its atomic role
    const toggleAtomicPermission = (permKey: string) => {
        const atomicRole = allRoles.find(r => r.name === `__PERM_${permKey}`);
        if (!atomicRole) {
            addToast(`تعذر العثور على نظام التحكم لهذه الصلاحية (${permKey}). يرجى تحديث النظام.`, "warning");
            return;
        }
        toggleRole(atomicRole.id);
    };

    const isPermissionEnabled = (permKey: string) => {
        // A permission is enabled if ANY of the selected roles (including atomic ones) grant it
        return allRoles
            .filter(r => editedRoleIds.includes(r.id))
            .some(r => r.rolePermissions?.some(rp => rp.permission.key === permKey));
    };

    const isPermissionFromMainRole = (permKey: string) => {
        // Check if permission comes from a non-atomic position role
        return allRoles
            .filter(r => editedRoleIds.includes(r.id) && !r.name.startsWith("__PERM_") && r.name !== "OWNER")
            .some(r => r.rolePermissions?.some(rp => rp.permission.key === permKey));
    };

    const handleSaveRoles = async () => {
        if (!selectedUser) return;
        setSavingRoles(true);
        try {
            const res = await fetch(`/api/admin/access/users/${selectedUser.id}/roles`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roleIds: editedRoleIds }),
            });
            if (res.ok) {
                addToast("تم حفظ الصلاحيات والتخصصات بنجاح", "success");
                closeStaffDetail();
                fetchData();
            } else {
                const data = await res.json().catch(() => ({}));
                addToast(data.error || "تعذر حفظ التعديلات", "error");
            }
        } catch {
            addToast("خطأ في الاتصال بالخادم", "error");
        } finally {
            setSavingRoles(false);
        }
    };

    // ─── Action Modal ────────────────
    const openActionModal = (type: "remove" | "warn" | "block", user: User) => {
        if (user.email === OWNER_EMAIL) {
            addToast("لا يمكن اتخاذ إجراءات إدارية ضد مالك المشروع", "error");
            return;
        }
        setActionModal({ type, user });
        setActionReason("");
    };

    const closeAction = () => {
        setActionModal({ type: null, user: null });
        setActionReason("");
        setActionLoading(false);
    };

    const executeAction = async () => {
        const { type, user } = actionModal;
        if (!type || !user) return;
        setActionLoading(true);
        try {
            let res: Response;
            if (type === "remove") {
                res = await fetch(`/api/admin/access/users/${user.id}/remove`, { method: "DELETE" });
            } else if (type === "warn") {
                if (!actionReason.trim()) { addToast("يجب كتابة سبب التحذير", "error"); setActionLoading(false); return; }
                res = await fetch("/api/admin/staff/warn", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.id, reason: actionReason, severity: "MEDIUM" }),
                });
            } else {
                res = await fetch("/api/admin/staff/block", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.id, reason: actionReason || "تم الحظر بواسطة الإدارة" }),
                });
            }
            if (res.ok) {
                const labels = { remove: "تمت إزالة الموظف", warn: "تم إرسال التحذير", block: "تم حظر الحساب" };
                addToast(labels[type] + " بنجاح", "success");
                closeAction();
                if (selectedUser?.id === user.id) closeStaffDetail();
                fetchData();
            } else {
                const data = await res.json().catch(() => ({}));
                addToast(data.error || "تعذر تنفيذ العملية", "error");
            }
        } catch {
            addToast("خطأ في الاتصال بالخادم", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleAccess = async (user: User) => {
        if (isOwner(user)) return;
        try {
            const newStatus = !user.adminAccessEnabled;
            const res = await fetch("/api/admin/staff/access-toggle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, enabled: newStatus }),
            });
            if (res.ok) {
                addToast(newStatus ? "تم تفعيل الوصول للوحة الإدارة" : "تم إيقاف الوصول للوحة الإدارة", "success");
                fetchData();
            } else {
                addToast("تعذر تغيير حالة الوصول", "error");
            }
        } catch {
            addToast("خطأ في الاتصال بالخادم", "error");
        }
    };

    // ─── Invites ─────────────────────────────────────────────
    const handleCreateInvite = async () => {
        if (!inviteForm.roleId) return addToast("يجب اختيار دور للموظف", "error");
        try {
            const res = await fetch("/api/admin/access/invites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(inviteForm),
            });
            if (res.ok) {
                addToast("تم إرسال الدعوة بنجاح", "success");
                setInviteForm({ email: "", phone: "", roleId: "", expiresAt: "" });
                fetchData();
            } else {
                addToast("تعذر إنشاء الدعوة", "error");
            }
        } catch { addToast("حدث خطأ ما", "error"); }
    };

    const handleRevokeInvite = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/access/invites/${id}/revoke`, { method: "PATCH" });
            if (res.ok) { addToast("تم إلغاء الدعوة", "success"); fetchData(); }
        } catch { addToast("تعذر إلغاء الدعوة", "error"); }
    };

    // ─── Helpers ─────────────────────────────────────────────
    const filteredStaff = staff.filter(u =>
        u.name?.includes(searchTerm) || u.email?.includes(searchTerm) || u.phone?.includes(searchTerm)
    );
    const isOwner = (user: User) => user.email === OWNER_EMAIL;
    const getStatusResource = (s: string) => {
        if (s === "ONLINE") return { label: "نشط الآن", class: "text-emerald-400 bg-emerald-500/10", dot: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" };
        if (s === "IDLE") return { label: "خامل", class: "text-amber-400 bg-amber-500/10", dot: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]" };
        if (s === "BREAK") return { label: "استراحة", class: "text-blue-400 bg-blue-500/10", dot: "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" };
        return { label: "غير متصل", class: "text-slate-500 bg-slate-800/20", dot: "bg-slate-700" };
    };

    const rolesChanged = selectedUser
        ? JSON.stringify([...editedRoleIds].sort()) !== JSON.stringify([...selectedUser.userRoles.map(ur => ur.role.id)].sort())
        : false;

    const actionConfig: Record<string, any> = {
        remove: { title: "إزالة الموظف نهائياً", desc: "سيتم حذف الموظف من فريق العمل وسحب جميع صلاحياته فوراً", icon: "person_remove", color: "text-red-400", bg: "bg-red-500/10", btn: "bg-red-500 hover:bg-red-600", btnText: "تأكيد الإزالة" },
        warn: { title: "إصدار تحذير إداري", desc: "سيتم تسجيل مخالفة في سجل نشاط الموظف وإرسال إشعار فوري له", icon: "security_update_warning", color: "text-amber-400", bg: "bg-amber-500/10", btn: "bg-amber-500 hover:bg-amber-600", btnText: "إرسال التحذير" },
        block: { title: "حظر الحساب المؤقت", desc: "سيتم قفل حساب الموظف ومنعه من الوصول إلى أي قسم إداري", icon: "lock_person", color: "text-red-500", bg: "bg-red-500/10", btn: "bg-red-600 hover:bg-red-700", btnText: "تأكيد الحظر" },
    };

    if (loading) return <div className="min-h-screen bg-[#080b14] flex items-center justify-center text-white">جاري تحميل المنظومة...</div>;

    return (
        <div className="min-h-screen bg-[#080b14] text-white font-display">
            <HeaderWithBack title="إدارة طاقم العمل والوصول" />

            <main className="p-6 max-w-7xl mx-auto space-y-12 pb-32">
                {/* Search & Stats Header */}
                <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
                    <div className="relative w-full max-w-2xl">
                        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 !text-2xl">search</span>
                        <input type="text" placeholder="ابحث باسم الموظف، بريده، أو رقم الهاتف..."
                            className="w-full bg-slate-900/40 border border-slate-800/60 rounded-[2rem] pl-14 pr-8 py-5 text-sm focus:border-blue-500/50 hover:bg-slate-900/60 transition-all outline-none backdrop-blur-3xl shadow-2xl"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-4 bg-slate-900/40 border border-slate-800/60 px-8 py-4 rounded-[2rem] backdrop-blur-xl">
                         <div className="text-right border-l border-slate-800 pl-6">
                            <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest">إجمالي الموظفين</div>
                            <div className="text-2xl font-black">{staff.length}</div>
                         </div>
                         <div className="text-right pr-6">
                            <div className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">متصل الآن</div>
                            <div className="text-2xl font-black">{staff.filter(s => s.currentAdminStatus === 'ONLINE').length}</div>
                         </div>
                    </div>
                </div>

                {/* Staff Cards Grid (Mockup 3 Style) */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredStaff.map((user) => {
                        const status = getStatusResource(user.currentAdminStatus);
                        // Filter out atomic permission roles for the card display to keep it clean
                        const positionRoles = user.userRoles.filter(ur => !ur.role.name.startsWith("__PERM_") && ur.role.name !== "OWNER");
                        
                        return (
                            <div key={user.id} className="group relative bg-[#0c111d] border border-slate-800/60 rounded-[3rem] p-10 hover:border-blue-500/40 transition-all duration-700 hover:shadow-[0_32px_96px_-12px_rgba(59,130,246,0.15)] flex flex-col">
                                {/* Status Indicator */}
                                <div className={`absolute top-10 right-10 flex items-center gap-2 px-3 py-1 rounded-full ${status.class}`}>
                                    <div className={`size-1.5 rounded-full ${status.dot}`}></div>
                                    <span className="text-[9px] font-black uppercase tracking-tighter">{status.label}</span>
                                </div>

                                <div className="flex flex-col items-center text-center mb-8">
                                    {/* Avatar */}
                                    <div className={`size-24 rounded-[2.2rem] flex items-center justify-center p-1.5 mb-6 transition-all duration-500 bg-gradient-to-br ${isOwner(user) ? 'from-amber-400 via-amber-600 to-amber-900' : 'from-blue-400 via-blue-600 to-blue-900'}`}>
                                        <div className="size-full bg-[#0c111d] rounded-[2rem] flex items-center justify-center overflow-hidden">
                                            <span className={`material-symbols-outlined !text-4xl ${isOwner(user) ? 'text-amber-400' : 'text-blue-400'}`}>
                                                {isOwner(user) ? 'shield' : 'person_pin'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors mb-1">{user.name || "عضو مجهول"}</h3>
                                    <p className="text-[11px] text-slate-500 mb-6 font-mono tracking-tight">{user.email || user.phone}</p>

                                    {/* Position Badges */}
                                    <div className="flex flex-wrap justify-center gap-1.5 min-h-[28px]">
                                        {isOwner(user) ? (
                                            <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-1.5 rounded-2xl font-black uppercase tracking-tighter">مالك المنظومة</span>
                                        ) : positionRoles.length > 0 ? (
                                            positionRoles.map(ur => (
                                                <span key={ur.role.id} className="text-[10px] bg-slate-900/60 text-slate-400 border border-slate-800/60 px-4 py-1.5 rounded-2xl font-bold">
                                                    {ur.role.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-slate-600 italic px-4 py-1.5 border border-dashed border-slate-800 rounded-2xl">لم يتم تحديد مسمى</span>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-slate-800/40">
                                    <button onClick={() => openStaffDetail(user)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] py-4 text-[11px] font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                                        <span className="material-symbols-outlined !text-sm">settings_account_box</span>
                                        إدارة المهام
                                    </button>
                                    {isOwner(user) ? (
                                        <div className="bg-slate-900/60 border border-slate-800 rounded-[1.5rem] flex items-center justify-center gap-2 group/owner">
                                            <span className="material-symbols-outlined !text-sm text-amber-500 group-hover/owner:rotate-12 transition-transform">verified</span>
                                            <span className="text-[9px] font-black text-slate-500">حساب محمي</span>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[1.5rem] flex items-center justify-between px-4 group/access transition-all hover:bg-slate-900/60">
                                            <div className="flex flex-col text-right">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">وصول اللوحة</span>
                                                <span className={`text-[9px] font-black ${user.adminAccessEnabled ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {user.adminAccessEnabled ? 'مفعل' : 'مقيد'}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handleToggleAccess(user)}
                                                className={`size-8 rounded-full flex items-center justify-center transition-all ${user.adminAccessEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500 hover:scale-110 active:scale-95'}`}
                                                title={user.adminAccessEnabled ? "إيقاف الوصول" : "تفعيل الوصول"}
                                            >
                                                <span className="material-symbols-outlined !text-md">
                                                    {user.adminAccessEnabled ? 'toggle_on' : 'toggle_off'}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                    
                                    {!isOwner(user) && (
                                        <button onClick={() => openActionModal("warn", user)}
                                            className="col-span-2 bg-slate-950 border border-slate-800 hover:bg-red-500/10 hover:border-red-500/20 text-slate-500 hover:text-red-400 rounded-[1.5rem] py-4 text-[11px] font-black flex items-center justify-center gap-2 transition-all active:scale-95">
                                            <span className="material-symbols-outlined !text-sm">security_update_warning</span>
                                            سحب صلاحية / تحذير
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* Invite System (Grid Layout) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Invite Form */}
                    <div className="lg:col-span-7 bg-[#0c111d] border border-slate-800/60 rounded-[3rem] p-10 flex flex-col justify-between">
                         <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-14 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-400"><span className="material-symbols-outlined !text-2xl">person_add</span></div>
                                <div><h3 className="text-xl font-black">إضافة عضو جديد</h3><p className="text-xs text-slate-500">قم بإنتاج رابط دعوة آمن لتعيين موظف جديد في النظام</p></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-4">رقم الهاتف أو البريد</label>
                                    <input type="text" placeholder="example@metalix24.com"
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-6 py-4 text-xs focus:border-blue-500/50 outline-none transition-all"
                                        value={inviteForm.email} onChange={(e) => setInviteForm(p => ({ ...p, email: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-4">المسمى الوظيفي الأولي</label>
                                    <select title="اختر الدور"
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-6 py-4 text-xs focus:border-blue-500/50 outline-none text-slate-400 appearance-none transition-all"
                                        value={inviteForm.roleId} onChange={(e) => setInviteForm(p => ({ ...p, roleId: e.target.value }))}>
                                        <option value="">-- حدد القسم --</option>
                                        {allRoles.filter(r => !r.name.startsWith("__PERM_") && r.name !== "OWNER").map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                         </div>
                         <button onClick={handleCreateInvite}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black py-5 rounded-[1.5rem] text-sm transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                            توليد وإرسال الدعوة الآمنة
                         </button>
                    </div>

                    {/* Pending Invites List */}
                    <div className="lg:col-span-5 bg-[#0c111d] border border-slate-800/60 rounded-[3rem] p-10 flex flex-col">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/40">
                             <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest tracking-tighter">دعوات معلقة</h4>
                             <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-400">{invites.filter(i => i.status === 'PENDING').length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[300px]">
                            {invites.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center">
                                    <span className="material-symbols-outlined !text-4xl mb-2">mail_outline</span>
                                    <p className="text-[10px] font-bold">لا توجد دعوات نشطة حالياً</p>
                                </div>
                            ) : (
                                invites.map(inv => (
                                    <div key={inv.id} className="group flex items-center justify-between p-5 bg-slate-950/40 rounded-3xl border border-slate-800/40 hover:border-blue-500/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                <span className="material-symbols-outlined !text-lg">how_to_reg</span>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-black text-white">{inv.role.name}</div>
                                                <div className="text-[10px] text-slate-500">{inv.email || inv.phone}</div>
                                                <div className="text-[8px] font-mono text-slate-700 mt-1 uppercase tracking-widest">{inv.code}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRevokeInvite(inv.id)} className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all">
                                            <span className="material-symbols-outlined !text-xl">cancel</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* ═══════════ GRANULAR SPECIALIZATION MODAL (Mockup 2 & 7 Style) ═══════════ */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl bg-black/80" onClick={closeStaffDetail}>
                    <div className="bg-[#0c1120] border border-slate-800/60 rounded-[3.5rem] w-full max-w-5xl shadow-[0_64px_128px_-32px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
                        {/* Header Section */}
                        <div className="p-10 pb-6 relative flex items-center justify-between border-b border-slate-800/40 bg-gradient-to-b from-slate-900/40 to-transparent">
                            <div className="flex items-center gap-8">
                                <div className={`size-24 rounded-[2rem] flex items-center justify-center bg-gradient-to-br p-0.5 ${isOwner(selectedUser) ? 'from-amber-400 to-amber-700' : 'from-blue-600 to-blue-800'}`}>
                                    <div className="size-full bg-[#0c1120] rounded-[1.9rem] flex items-center justify-center">
                                         <span className={`material-symbols-outlined !text-4xl ${isOwner(selectedUser) ? 'text-amber-400' : 'text-blue-400'}`}>
                                            {isOwner(selectedUser) ? 'admin_panel_settings' : 'shield_with_heart'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white tracking-tight">{selectedUser.name}</h2>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-[10px] text-slate-500 bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700/50 font-mono italic">Staff-ID: {selectedUser.id.substring(0, 12)}</span>
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${getStatusResource(selectedUser.currentAdminStatus).class}`}>
                                            {getStatusResource(selectedUser.currentAdminStatus).label}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {!isOwner(selectedUser) && (
                                    <button onClick={handleSaveRoles} disabled={savingRoles || !rolesChanged}
                                        className={`px-10 py-4 rounded-[1.5rem] text-sm font-black transition-all shadow-2xl active:scale-95 ${rolesChanged 
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' 
                                            : 'bg-slate-800 text-slate-500 shadow-none cursor-not-allowed'}`}>
                                        {savingRoles ? "جاري المعالجة..." : "حفظ الصلاحيات والميزات"}
                                    </button>
                                )}
                                <button onClick={closeStaffDetail} className="p-4 bg-slate-800/50 hover:bg-slate-700 rounded-2xl transition-all shadow-inner">
                                    <span className="material-symbols-outlined text-white">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(30,41,59,0.2),transparent)]">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                                {/* Left Column: Position/Roles */}
                                <div className="lg:col-span-4 space-y-10">
                                    <div>
                                        <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                            <span className="material-symbols-outlined !text-lg">corporate_fare</span>
                                            التصنيف الوظيفي (الأدوار)
                                        </h4>
                                        <div className="space-y-4">
                                            {allRoles.filter(r => !r.name.startsWith("__PERM_") && r.name !== "OWNER").map(role => {
                                                const isActive = editedRoleIds.includes(role.id);
                                                return (
                                                    <button key={role.id} onClick={() => toggleRole(role.id)} disabled={isOwner(selectedUser)}
                                                        className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all duration-500 ${isActive 
                                                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/5' 
                                                            : 'bg-slate-900/50 border-slate-800/60 text-slate-600 hover:border-slate-700 group'}`}>
                                                        <span className="text-xs font-black tracking-tight">{role.name}</span>
                                                        <div className={`size-6 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-blue-500 border-blue-500 scale-110' : 'border-slate-800'}`}>
                                                            {isActive && <span className="material-symbols-outlined !text-[10px] text-white font-black">check_bold</span>}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Danger Zone (Styled like a control panel) */}
                                    {!isOwner(selectedUser) && (
                                        <div className="pt-10 border-t border-slate-800/40">
                                             <h4 className="text-[11px] font-black text-red-500/80 uppercase tracking-widest mb-6 flex items-center gap-3">
                                                <span className="material-symbols-outlined !text-lg">vpn_key_off</span>
                                                سحب الثقة والوصول
                                             </h4>
                                             <div className="grid grid-cols-1 gap-3">
                                                <button onClick={() => openActionModal("warn", selectedUser)} className="group flex items-center gap-5 p-5 rounded-[1.5rem] bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 transition-all text-right">
                                                    <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined !text-xl">warning_amber</span></div>
                                                    <div><div className="text-[11px] font-black text-amber-400 uppercase">إصدار تحذير</div><div className="text-[9px] text-amber-500/60 mt-0.5">تسجيل مخالفة رسمية في السجل</div></div>
                                                </button>
                                                <button onClick={() => openActionModal("block", selectedUser)} className="group flex items-center gap-5 p-5 rounded-[1.5rem] bg-red-600/5 hover:bg-red-600/10 border border-red-600/10 transition-all text-right">
                                                    <div className="size-12 rounded-2xl bg-red-600/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined !text-xl">lock_open</span></div>
                                                    <div><div className="text-[11px] font-black text-red-400 uppercase">تجميد حساب</div><div className="text-[9px] text-red-500/60 mt-0.5">إيقاف فوري للوصول الإداري</div></div>
                                                </button>
                                                <button onClick={() => openActionModal("remove", selectedUser)} className="group flex items-center gap-5 p-5 rounded-[1.5rem] bg-slate-900 border border-slate-800 text-slate-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all text-right">
                                                    <div className="size-12 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-white/10"><span className="material-symbols-outlined !text-xl">person_off</span></div>
                                                    <div><div className="text-[11px] font-black uppercase">فصل نهائي</div><div className="text-[9px] opacity-60 mt-0.5">حذف العضو من طاقم العمل</div></div>
                                                </button>
                                             </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Granular Specializations (Mockup 2 & 7) */}
                                <div className="lg:col-span-8 space-y-12">
                                    {isOwner(selectedUser) ? (
                                        <div className="flex flex-col items-center justify-center py-20 bg-amber-500/5 border border-amber-500/10 rounded-[4rem] text-center px-12">
                                            <div className="size-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 animate-pulse text-amber-400">
                                                <span className="material-symbols-outlined !text-5xl">verified_user</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-amber-500 mb-4">وصول النخبة (مالك النظام)</h3>
                                            <p className="text-sm text-amber-500/60 leading-relaxed max-w-sm">بصفتك مالك المشروع، لا يمكن لأي مسؤول آخر تقييد هذه الصلاحيات أو تعديل تخصصاتك. أنت تملك الولاية الكاملة على البنية التحتية.</p>
                                        </div>
                                    ) : (
                                        PERMISSION_CATEGORIES.map((cat, idx) => (
                                            <div key={idx} className="space-y-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-2xl bg-slate-800/50 flex items-center justify-center text-blue-400">
                                                        <span className="material-symbols-outlined !text-xl">{cat.icon}</span>
                                                    </div>
                                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">{cat.name}</h4>
                                                    <div className="flex-1 h-[1px] bg-gradient-to-r from-slate-800/60 to-transparent"></div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    {allPermissions.filter(p => cat.permissions.includes(p.key)).map(perm => {
                                                        const isEnabled = isPermissionEnabled(perm.key);
                                                        const isFromMain = isPermissionFromMainRole(perm.key);
                                                        
                                                        return (
                                                            <div key={perm.key} 
                                                                onClick={() => !isFromMain && toggleAtomicPermission(perm.key)}
                                                                className={`group flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 ${isFromMain ? 'cursor-default opacity-80' : 'cursor-pointer'} ${isEnabled 
                                                                    ? 'bg-blue-500/5 border-blue-500/30 shadow-[0_8px_32px_rgba(59,130,246,0.05)]' 
                                                                    : 'bg-slate-900/20 border-slate-800 hover:border-slate-700'}`}>
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`size-2.5 rounded-full ${isEnabled ? (isFromMain ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]') : 'bg-slate-700'}`}></div>
                                                                        <span className={`text-[12px] font-black ${isEnabled ? 'text-white' : 'text-slate-500'}`}>{perm.label}</span>
                                                                    </div>
                                                                    {isFromMain && (
                                                                        <div className="text-[8px] text-amber-500/60 font-medium mr-5 leading-none">ممنوحة عبر "المسمى الوظيفي"</div>
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Custom Toggle Switch */}
                                                                <div className={`relative w-12 h-7 rounded-full transition-all duration-500 flex items-center px-1.5 ${isEnabled ? (isFromMain ? 'bg-amber-500/30' : 'bg-blue-600') : 'bg-slate-800/80 shadow-inner'}`}>
                                                                    <div className={`size-4.5 bg-white rounded-full transition-all duration-500 shadow-xl ${isEnabled ? 'translate-x-[1.3rem]' : 'translate-x-0'}`}></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════ ACTION CONFIRMATION MODAL ═══════════ */}
            {actionModal.type && actionModal.user && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/95">
                    <div className="bg-[#0c111d] border border-slate-700/60 rounded-[4rem] w-full max-w-xl p-16 shadow-[0_0_128px_rgba(0,0,0,1)] relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className={`absolute top-0 right-0 size-64 blur-[100px] opacity-10 -mr-32 -mt-32 ${actionModal.type === 'warn' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                        
                        <div className="relative flex flex-col items-center text-center">
                            <div className={`size-28 rounded-[2.5rem] ${actionConfig[actionModal.type].bg} flex items-center justify-center mb-10 shadow-2xl`}>
                                <span className={`material-symbols-outlined !text-5xl ${actionConfig[actionModal.type].color}`}>{actionConfig[actionModal.type].icon}</span>
                            </div>
                            <h3 className="text-3xl font-black mb-4 tracking-tight">{actionConfig[actionModal.type].title}</h3>
                            <p className="text-sm text-slate-500 mb-10 leading-relaxed max-w-[320px]">{actionConfig[actionModal.type].desc}</p>
                        </div>

                        <div className="bg-[#080b14] border border-slate-800 rounded-[2rem] p-8 mb-10 flex items-center gap-6 shadow-inner">
                             <div className="size-16 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800/50"><span className="material-symbols-outlined text-slate-500 !text-3xl">person</span></div>
                             <div className="text-right">
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 opacity-60">الموظف المعني بالقرار</div>
                                <div className="text-xl font-black text-blue-400">{actionModal.user.name}</div>
                             </div>
                        </div>

                        {(actionModal.type === "warn" || actionModal.type === "block") && (
                            <div className="mb-10">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mr-6 mb-2 block">تفاصيل السبب (اختياري)</label>
                                <textarea
                                    className="w-full bg-[#080b14]/50 border border-slate-800 rounded-[2.2rem] px-8 py-8 text-sm focus:border-red-500/50 outline-none resize-none h-40 placeholder:text-slate-800 transition-all font-medium"
                                    placeholder={actionModal.type === "warn" ? "لماذا يتم إصدار هذا التحذير؟ سيظهر في ملف الموظف..." : "لماذا يتم حظر هذا الموظف؟"}
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6 relative">
                            <button onClick={closeAction} className="bg-slate-900 hover:bg-slate-800 text-white font-black py-6 rounded-[2rem] text-sm transition-all border border-slate-800 active:scale-95 shadow-xl" disabled={actionLoading}>إلغاء الأمر</button>
                            <button onClick={executeAction} disabled={actionLoading}
                                className={`text-white font-black py-6 rounded-[2rem] text-sm transition-all shadow-2xl active:scale-95 ${actionConfig[actionModal.type].btn} ${actionLoading ? 'opacity-50' : ''}`}>
                                {actionLoading ? "جاري المعالجة..." : actionConfig[actionModal.type].btnText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;700&display=swap');
                
                body {
                    font-family: 'IBM Plex Sans Arabic', sans-serif;
                    background-color: #080b14;
                }

                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
                
                .font-display { font-family: 'IBM Plex Sans Arabic', sans-serif; }
            `}</style>
        </div>
    );
}
