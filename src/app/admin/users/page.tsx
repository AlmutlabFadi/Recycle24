"use client";

import { useState, useEffect } from "react";
import HeaderWithBack from "@/components/HeaderWithBack";

interface ManagedUser {
    id: string;
    name: string;
    phone: string;
    email: string;
    userType: string;
    status: string;
    isVerified: boolean;
    createdAt: string;
    subscription?: { plan: string; status: string };
    wallet?: { balanceSYP: number };
}

export default function UserGovernancePage() {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        fetchUsers();
    }, [filter]);

    async function fetchUsers() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users?type=${filter}`);
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdate(id: string, updates: any) {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...updates }),
            });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error("Error updating user:", error);
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="حوكمة المستخدمين والأدوار" />

            <main className="flex-1 p-4 lg:max-w-7xl lg:mx-auto w-full pb-20">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white mb-1">الرقابة على الهويات والاشتراكات</h1>
                        <p className="text-xs text-slate-500">إدارة حسابات العملاء، التجار، والسائقين والجهات الحكومية.</p>
                    </div>

                    <select 
                        title="نوع الحساب"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-surface-highlight border border-slate-800 text-white rounded-xl px-4 py-2 text-xs font-bold outline-none"
                    >
                        <option value="ALL">جميع الأدوار</option>
                        <option value="CLIENT">العملاء</option>
                        <option value="TRADER">التجار</option>
                        <option value="DRIVER">السائقين</option>
                        <option value="GOVERNMENT">الجهات الحكومية</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="py-20 text-center col-span-full"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mx-auto"></div></div>
                    ) : users.map((user) => (
                        <div key={user.id} className="bg-surface-highlight border border-slate-800 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-slate-700 transition group shadow-lg">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="size-16 rounded-2xl bg-slate-800 flex items-center justify-center relative">
                                    <span className="material-symbols-outlined text-slate-500 !text-3xl">account_circle</span>
                                    {user.isVerified && (
                                        <div className="absolute -top-1 -right-1 size-6 bg-primary text-white rounded-full flex items-center justify-center border-2 border-bg-dark shadow-lg">
                                            <span className="material-symbols-outlined !text-[14px]">check</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <h3 className="text-base font-bold text-white">{user.name}</h3>
                                    <p className="text-xs text-slate-500 font-english">{user.phone}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                            user.userType === 'GOVERNMENT' ? 'bg-amber-500/10 text-amber-500' :
                                            user.userType === 'TRADER' ? 'bg-primary/10 text-primary' :
                                            user.userType === 'DRIVER' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {user.userType}
                                        </span>
                                        <span className="text-[9px] text-slate-600 font-english">{new Date(user.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:flex items-center gap-8 w-full md:w-auto">
                                <div className="text-center md:text-right">
                                    <p className="text-[10px] text-slate-500 mb-1">الاشتراك</p>
                                    <p className={`text-xs font-bold ${user.subscription?.plan === 'FREE' ? 'text-slate-400' : 'text-primary'}`}>{user.subscription?.plan || 'N/A'}</p>
                                </div>
                                <div className="text-center md:text-right">
                                    <p className="text-[10px] text-slate-500 mb-1">المحفظة</p>
                                    <p className="text-xs font-bold text-emerald-500 font-english">{user.wallet?.balanceSYP.toLocaleString() || '0'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-800 md:border-t-0">
                                {user.status === "BANNED" ? (
                                    <button 
                                        onClick={() => handleUpdate(user.id, { status: "ACTIVE" })}
                                        className="flex-1 md:flex-none text-xs font-bold text-emerald-500 bg-emerald-500/10 px-6 py-2 rounded-xl border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition"
                                    >
                                        إلغاء الحظر
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleUpdate(user.id, { status: "BANNED" })}
                                        className="flex-1 md:flex-none text-xs font-bold text-red-500 bg-red-500/10 px-6 py-2 rounded-xl border border-red-500/30 hover:bg-red-500 hover:text-white transition"
                                    >
                                        حظر الحساب
                                    </button>
                                )}
                                {!user.isVerified && (
                                    <button 
                                        onClick={() => handleUpdate(user.id, { isVerified: true, status: "ACTIVE" })}
                                        className="flex-1 md:flex-none text-xs font-bold text-primary bg-primary/10 px-6 py-2 rounded-xl border border-primary/30 hover:bg-primary hover:text-white transition"
                                    >
                                        توثيق الآن
                                    </button>
                                )}
                                <button title="عرض التفاصيل" className="p-2 text-slate-600 hover:text-white transition">
                                    <span className="material-symbols-outlined !text-xl">visibility</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
