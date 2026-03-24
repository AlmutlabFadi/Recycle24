"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

type Permission = {
    id: string;
    key: string;
    label: string;
    description?: string | null;
};

type Role = {
    id: string;
    name: string;
    description?: string | null;
    isSystem: boolean;
    rolePermissions: Array<{ permission: Permission }>;
    userRoles: Array<{ userId: string }>;
};

type Invite = {
    id: string;
    code: string;
    email?: string | null;
    phone?: string | null;
    status: string;
    expiresAt?: string | null;
    createdAt: string;
    role: { id: string; name: string };
};

type UserSearch = {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    status?: string | null;
    userRoles: Array<{ role: { id: string; name: string } }>;
};

export default function AccessControlPage() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [users, setUsers] = useState<UserSearch[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);

    const [roleForm, setRoleForm] = useState({ name: "", description: "", specialization: "" });
    const [rolePermissionsDraft, setRolePermissionsDraft] = useState<Record<string, string[]>>({});
    const [userRolesDraft, setUserRolesDraft] = useState<Record<string, string[]>>({});

    const [inviteForm, setInviteForm] = useState({ email: "", phone: "", roleId: "", expiresAt: "" });

    const loadBaseData = async () => {
        try {
            setLoading(true);
            const [permRes, roleRes, inviteRes] = await Promise.all([
                fetch("/api/admin/access/permissions"),
                fetch("/api/admin/access/roles"),
                fetch("/api/admin/access/invites"),
            ]);

            if ([permRes.status, roleRes.status, inviteRes.status].some((status) => status === 401 || status === 403)) {
                setIsForbidden(true);
                return;
            }

            const permData = await permRes.json();
            const roleData = await roleRes.json();
            const inviteData = await inviteRes.json();

            if (!permRes.ok || !roleRes.ok || !inviteRes.ok) {
                throw new Error("تعذر تحميل بيانات الصلاحيات");
            }

            setPermissions(permData.permissions || []);
            setRoles(roleData.roles || []);
            setInvites(inviteData.invites || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBaseData();
    }, []);

    const handleRolePermissionToggle = (roleId: string, permissionId: string) => {
        setRolePermissionsDraft((prev) => {
            const current = prev[roleId] || roles
                .find((role) => role.id === roleId)
                ?.rolePermissions.map((rp) => rp.permission.id) || [];
            const next = current.includes(permissionId)
                ? current.filter((id) => id !== permissionId)
                : [...current, permissionId];
            return { ...prev, [roleId]: next };
        });
    };

    const saveRolePermissions = async (role: Role) => {
        try {
            const permissionIds = rolePermissionsDraft[role.id] ?? role.rolePermissions.map((rp) => rp.permission.id);
            const response = await fetch(`/api/admin/access/roles/${role.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ permissionIds, description: role.description }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "تعذر تحديث الدور");
            }
            await loadBaseData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    const createRole = async () => {
        try {
            const response = await fetch("/api/admin/access/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: roleForm.name,
                    description: roleForm.description,
                    permissionIds: [],
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "تعذر إنشاء الدور");
            }
            setRoleForm({ name: "", description: "" });
            await loadBaseData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    const createInvite = async () => {
        try {
            const response = await fetch("/api/admin/access/invites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(inviteForm),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "تعذر إنشاء الدعوة");
            }
            setInviteForm({ email: "", phone: "", roleId: "", expiresAt: "" });
            await loadBaseData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    const revokeInvite = async (inviteId: string) => {
        try {
            const response = await fetch(`/api/admin/access/invites/${inviteId}/revoke`, { method: "PATCH" });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "تعذر إلغاء الدعوة");
            }
            await loadBaseData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    const searchUsers = async () => {
        try {
            const response = await fetch(`/api/admin/access/users/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "تعذر البحث");
            }
            setUsers(data.users || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    const handleUserRoleToggle = (userId: string, roleId: string, currentRoles: string[]) => {
        setUserRolesDraft(prev => {
            const draft = prev[userId] || currentRoles;
            const next = draft.includes(roleId)
                ? draft.filter(id => id !== roleId)
                : [...draft, roleId];
            return { ...prev, [userId]: next };
        });
    };

    const saveUserRoles = async (userId: string) => {
        const rolesToSave = userRolesDraft[userId];
        if (!rolesToSave) return;

        try {
            const response = await fetch(`/api/admin/access/users/${userId}/roles`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roleIds: rolesToSave }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "تعذر تحديث الأدوار");
            }
            // Clear draft and refresh
            setUserRolesDraft(prev => {
                const { [userId]: _, ...rest } = prev;
                return rest;
            });
            await searchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    const removeTeamMember = async (userId: string) => {
        if (!confirm("هل أنت متأكد من إزالة هذا العضو من فريق العمل؟ سيتم تجريده من كافة الصلاحيات فوراً.")) return;

        try {
            const response = await fetch(`/api/admin/access/users/${userId}/remove`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "تعذر إزالة العضو");
            }
            await searchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-dark text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-400"></div>
            </div>
        );
    }

    if (isForbidden) {
        return (
            <div className="min-h-screen bg-bg-dark text-white flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined !text-6xl text-slate-600 mb-4">lock</span>
                <h1 className="text-xl font-bold mb-2">وصول مقيد</h1>
                <p className="text-slate-400 mb-6">هذه اللوحة مخصصة للمدير الرئيسي لإدارة الصلاحيات.</p>
                <Link href="/dashboard" className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold">
                    العودة للوحة التحكم
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-dark text-white font-display">
            <HeaderWithBack title="لوحة توزيع الأدوار والصلاحيات" />

            <main className="p-4 pb-20 flex flex-col gap-8 max-w-6xl mx-auto">
                {/* Bridge to Staff Dashboard */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl">
                    <div>
                        <h2 className="text-lg font-bold text-emerald-400">إدارة فريق العمل</h2>
                        <p className="text-xs text-slate-400 mt-1">لقد قمنا بنقل قائمة الموظفين والدعوات إلى لوحة مستقلة لتسهيل العمل.</p>
                    </div>
                    <Link 
                        href="/admin/staff"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                        المتابعة إلى إدارة الموظفين
                        <span className="material-symbols-outlined !text-sm">arrow_left</span>
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400 !text-sm">add_circle</span>
                        إنشاء دور جديد في المنظومة
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input
                            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 transition-all outline-none"
                            placeholder="اسم الدور (مثلاً: مدير مالي)"
                            value={roleForm.name}
                            onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                        <input
                            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 transition-all outline-none"
                            placeholder="وصف مختصر للمهام"
                            value={roleForm.description}
                            onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                        />
                         <input
                            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 transition-all outline-none"
                            placeholder="التخصص (مثلاً: إدارة الميزانية)"
                            value={roleForm.specialization || ""}
                            onChange={(e) => setRoleForm((prev) => ({ ...prev, specialization: e.target.value }))}
                        />
                        <button
                            onClick={createRole}
                            className="bg-slate-800 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all active:scale-95"
                        >
                            إنشاء الدور
                        </button>
                    </div>
                    <div className="mt-3 text-[9px] text-slate-600 uppercase tracking-tighter">
                        * سيظهر التخصص بجانب مسمى المسمى الوظيفي للموظف لمزيد من التفصيل
                    </div>
                </section>

                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold">الأدوار الحالية</h2>
                        <span className="text-xs text-slate-500">{roles.length} دور</span>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        {roles.map((role) => {
                            const currentPermissions = rolePermissionsDraft[role.id]
                                || role.rolePermissions.map((rp) => rp.permission.id);
                            
                            const groups = [
                                { label: "النظام البنكي والمالي", keys: ["MANAGE_FINANCE", "FINANCE_FINAL_APPROVE"] },
                                { label: "إدارة المستخدمين والوصول", keys: ["MANAGE_USERS", "MANAGE_ACCESS"] },
                                { label: "إدارة النقل والسائقين", keys: ["MANAGE_DRIVERS", "REVIEW_DRIVER_DOCS"] },
                                { label: "إدارة المحتوى والوسائط", keys: ["MANAGE_KNOWLEDGE", "UPLOAD_MEDIA"] },
                                { label: "الوصول للمراكز المتخصصة", keys: ["ACCESS_SAFETY", "ACCESS_CONSULTATIONS", "ACCESS_ACADEMY"] },
                                { label: "الدعم والمكافآت", keys: ["MANAGE_SUPPORT", "MANAGE_REWARDS"] },
                            ];

                            const handleToggleGroup = (groupKeys: string[]) => {
                                const groupPermIds = permissions
                                    .filter(p => groupKeys.includes(p.key))
                                    .map(p => p.id);
                                
                                const allSelected = groupPermIds.every(id => currentPermissions.includes(id));
                                
                                setRolePermissionsDraft(prev => {
                                    const next = allSelected
                                        ? currentPermissions.filter(id => !groupPermIds.includes(id))
                                        : Array.from(new Set([...currentPermissions, ...groupPermIds]));
                                    return { ...prev, [role.id]: next };
                                });
                            };

                            return (
                                <div key={role.id} className="border border-slate-800 rounded-2xl p-6 bg-slate-900/70 shadow-xl overflow-hidden relative group">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-white text-lg">{role.name}</h3>
                                                {role.isSystem && (
                                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                        دور نظامي
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mb-2">{role.description || "لا يوجد وصف محدد لهذا الدور"}</p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                                    <span className="material-symbols-outlined !text-xs">group</span>
                                                    {role.userRoles.length} مستخدم
                                                </span>
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                                    <span className="material-symbols-outlined !text-xs">key</span>
                                                    {currentPermissions.length} صلاحية مفعلة
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => saveRolePermissions(role)}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
                                        >
                                            حفظ الصلاحيات
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {groups.map((group) => {
                                            const groupPermissions = permissions.filter(p => group.keys.includes(p.key));
                                            if (groupPermissions.length === 0) return null;
                                            const allSelected = groupPermissions.every(p => currentPermissions.includes(p.id));

                                            return (
                                                <div key={group.label} className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4 transition-colors hover:border-slate-700/60">
                                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{group.label}</span>
                                                        <button 
                                                            onClick={() => handleToggleGroup(group.keys)}
                                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition ${allSelected ? 'text-amber-500' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                                                        >
                                                            {allSelected ? "إلغاء الكل" : "تحديد القسم"}
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        {groupPermissions.map((perm) => (
                                                            <label key={perm.id} className="flex items-start gap-2.5 cursor-pointer group/label">
                                                                <div className="relative flex items-center mt-0.5">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={currentPermissions.includes(perm.id)}
                                                                        onChange={() => handleRolePermissionToggle(role.id, perm.id)}
                                                                        className="peer size-4 opacity-0 absolute inset-0 z-10 cursor-pointer"
                                                                    />
                                                                    <div className={`size-4 rounded border transition-all duration-200 
                                                                        ${currentPermissions.includes(perm.id) 
                                                                            ? "bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                                                                            : "bg-slate-800 border-slate-700 group-hover/label:border-slate-500"}
                                                                    `}>
                                                                        {currentPermissions.includes(perm.id) && (
                                                                            <span className="material-symbols-outlined !text-[14px] text-white flex items-center justify-center h-full">check</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <span className={`text-[11px] font-bold block transition ${currentPermissions.includes(perm.id) ? "text-white" : "text-slate-400 group-hover/label:text-slate-300"}`}>
                                                                        {perm.label}
                                                                    </span>
                                                                    <span className="text-[9px] text-slate-500 leading-tight block mt-0.5">
                                                                        </span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
}

