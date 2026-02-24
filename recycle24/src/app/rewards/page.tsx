"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import Link from "next/link";

const rewards = [
    {
        id: 1,
        title: "رصيد محفظة 50K",
        cost: 5000,
        icon: "account_balance_wallet",
        color: "bg-green-500",
        description: "إضافة رصيد فوري لمحفظتك"
    },
    {
        id: 2,
        title: "اشتراك Metalix24",
        cost: 3000,
        icon: "analytics",
        color: "bg-blue-500",
        description: "اشتراك شهري في باقة التحليل المتقدم"
    },
    {
        id: 3,
        title: "ميزان إلكتروني محمول",
        cost: 12000,
        icon: "scale",
        color: "bg-orange-500",
        description: "ميزان دقيق حتى 50 كغ"
    },
    {
        id: 4,
        title: "قفازات حماية احترافية",
        cost: 1500,
        icon: "masks",
        color: "bg-slate-500",
        description: "مقاومة للقطع والحرارة"
    }
];

const leaders = [
    { name: "أبو العز للخردة", points: 15400, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoYZZovVPYDRnfQljfYmeNIOd3CLblzn7gLqTRy_7sElxkOhND5F-ptxeSKYbtDJH7WW37Tmhs7RqGeLdr1tY5l0vQPCHYeVdhH8YMNOxJSeettxF3UQFGdqHVn2dVzBjq2CVpBKSItNGjcy5I-yjMZ0DwishJ7_dhXSCp7mcMbBVtMPvR-5L5oBxgFZ8T3ujcU18WDSmpnsJOyCislXs5huz-9qWMlzonwdL_QFmyVn1ijGXULc5HGYApCENt-Jy1pXp2Wwuk_EE" },
    { name: "شركة الأمانة", points: 12350, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNVajZNufWI6xpz_m_WhscRy-4QQycKYzFwDTYkhiECwtxbWFTosYEKa5dkdwuaRLbNnEQ2leqK5lyggZcssDopnYTXmWAQA_EitvT6zIcRwYzP55Dt-14OY-y6hu4oX8XvaYrnVnJdfjJ1GzBmEslLBqMSyVHrHla4fa7sxw9w0hUJnD1MX6ofUg7pbNFiyEsbXKIVyATwYUolOvnLhYw79YbcFf6YYv5wfN_eOOwqr-DIi2PcBpZumWZ-QsZ-8GiWULbWtHamGI" },
    { name: "ماهر للمعادن", points: 9800, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYzd3TP6a_5GIYhc85geaT78dV_acYhwesxgSRQTm93oN6eoTRBRKldJQfc-hLQVK_ka-_CIMCwhMlU_IrAPt-oBmVpgZtsUofjNc0fa2dp1tGheyoC5ObDXoo8ZMfJxLc7G0LHb31RyUHjLvKUgpaSArj8Cwo4NAUo2hmzDVtlDCp2Wwz0GeXF02LPmfNu3U6vVMD1W3pL-loxcPGQu9BnpijxAz8yz4u0CdRXpOCg7k3-9ONFB5X4bk0D7NbpJjoS8u3z2bDVzs" },
];

export default function RewardsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="نقاط ريسايكل" />

            <main className="flex-1 flex flex-col gap-6 p-4">
                {/* Points Balance Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-lg">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 size-40 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 size-40 rounded-full bg-black/10 blur-2xl"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-sm font-medium text-indigo-100 mb-1">رصيدك الحالي</span>
                        <h2 className="text-4xl font-black mb-2 flex items-baseline gap-1">
                            2,450
                            <span className="text-lg font-bold">نقطة</span>
                        </h2>
                        <div className="flex gap-2 mt-2">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold border border-white/10">مستوى برونزي</span>
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-1">
                                <span className="material-symbols-outlined !text-[12px]">trending_up</span>
                                +150 هذا الأسبوع
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Earn Actions */}
                <section>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 !text-[20px]">bolt</span>
                        اكسب المزيد
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        <button className="shrink-0 flex items-center gap-3 bg-white dark:bg-surface-highlight p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 min-w-[200px] shadow-sm">
                            <div className="size-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[20px]">person_add</span>
                            </div>
                            <div className="text-start">
                                <div className="text-sm font-bold text-slate-900 dark:text-white">دعوة صديق</div>
                                <div className="text-xs text-green-600 font-bold">+500 نقطة</div>
                            </div>
                        </button>

                        <button className="shrink-0 flex items-center gap-3 bg-white dark:bg-surface-highlight p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 min-w-[200px] shadow-sm">
                            <div className="size-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[20px]">share</span>
                            </div>
                            <div className="text-start">
                                <div className="text-sm font-bold text-slate-900 dark:text-white">مشاركة التطبيق</div>
                                <div className="text-xs text-blue-600 font-bold">+100 نقطة</div>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Leaderboard Teaser */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-500 !text-[20px]">leaderboard</span>
                            المتصدرون هذا الشهر
                        </h3>
                        <Link href="/rewards/leaderboard" className="text-primary text-xs font-bold hover:underline">عرض الكل</Link>
                    </div>

                    <div className="bg-white dark:bg-surface-highlight rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                        {leaders.map((leader, i) => (
                            <div key={i} className="flex items-center gap-3 p-3">
                                <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${i === 0 ? 'bg-yellow-500 shadow-yellow-500/50 ring-2 ring-yellow-200 dark:ring-yellow-900' :
                                        i === 1 ? 'bg-slate-400' : 'bg-orange-700'
                                    }`}>
                                    {i + 1}
                                </div>
                                <img src={leader.avatar} alt={leader.name} className="size-8 rounded-full object-cover bg-slate-200" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{leader.name}</h4>
                                </div>
                                <span className="text-xs font-bold text-indigo-500">{leader.points.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Rewards Store */}
                <section>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">متجر المكافآت</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {rewards.map((reward) => (
                            <div key={reward.id} className="bg-white dark:bg-surface-highlight rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-3 shadow-sm hover:shadow-md transition cursor-pointer group">
                                <div className={`w-full aspect-video rounded-lg ${reward.color}/10 flex items-center justify-center text-3xl mb-1`}>
                                    <span className={`material-symbols-outlined ${reward.color.replace('bg-', 'text-')}`}>{reward.icon}</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1">{reward.title}</h4>
                                    <p className="text-[10px] text-slate-500 line-clamp-2 mb-2">{reward.description}</p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-xs font-bold text-indigo-600">{reward.cost} نقطة</span>
                                        <button className="size-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                            <span className="material-symbols-outlined !text-[16px]">add</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
