"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

    const [roleForm, setRoleForm] = useState({ name: "", description: "" });
    const [rolePermissionsDraft, setRolePermissionsDraft] = useState<Record<string, string[]>>({});

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

    const updateUserRoles = async (user: UserSearch, roleIds: string[]) => {
        try {
            const response = await fetch(`/api/admin/access/users/${user.id}/roles`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roleIds }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "تعذر تحديث الأدوار");
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
            <header className="sticky top-0 z-40 backdrop-blur-md bg-bg-dark/80 border-b border-slate-800">
                <div className="px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold">لوحة توزيع الأدوار والصلاحيات</h1>
                        <p className="text-xs text-slate-400">إدارة دقيقة ومقيّدة لصلاحيات الموظفين</p>
                    </div>
                    <Link href="/dashboard" className="text-xs text-emerald-400 font-bold">
                        العودة للوحة التحكم
                    </Link>
                </div>
            </header>

            <main className="p-4 pb-20 flex flex-col gap-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                    <h2 className="text-sm font-bold mb-4">إنشاء دور جديد</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
                            placeholder="اسم الدور"
                            value={roleForm.name}
                            onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                        <input
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
                            placeholder="وصف مختصر"
                            value={roleForm.description}
                            onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                        />
                        <button
                            onClick={createRole}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg"
                        >
                            إنشاء الدور
                        </button>
                    </div>
                </section>

                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold">الأدوار الحالية</h2>
                        <span className="text-xs text-slate-500">{roles.length} دور</span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {roles.map((role) => {
                            const currentPermissions = rolePermissionsDraft[role.id]
                                || role.rolePermissions.map((rp) => rp.permission.id);
                            return (
                                <div key={role.id} className="border border-slate-800 rounded-xl p-4 bg-slate-900/70">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-white">{role.name}</h3>
                                            <p className="text-xs text-slate-400">{role.description || "بدون وصف"}</p>
                                            <p className="text-[11px] text-slate-500">عدد المستخدمين: {role.userRoles.length}</p>
                                        </div>
                                        {role.isSystem && (
                                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded-full">
                                                دور نظامي
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {permissions.map((perm) => (
                                            <label key={perm.id} className="flex items-start gap-2 text-xs text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    checked={currentPermissions.includes(perm.id)}
                                                    onChange={() => handleRolePermissionToggle(role.id, perm.id)}
                                                    className="mt-1"
                                                />
                                                <span>
                                                    <span className="font-bold block">{perm.label}</span>
                                                    <span className="text-[10px] text-slate-500">{perm.description}</span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => saveRolePermissions(role)}
                                        className="mt-3 bg-emerald-500/20 text-emerald-300 px-3 py-2 rounded-lg text-xs"
                                    >
                                        حفظ الصلاحيات
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                    <h2 className="text-sm font-bold mb-4">دعوة موظف جديد</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
                            placeholder="البريد الإلكتروني"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                        <input
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
                            placeholder="رقم الهاتف"
                            value={inviteForm.phone}
                            onChange={(e) => setInviteForm((prev) => ({ ...prev, phone: e.target.value }))}
                        />
                        <select
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
                            value={inviteForm.roleId}
                            onChange={(e) => setInviteForm((prev) => ({ ...prev, roleId: e.target.value }))}
                        >
                            <option value="">اختر الدور</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
                            value={inviteForm.expiresAt}
                            onChange={(e) => setInviteForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                        />
                    </div>
                    <button
                        onClick={createInvite}
                        className="mt-3 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
                    >
                        إنشاء الدعوة
                    </button>
                    <div className="mt-4 space-y-2">
                        {invites.map((invite) => (
                            <div key={invite.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs">
                                <div>
                                    <span className="text-slate-400">الدور:</span> {invite.role.name}
                                    <span className="text-slate-500"> | {invite.email || invite.phone}</span>
                                    <div className="text-[10px] text-slate-500">رمز الدعوة: {invite.code}</div>
                                    <div className="text-[10px] text-emerald-300">/invite/{invite.code}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-slate-800 px-2 py-1 rounded-full">{invite.status}</span>
                                    {invite.status === "PENDING" && (
                                        <button
                                            onClick={() => revokeInvite(invite.id)}
                                            className="text-[10px] text-red-300 bg-red-500/10 px-2 py-1 rounded-full"
                                        >
                                            إلغاء
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                    <h2 className="text-sm font-bold mb-4">تعيين أدوار لمستخدم</h2>
                    <div className="flex flex-col md:flex-row gap-3 mb-4">
                        <input
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm"
                            placeholder="ابحث بالبريد أو الهاتف أو الاسم"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                            onClick={searchUsers}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
                        >
                            بحث
                        </button>
                    </div>
                    <div className="space-y-3">
                        {users.map((user) => {
                            const currentRoles = user.userRoles.map((role) => role.role.id);
                            return (
                                <div key={user.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <div>
                                            <div className="text-sm font-bold">{user.name || "مستخدم"}</div>
                                            <div className="text-[11px] text-slate-400">{user.email || user.phone}</div>
                                            <div className="text-[10px] text-slate-500">الحالة: {user.status || "غير محدد"}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                                        {roles.map((role) => (
                                            <label key={role.id} className="flex items-center gap-2 text-xs text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    checked={currentRoles.includes(role.id)}
                                                    onChange={(e) => {
                                                        const next = e.target.checked
                                                            ? [...currentRoles, role.id]
                                                            : currentRoles.filter((id) => id !== role.id);
                                                        updateUserRoles(user, next);
                                                    }}
                                                />
                                                {role.name}
                                            </label>
                                        ))}
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
