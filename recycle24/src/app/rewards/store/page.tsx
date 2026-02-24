"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

interface Reward {
    id: string;
    title: string;
    description: string;
    pointsCost: number;
    category: "discount" | "service" | "physical" | "badge";
    image: string;
    isAvailable: boolean;
}

export default function RewardsStorePage() {
    const [userPoints] = useState(2450);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const rewards: Reward[] = [
        {
            id: "1",
            title: "خصم 5% على عمولة الصفقات",
            description: "احصل على خصم 5% على جميع عمولات الصفقات لمدة شهر",
            pointsCost: 500,
            category: "discount",
            image: "percent",
            isAvailable: true,
        },
        {
            id: "2",
            title: "ترقية مجانية للاشتراك",
            description: "ترقية مجانية لخطة أعلى لمدة أسبوع",
            pointsCost: 1500,
            category: "service",
            image: "upgrade",
            isAvailable: true,
        },
        {
            id: "3",
            title: "شارة التاجر المميز",
            description: "شارة خاصة تظهر في ملفك الشخصي",
            pointsCost: 800,
            category: "badge",
            image: "workspace_premium",
            isAvailable: true,
        },
        {
            id: "4",
            title: "استشارة مجانية",
            description: "جلسة استشارة مجانية مع أحد الخبراء",
            pointsCost: 1000,
            category: "service",
            image: "psychology",
            isAvailable: true,
        },
        {
            id: "5",
            title: "قلم Recycle24",
            description: "قلم مميز بشعار Recycle24",
            pointsCost: 200,
            category: "physical",
            image: "edit",
            isAvailable: true,
        },
        {
            id: "6",
            title: "تيشيرت حصري",
            description: "تيشيرت حصري للمستخدمين المميزين",
            pointsCost: 2000,
            category: "physical",
            image: "checkroom",
            isAvailable: false,
        },
        {
            id: "7",
            title: "خصم 10% على النقل",
            description: "خصم 10% على جميع خدمات النقل",
            pointsCost: 750,
            category: "discount",
            image: "local_shipping",
            isAvailable: true,
        },
        {
            id: "8",
            title: "دخول VIP للمزادات",
            description: "دخول مبكر للمزادات الحصرية",
            pointsCost: 3000,
            category: "service",
            image: "gavel",
            isAvailable: false,
        },
    ];

    const categories = [
        { id: "all", label: "الكل", icon: "apps" },
        { id: "discount", label: "خصومات", icon: "percent" },
        { id: "service", label: "خدمات", icon: "star" },
        { id: "badge", label: "شارات", icon: "workspace_premium" },
        { id: "physical", label: "هدايا", icon: "redeem" },
    ];

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "discount": return "bg-green-900/30 text-green-400";
            case "service": return "bg-blue-900/30 text-blue-400";
            case "badge": return "bg-yellow-900/30 text-yellow-400";
            case "physical": return "bg-purple-900/30 text-purple-400";
            default: return "bg-slate-700 text-slate-300";
        }
    };

    const filteredRewards = selectedCategory === "all"
        ? rewards
        : rewards.filter(r => r.category === selectedCategory);

    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-arabic">
            <HeaderWithBack title="متجر المكافآت" />

            <main className="flex-1 p-4 flex flex-col gap-6">
                <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-yellow-400 text-2xl">stars</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-300">رصيد نقاطك</span>
                                <p className="text-2xl font-bold text-white">{userPoints.toLocaleString()}</p>
                            </div>
                        </div>
                        <Link href="/rewards/points" className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                            كيف أكسب النقاط؟
                        </Link>
                    </div>
                </div>

                <section>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                                    selectedCategory === cat.id
                                        ? "bg-primary text-white"
                                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                            >
                                <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-4">
                    {filteredRewards.map((reward) => (
                        <div
                            key={reward.id}
                            className={`bg-surface-dark rounded-xl overflow-hidden border border-slate-800 ${
                                !reward.isAvailable ? "opacity-50" : ""
                            }`}
                        >
                            <div className="h-24 bg-slate-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-slate-500">{reward.image}</span>
                            </div>
                            <div className="p-3">
                                <div className="flex items-center gap-1 mb-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${getCategoryColor(reward.category)}`}>
                                        {categories.find(c => c.id === reward.category)?.label}
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-white line-clamp-1">{reward.title}</h4>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{reward.description}</p>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-yellow-400 text-sm">stars</span>
                                        <span className="text-sm font-bold text-white">{reward.pointsCost.toLocaleString()}</span>
                                    </div>
                                    <button
                                        disabled={!reward.isAvailable || userPoints < reward.pointsCost}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                            !reward.isAvailable
                                                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                                                : userPoints < reward.pointsCost
                                                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                                    : "bg-primary text-white hover:bg-blue-600"
                                        }`}
                                    >
                                        استبدال
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-yellow-500">info</span>
                        <div>
                            <span className="text-sm font-medium text-white">كيف أكسب النقاط؟</span>
                            <ul className="text-xs text-slate-400 mt-2 space-y-1">
                                <li>• إتمام صفقات ناجحة: 50 نقطة</li>
                                <li>• المشاركة في المزادات: 20 نقطة</li>
                                <li>• دعوة أصدقاء: 100 نقطة</li>
                                <li>• إكمال الملف الشخصي: 30 نقطة</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
