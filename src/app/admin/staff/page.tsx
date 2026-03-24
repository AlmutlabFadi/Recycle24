"use client";

import { useEffect, useState } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

type User = {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    userType: string;
    role: string;
    currentAdminStatus: string;
    lastActiveAt: string | null;
    userRoles: Array<{ role: { id: string, name: string } }>;
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
    const [roles, setRoles] = useState<Array<{ id: string, name: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [inviteForm, setInviteForm] = useState({ email: "", phone: "", roleId: "", expiresAt: "" });

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
                setRoles(roleData.roles || []);
            }
        } catch (error) {
            console.error("Fetch staff error:", error);
            addToast("تعذر تحميل البيانات", "error");
        } finally {
            setLoading(false);
        }
    };

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
        } catch (error) {
            addToast("حدث خطأ ما", "error");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleWarn = async (userId: string) => {
        const reason = prompt("سبب التحذير:");
        if (!reason) return;
        try {
            const res = await fetch("/api/admin/staff/warn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, reason, severity: "MEDIUM" }),
            });
            if (res.ok) {
                addToast("تم تسجيل التحذير بنجاح", "success");
            }
        } catch (error) {
            addToast("حدث خطأ أثناء إرسال التحذير", "error");
        }
    };

    const handleRemoveStaff = async (userId: string) => {
        if (!confirm("هل أنت متأكد من إزالة هذا الموظف؟")) return;
        try {
            const res = await fetch(`/api/admin/access/users/${userId}/remove`, { method: "DELETE" });
            if (res.ok) {
                addToast("تمت إزالة الموظف بنجاح", "success");
                fetchData();
            } else {
                addToast("تعذر إزالة الموظف", "error");
            }
        } catch (error) {
            addToast("حدث خطأ أثناء الإزالة", "error");
        }
    };

    const handleRevokeInvite = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/access/invites/${id}/revoke`, { method: "PATCH" });
            if (res.ok) {
                addToast("تم إلغاء الدعوة", "success");
                fetchData();
            }
        } catch (error) {
            addToast("تعذر إلغاء الدعوة", "error");
        }
    };

    const filteredStaff = staff.filter(u => 
        u.name?.includes(searchTerm) || 
        u.email?.includes(searchTerm) || 
        u.phone?.includes(searchTerm)
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ONLINE": return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
            case "IDLE": return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
            default: return "bg-slate-600";
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-bg-dark flex items-center justify-center text-white">جاري التحميل...</div>;
    }

    return (
        <div className="min-h-screen bg-bg-dark text-white font-display">
            <HeaderWithBack title="إدارة فريق العمل والمنظومة" />

            <main className="p-4 max-w-7xl mx-auto space-y-8 pb-20">
                {/* Search & Actions */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                        <input 
                            type="text"
                            placeholder="بحث عن موظف..."
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-emerald-500 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Staff Table */}
                <section className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-400">badge</span>
                            الموظفين النشطين
                        </h2>
                        <span className="text-[10px] text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">{filteredStaff.length} موظف</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800/50">
                                    <th className="px-6 py-4 font-black">الموظف</th>
                                    <th className="px-6 py-4 font-black text-center">الحالة</th>
                                    <th className="px-6 py-4 font-black">الدور الرئيسي</th>
                                    <th className="px-6 py-4 font-black text-left">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {filteredStaff.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:border-emerald-500/50 transition-colors">
                                                    <span className="material-symbols-outlined">person</span>
                                                </div>
                                                <div>
                                                    <div className="text-[13px] font-bold text-white leading-tight">{user.name || "بدون اسم"}</div>
                                                    <div className="text-[10px] text-slate-500">{user.email || user.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`size-2 rounded-full ${getStatusColor(user.currentAdminStatus)}`}></div>
                                                    <span className="text-[10px] font-bold text-slate-300">
                                                        {user.currentAdminStatus === "ONLINE" ? "متصل" : user.currentAdminStatus === "IDLE" ? "خامل" : "غير متصل"}
                                                    </span>
                                                </div>
                                                {user.lastActiveAt && (
                                                    <span className="text-[9px] text-slate-500">منذ {new Date(user.lastActiveAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {user.userRoles.map(ur => (
                                                    <span key={ur.role.id} className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 lowercase">
                                                        {ur.role.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    title="تعديل الصلاحيات"
                                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <span className="material-symbols-outlined !text-sm">edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleWarn(user.id)}
                                                    title="إرسال تحذير"
                                                    className="p-2 hover:bg-amber-500/10 rounded-lg text-slate-500 hover:text-amber-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined !text-sm">warning</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleRemoveStaff(user.id)}
                                                    title="فصل من فريق العمل"
                                                    className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined !text-sm">person_remove</span>
                                                </button>
                                                <button 
                                                    title="حظر الحساب نهائياً"
                                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-600 hover:text-red-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined !text-sm">block</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Invitations Section - Better UI */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Create Invite Form */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-400 !text-sm">person_add</span>
                                دعوة موظف جديد
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <input
                                        type="email"
                                        placeholder="البريد الإلكتروني (اختياري)"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-500/50 outline-none"
                                        value={inviteForm.email}
                                        onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                    <input
                                        type="text"
                                        placeholder="رقم الهاتف (اختياري)"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-500/50 outline-none"
                                        value={inviteForm.phone}
                                        onChange={(e) => setInviteForm(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-500/50 outline-none text-slate-400"
                                        value={inviteForm.roleId}
                                        onChange={(e) => setInviteForm(prev => ({ ...prev, roleId: e.target.value }))}
                                    >
                                        <option value="">اختر الدور الوظيفي</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={handleCreateInvite}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/10"
                                    >
                                        توليد وإرسال الدعوة
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-950/40 border border-slate-800 rounded-3xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-300">
                                    <span className="material-symbols-outlined text-amber-500">mail</span>
                                    دعوات لم تنتهِ
                                </h3>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {invites.length === 0 ? (
                                    <div className="p-10 text-center text-slate-500 text-xs">لا يوجد دعوات معلقة حالياً</div>
                                ) : (
                                    <div className="divide-y divide-slate-800/50">
                                        {invites.map((invite) => (
                                            <div key={invite.id} className="p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-2 rounded-full ${invite.status === 'PENDING' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                                                    <div>
                                                        <div className="text-[11px] font-bold">{invite.role.name}</div>
                                                        <div className="text-[10px] text-slate-500">{invite.email || invite.phone}</div>
                                                        <div className="text-[9px] text-slate-600 mt-0.5 font-mono">{invite.code}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[9px] px-2 py-0.5 rounded flex items-center gap-1 ${
                                                        invite.status === 'PENDING' ? 'text-amber-400 border border-amber-400/20' : 
                                                        invite.status === 'USED' ? 'text-emerald-400 border border-emerald-400/20' :
                                                        'text-red-400 border border-red-400/20'
                                                    }`}>
                                                        {invite.status === 'PENDING' ? 'قيد الانتظار' : invite.status === 'USED' ? 'تم الاستخدام' : 'ملغية'}
                                                    </span>
                                                    {invite.status === 'PENDING' && (
                                                        <button 
                                                            onClick={() => handleRevokeInvite(invite.id)}
                                                            className="text-[10px] text-slate-400 hover:text-red-400 transition-colors"
                                                        >
                                                            إلغاء
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats/Summary */}
                    <div className="space-y-6">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6">
                            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-tighter mb-4">نشاط فريق العمل</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-slate-400">النشطين الآن</span>
                                    <span className="text-sm font-bold text-emerald-400">{staff.filter(s => s.currentAdminStatus === 'ONLINE').length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-slate-400">إجمالي الفريق</span>
                                    <span className="text-sm font-bold text-white">{staff.length}</span>
                                </div>
                            </div>
                        </div>

                        <Link 
                            href="/admin/staff/leaderboard"
                            className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 hover:bg-emerald-500/20 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <span className="material-symbols-outlined">leaderboard</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold">قائمة المتصدرين</h4>
                                    <p className="text-[10px] text-slate-500">الأكثر كفاءة ونشاطاً</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-600 group-hover:text-emerald-400 translate-x-2 group-hover:translate-x-0 transition-all">arrow_back</span>
                        </Link>

                        <Link 
                            href="/admin/staff/activity"
                            className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-600 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined">history</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold">سجلات النشاط</h4>
                                    <p className="text-[10px] text-slate-500">مراجعة العمليات اليومية</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-600 group-hover:text-emerald-400 translate-x-2 group-hover:translate-x-0 transition-all">arrow_back</span>
                        </Link>

                        <Link 
                            href="/admin/access"
                            className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-600 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined">settings</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold">إدارة الصلاحيات</h4>
                                    <p className="text-[10px] text-slate-500">تعديل الأدوار والقوانين</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-600 group-hover:text-emerald-400 translate-x-2 group-hover:translate-x-0 transition-all">arrow_back</span>
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
