"use client";

import { useEffect, useState } from "react";

import HeaderWithBack from "@/components/HeaderWithBack";

interface ManagedUser {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  userType: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  subscription?: {
    plan: string;
    status: string;
  } | null;
  walletSummary?: {
    verifiedBalanceSYP: number;
    availableBalanceSYP: number;
    heldAmountSYP: number;
    verifiedBalanceUSD: number;
    availableBalanceUSD: number;
    heldAmountUSD: number;
    isLocked: boolean;
  } | null;
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toLocaleString() : "0";
}

export default function UserGovernancePage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    void fetchUsers();
  }, [filter]);

  async function fetchUsers() {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users?type=${filter}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(
    id: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      if (res.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-dark font-display">
      <HeaderWithBack title="حوكمة المستخدمين والأدوار" />

      <main className="flex-1 w-full p-4 pb-20 lg:mx-auto lg:max-w-7xl">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h1 className="mb-1 text-xl font-bold text-white">
              الرقابة على الهويات والاشتراكات
            </h1>
            <p className="text-xs text-slate-500">
              إدارة حسابات العملاء، التجار، السائقين، والجهات الحكومية.
            </p>
          </div>

          <select
            title="نوع الحساب"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-surface-highlight px-4 py-2 text-xs font-bold text-white outline-none"
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
            <div className="col-span-full py-20 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-t-2 border-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-800 bg-surface-highlight p-8 text-center text-slate-400">
              لا توجد نتائج
            </div>
          ) : (
            users.map((user) => {
              const wallet = user.walletSummary;
              const availableSYP = wallet?.availableBalanceSYP ?? 0;
              const verifiedSYP = wallet?.verifiedBalanceSYP ?? 0;
              const heldSYP = wallet?.heldAmountSYP ?? 0;
              const availableUSD = wallet?.availableBalanceUSD ?? 0;
              const verifiedUSD = wallet?.verifiedBalanceUSD ?? 0;
              const heldUSD = wallet?.heldAmountUSD ?? 0;

              return (
                <div
                  key={user.id}
                  className="group flex flex-col items-center justify-between gap-6 rounded-[2rem] border border-slate-800 bg-surface-highlight p-6 shadow-lg transition hover:border-slate-700 md:flex-row"
                >
                  <div className="flex w-full items-center gap-4 md:w-auto">
                    <div className="relative flex size-16 items-center justify-center rounded-2xl bg-slate-800">
                      <span className="material-symbols-outlined !text-3xl text-slate-500">
                        account_circle
                      </span>

                      {user.isVerified && (
                        <div className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border-2 border-bg-dark bg-primary text-white shadow-lg">
                          <span className="material-symbols-outlined !text-[14px]">
                            check
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <h3 className="text-base font-bold text-white">
                        {user.name || "بدون اسم"}
                      </h3>

                      <p className="font-english text-xs text-slate-500">
                        {user.phone || user.email || user.id}
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[9px] font-black ${
                            user.userType === "GOVERNMENT"
                              ? "bg-amber-500/10 text-amber-500"
                              : user.userType === "TRADER"
                              ? "bg-primary/10 text-primary"
                              : user.userType === "DRIVER"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {user.userType}
                        </span>

                        <span className="font-english text-[9px] text-slate-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>

                        {wallet?.isLocked && (
                          <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[9px] font-black text-red-400">
                            LOCKED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid w-full grid-cols-1 gap-4 md:w-auto md:min-w-[420px] md:grid-cols-3">
                    <div className="text-center md:text-right">
                      <p className="mb-1 text-[10px] text-slate-500">
                        الاشتراك
                      </p>
                      <p
                        className={`text-xs font-bold ${
                          user.subscription?.plan === "FREE"
                            ? "text-slate-400"
                            : "text-primary"
                        }`}
                      >
                        {user.subscription?.plan || "N/A"}
                      </p>
                    </div>

                    <div className="text-center md:text-right">
                      <p className="mb-1 text-[10px] text-slate-500">
                        المحفظة SYP
                      </p>
                      <p className="text-xs font-bold text-emerald-500 font-english">
                        متاح: {formatNumber(availableSYP)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-english">
                        دفتر: {formatNumber(verifiedSYP)}
                      </p>
                      <p className="text-[10px] text-amber-400 font-english">
                        محجوز: {formatNumber(heldSYP)}
                      </p>
                    </div>

                    <div className="text-center md:text-right">
                      <p className="mb-1 text-[10px] text-slate-500">
                        المحفظة USD
                      </p>
                      <p className="text-xs font-bold text-cyan-400 font-english">
                        متاح: {formatNumber(availableUSD)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-english">
                        دفتر: {formatNumber(verifiedUSD)}
                      </p>
                      <p className="text-[10px] text-amber-400 font-english">
                        محجوز: {formatNumber(heldUSD)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex w-full items-center gap-3 border-t border-slate-800 pt-4 md:mt-0 md:w-auto md:border-t-0 md:pt-0">
                    {user.status === "BANNED" ? (
                      <button
                        onClick={() =>
                          void handleUpdate(user.id, { status: "ACTIVE" })
                        }
                        className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-2 text-xs font-bold text-emerald-500 transition hover:bg-emerald-500 hover:text-white md:flex-none"
                      >
                        إلغاء الحظر
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          void handleUpdate(user.id, { status: "BANNED" })
                        }
                        className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500 hover:text-white md:flex-none"
                      >
                        حظر الحساب
                      </button>
                    )}

                    {!user.isVerified && (
                      <button
                        onClick={() =>
                          void handleUpdate(user.id, {
                            isVerified: true,
                            status: "ACTIVE",
                          })
                        }
                        className="flex-1 rounded-xl border border-primary/30 bg-primary/10 px-6 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white md:flex-none"
                      >
                        توثيق الآن
                      </button>
                    )}

                    <button
                      title="عرض التفاصيل"
                      className="p-2 text-slate-600 transition hover:text-white"
                    >
                      <span className="material-symbols-outlined !text-xl">
                        visibility
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}