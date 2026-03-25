"use client";

import { useEffect, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

const OWNER_EMAIL = "emixdigitall@gmail.com";

type Role = { id: string; name: string };
type User = {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    userType: string;
    role: string;
    currentAdminStatus: string;
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

export default function StaffManagementPage() {
    const { addToast } = useToast();
    const [staff, setStaff] = useState<User[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
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
                addToast("تم حفظ الصلاحيات بنجاح", "success");
                closeStaffDetail();
                fetchData();
            } else {
                const data = await res.json().catch(() => ({}));
                addToast(data.error || "تعذر حفظ الصلاحيات", "error");
            }
        } catch {
            addToast("خطأ في الاتصال بالخادم", "error");
        } finally {
            setSavingRoles(false);
        }
    };

    // ─── Action Modal (warn / remove / block) ────────────────
    const openActionModal = (type: "remove" | "warn" | "block", user: User) => {
        if (user.email === OWNER_EMAIL) {
            addToast("لا يمكن تنفيذ هذا الإجراء على مالك المشروع", "error");
            return;
        }
        closeStaffDetail(); // Close detail first
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
    const getStatusDot = (status: string) => {
        if (status === "ONLINE") return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
        if (status === "IDLE") return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
        if (status === "BREAK") return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
        return "bg-red-500/60";
    };
    const getStatusLabel = (s: string) => {
        if (s === "ONLINE") return "متصل";
        if (s === "IDLE") return "خامل";
        if (s === "BREAK") return "استراحة";
        return "غير متصل";
    };

    const rolesChanged = selectedUser
        ? JSON.stringify([...editedRoleIds].sort()) !== JSON.stringify([...selectedUser.userRoles.map(ur => ur.role.id)].sort())
        : false;

    const actionConfig: Record<string, any> = {
        remove: { title: "إزالة الموظف من فريق العمل", desc: "سيتم سحب جميع الصلاحيات وإعادة الحساب إلى عميل عادي فوراً", icon: "person_remove", color: "text-red-400", bg: "bg-red-500/10", btn: "bg-red-500 hover:bg-red-600", btnText: "تأكيد الإزالة نهائياً", needsReason: false },
        warn: { title: "إرسال تحذير رسمي", desc: "سيتم تسجيل التحذير في سجل النشاط وإبلاغ الموظف", icon: "warning", color: "text-amber-400", bg: "bg-amber-500/10", btn: "bg-amber-500 hover:bg-amber-600", btnText: "إرسال التحذير", needsReason: true },
        block: { title: "حظر الحساب نهائياً", desc: "سيتم قفل الحساب وسحب جميع الصلاحيات فوراً", icon: "block", color: "text-red-500", bg: "bg-red-500/10", btn: "bg-red-600 hover:bg-red-700", btnText: "تأكيد الحظر النهائي", needsReason: false },
    };

    if (loading) return <div className="min-h-screen bg-bg-dark flex items-center justify-center text-white">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-bg-dark text-white font-display">
            <HeaderWithBack title="إدارة فريق العمل والمنظومة" />

            <main className="p-4 max-w-7xl mx-auto space-y-8 pb-20">
                {/* Search */}
                <div className="relative w-full">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                    <input type="text" placeholder="بحث عن موظف..."
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-emerald-500 transition-all outline-none"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                {/* Staff Grid — Click name to open detail */}
                <section className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-400">badge</span>
                            الموظفين النشطين
                        </h2>
                        <span className="text-[10px] text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">{filteredStaff.length} موظف</span>
                    </div>

                    <div className="divide-y divide-slate-800/30">
                        {filteredStaff.map((user) => (
                            <div key={user.id}
                                onClick={() => openStaffDetail(user)}
                                className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                            >
                                {/* Left: Name & Info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`size-12 rounded-2xl flex items-center justify-center border-2 transition-all shrink-0 ${isOwner(user) ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30' : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 group-hover:border-emerald-500/50'}`}>
                                        <span className={`material-symbols-outlined !text-xl ${isOwner(user) ? 'text-amber-400' : 'text-slate-400 group-hover:text-emerald-400 transition-colors'}`}>
                                            {isOwner(user) ? 'shield_person' : 'person'}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-black text-white leading-tight flex items-center gap-2 flex-wrap">
                                            {user.name || "بدون اسم"}
                                            {isOwner(user) && (
                                                <span className="text-[8px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-black uppercase">مالك المشروع</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-500 truncate">{user.email || user.phone}</div>
                                    </div>
                                </div>

                                {/* Center: Roles */}
                                <div className="hidden md:flex flex-wrap gap-1 mx-4 max-w-[300px]">
                                    {user.userRoles.map(ur => (
                                        <span key={ur.role.id} className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                                            {ur.role.name}
                                        </span>
                                    ))}
                                </div>

                                {/* Right: Status + Arrow */}
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`size-2.5 rounded-full ${getStatusDot(user.currentAdminStatus)}`}></div>
                                        <span className="text-[10px] font-bold text-slate-400">{getStatusLabel(user.currentAdminStatus)}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-700 group-hover:text-emerald-400 transition-colors !text-lg">chevron_left</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Invitations & Quick Links */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Invite Form */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-400 !text-sm">person_add</span>
                                دعوة موظف جديد
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <input type="email" placeholder="البريد الإلكتروني (اختياري)"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-500/50 outline-none"
                                        value={inviteForm.email} onChange={(e) => setInviteForm(p => ({ ...p, email: e.target.value }))} />
                                    <input type="text" placeholder="رقم الهاتف (اختياري)"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-500/50 outline-none"
                                        value={inviteForm.phone} onChange={(e) => setInviteForm(p => ({ ...p, phone: e.target.value }))} />
                                </div>
                                <div className="space-y-4">
                                    <select title="اختر الدور الوظيفي"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-500/50 outline-none text-slate-400"
                                        value={inviteForm.roleId} onChange={(e) => setInviteForm(p => ({ ...p, roleId: e.target.value }))}>
                                        <option value="">اختر الدور الوظيفي</option>
                                        {allRoles.filter(r => r.name !== "OWNER").map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                    <button onClick={handleCreateInvite}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/10">
                                        توليد وإرسال الدعوة
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Invites List */}
                        <div className="bg-slate-950/40 border border-slate-800 rounded-3xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-300">
                                    <span className="material-symbols-outlined text-amber-500">mail</span>
                                    دعوات لم تنتهِ
                                </h3>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {invites.length === 0 ? (
                                    <div className="p-10 text-center text-slate-500 text-xs">لا يوجد دعوات معلقة</div>
                                ) : (
                                    <div className="divide-y divide-slate-800/50">
                                        {invites.map((inv) => (
                                            <div key={inv.id} className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-2 rounded-full ${inv.status === 'PENDING' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                                                    <div>
                                                        <div className="text-[11px] font-bold">{inv.role.name}</div>
                                                        <div className="text-[10px] text-slate-500">{inv.email || inv.phone}</div>
                                                        <div className="text-[9px] text-slate-600 mt-0.5 font-mono">{inv.code}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[9px] px-2 py-0.5 rounded border ${inv.status === 'PENDING' ? 'text-amber-400 border-amber-400/20' : inv.status === 'USED' ? 'text-emerald-400 border-emerald-400/20' : 'text-red-400 border-red-400/20'}`}>
                                                        {inv.status === 'PENDING' ? 'قيد الانتظار' : inv.status === 'USED' ? 'تم الاستخدام' : 'ملغية'}
                                                    </span>
                                                    {inv.status === 'PENDING' && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleRevokeInvite(inv.id); }} className="text-[10px] text-slate-400 hover:text-red-400 transition-colors">إلغاء</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats/Links */}
                    <div className="space-y-6">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6">
                            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-tighter mb-4">نشاط فريق العمل</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between"><span className="text-[11px] text-slate-400">النشطين الآن</span><span className="text-sm font-bold text-emerald-400">{staff.filter(s => s.currentAdminStatus === 'ONLINE').length}</span></div>
                                <div className="flex items-center justify-between"><span className="text-[11px] text-slate-400">إجمالي الفريق</span><span className="text-sm font-bold text-white">{staff.length}</span></div>
                            </div>
                        </div>
                        <Link href="/admin/staff/leaderboard" className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 hover:bg-emerald-500/20 transition-all group">
                            <div className="flex items-center gap-4"><div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><span className="material-symbols-outlined">leaderboard</span></div><div><h4 className="text-sm font-bold">قائمة المتصدرين</h4><p className="text-[10px] text-slate-500">الأكثر كفاءة ونشاطاً</p></div></div>
                            <span className="material-symbols-outlined text-slate-600 group-hover:text-emerald-400 transition-all">arrow_back</span>
                        </Link>
                        <Link href="/admin/staff/activity" className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-600 transition-all group">
                            <div className="flex items-center gap-4"><div className="size-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400"><span className="material-symbols-outlined">history</span></div><div><h4 className="text-sm font-bold">سجلات النشاط</h4><p className="text-[10px] text-slate-500">مراجعة العمليات اليومية</p></div></div>
                            <span className="material-symbols-outlined text-slate-600 group-hover:text-emerald-400 transition-all">arrow_back</span>
                        </Link>
                        <Link href="/admin/access" className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-600 transition-all group">
                            <div className="flex items-center gap-4"><div className="size-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400"><span className="material-symbols-outlined">settings</span></div><div><h4 className="text-sm font-bold">إدارة الصلاحيات</h4><p className="text-[10px] text-slate-500">تعديل الأدوار والقوانين</p></div></div>
                            <span className="material-symbols-outlined text-slate-600 group-hover:text-emerald-400 transition-all">arrow_back</span>
                        </Link>
                    </div>
                </section>
            </main>

            {/* ═══════════ STAFF DETAIL MODAL ═══════════ */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} onClick={closeStaffDetail}>
                    <div className="bg-[#0c1120] border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800 flex items-center gap-4">
                            <div className={`size-14 rounded-2xl flex items-center justify-center border-2 ${isOwner(selectedUser) ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                                <span className={`material-symbols-outlined !text-2xl ${isOwner(selectedUser) ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {isOwner(selectedUser) ? 'shield_person' : 'person'}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-white">{selectedUser.name || "بدون اسم"}</h3>
                                <p className="text-[10px] text-slate-500">{selectedUser.email || selectedUser.phone}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`size-2.5 rounded-full ${getStatusDot(selectedUser.currentAdminStatus)}`}></div>
                                <span className="text-[10px] font-bold text-slate-400">{getStatusLabel(selectedUser.currentAdminStatus)}</span>
                            </div>
                            <button onClick={closeStaffDetail} className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors">
                                <span className="material-symbols-outlined text-slate-500 hover:text-white">close</span>
                            </button>
                        </div>

                        {/* Roles / Permissions */}
                        <div className="p-6 border-b border-slate-800">
                            <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-4">الأدوار والصلاحيات الممنوحة</h4>

                            {isOwner(selectedUser) ? (
                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
                                    <span className="text-amber-400 text-xs font-bold">🔒 مالك المشروع — جميع الصلاحيات ممنوحة تلقائياً ولا يمكن تعديلها</span>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        {allRoles.filter(r => r.name !== "OWNER").map(role => {
                                            const isActive = editedRoleIds.includes(role.id);
                                            return (
                                                <button key={role.id} onClick={() => toggleRole(role.id)}
                                                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold transition-all text-right ${isActive
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                                    }`}>
                                                    <div className={`size-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${isActive ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                                                        {isActive && <span className="material-symbols-outlined !text-xs text-white">check</span>}
                                                    </div>
                                                    {role.name}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Save Button */}
                                    <button onClick={handleSaveRoles} disabled={!rolesChanged || savingRoles}
                                        className={`w-full mt-4 py-3 rounded-xl text-xs font-black transition-all ${rolesChanged
                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                        }`}>
                                        {savingRoles ? "جاري الحفظ..." : rolesChanged ? "💾 حفظ التعديلات" : "لم يتم إجراء تغييرات"}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Danger Zone */}
                        {!isOwner(selectedUser) && (
                            <div className="p-6">
                                <h4 className="text-[10px] text-red-400/60 uppercase font-black tracking-wider mb-4">منطقة الخطر</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => openActionModal("warn", selectedUser)}
                                        className="flex flex-col items-center gap-2 py-4 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 text-amber-400 transition-all">
                                        <span className="material-symbols-outlined !text-xl">warning</span>
                                        <span className="text-[10px] font-bold">تحذير</span>
                                    </button>
                                    <button onClick={() => openActionModal("remove", selectedUser)}
                                        className="flex flex-col items-center gap-2 py-4 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 text-red-400 transition-all">
                                        <span className="material-symbols-outlined !text-xl">person_remove</span>
                                        <span className="text-[10px] font-bold">فصل</span>
                                    </button>
                                    <button onClick={() => openActionModal("block", selectedUser)}
                                        className="flex flex-col items-center gap-2 py-4 rounded-xl bg-slate-800 border border-slate-700 hover:bg-red-500/10 hover:border-red-500/20 text-slate-500 hover:text-red-400 transition-all">
                                        <span className="material-symbols-outlined !text-xl">block</span>
                                        <span className="text-[10px] font-bold">حظر</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════ ACTION CONFIRMATION MODAL ═══════════ */}
            {actionModal.type && actionModal.user && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-8 shadow-2xl shadow-black/50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`size-14 rounded-2xl ${actionConfig[actionModal.type].bg} flex items-center justify-center`}>
                                <span className={`material-symbols-outlined !text-3xl ${actionConfig[actionModal.type].color}`}>{actionConfig[actionModal.type].icon}</span>
                            </div>
                            <div>
                                <h3 className="text-base font-black">{actionConfig[actionModal.type].title}</h3>
                                <p className="text-[10px] text-slate-500 mt-1">{actionConfig[actionModal.type].desc}</p>
                            </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6">
                            <div className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-1">الموظف المستهدف</div>
                            <div className="text-sm font-bold text-white">{actionModal.user.name || "بدون اسم"}</div>
                        </div>

                        {(actionModal.type === "warn" || actionModal.type === "block") && (
                            <div className="mb-6">
                                <label className="text-[10px] text-slate-500 uppercase font-black tracking-wider block mb-2">
                                    {actionModal.type === "warn" ? "سبب التحذير *" : "سبب الحظر (اختياري)"}
                                </label>
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:border-emerald-500/50 outline-none resize-none h-24"
                                    placeholder="اكتب السبب هنا..."
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={closeAction} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition-all" disabled={actionLoading}>إلغاء</button>
                            <button onClick={executeAction} disabled={actionLoading}
                                className={`flex-1 text-white font-bold py-3 rounded-xl text-xs transition-all ${actionConfig[actionModal.type].btn} ${actionLoading ? 'opacity-50' : ''}`}>
                                {actionLoading ? "جاري التنفيذ..." : actionConfig[actionModal.type].btnText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
