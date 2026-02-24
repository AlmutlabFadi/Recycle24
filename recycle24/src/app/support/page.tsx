"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

const supportCategories = [
    { id: "account", name: "الحساب والتوثيق", icon: "person" },
    { id: "selling", name: "البيع والشراء", icon: "shopping_cart" },
    { id: "auctions", name: "المزادات", icon: "gavel" },
    { id: "payment", name: "المدفوعات", icon: "payments" },
    { id: "technical", name: "مشاكل تقنية", icon: "build" },
    { id: "safety", name: "السلامة", icon: "health_and_safety" },
];

const faqs = [
    {
        question: "كيف أبيع خردة عبر المنصة؟",
        answer: "اختر 'بيع' من القائمة السفلية، ثم اتبع الخطوات: اختر المادة، حدد الوزن، اختر المحافظة، وقارن بين المشترين."
    },
    {
        question: "ما هي طرق الدفع المتاحة؟",
        answer: "نحن ندعم الدفع عبر المحفظة الإلكترونية، التحويل البنكي، أو الدفع النقدي عند الاستلام."
    },
    {
        question: "كيف أحصل على شارة التاجر الموثق؟",
        answer: "قم بتوثيق حسابك عبر إرسال صور الهوية الشخصية والسجل التجاري من خلال قسم 'التحقق'."
    },
    {
        question: "ما هي رسوم المنصة؟",
        answer: "المنصة تأخذ عمولة 2% فقط على الصفقات الناجحة. الاشتراك في الباقة المجانية لا يتطلب أي رسوم."
    },
];

export default function SupportPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="الدعم والمساعدة" />

            <main className="flex-1 p-4 pb-24">
                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث عن مساعدة..."
                            className="w-full bg-surface-highlight border border-slate-700 rounded-xl pr-12 pl-4 py-3 text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Quick Actions */}
                <section className="mb-6">
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href="/ai-assistant"
                            className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 hover:border-primary transition-all"
                        >
                            <span className="material-symbols-outlined text-3xl text-primary mb-2">smart_toy</span>
                            <span className="font-bold text-white">المساعد الذكي</span>
                            <span className="text-xs text-slate-400 mt-1">رد فوري 24/7</span>
                        </Link>
                        <button className="flex flex-col items-center p-4 rounded-xl bg-surface-highlight border border-slate-700 hover:border-slate-600 transition-all">
                            <span className="material-symbols-outlined text-3xl text-secondary mb-2">chat</span>
                            <span className="font-bold text-white">دردشة مباشرة</span>
                            <span className="text-xs text-slate-400 mt-1">مع فريق الدعم</span>
                        </button>
                    </div>
                </section>

                {/* Categories */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold text-white mb-3">تصفح حسب الموضوع</h2>
                    <div className="grid grid-cols-3 gap-2">
                        {supportCategories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/help/category/${cat.id}`}
                                className="flex flex-col items-center p-3 rounded-xl bg-surface-highlight border border-slate-700 hover:border-primary transition-all"
                            >
                                <span className="material-symbols-outlined text-2xl text-slate-400 mb-1">
                                    {cat.icon}
                                </span>
                                <span className="text-xs text-slate-300 text-center">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* FAQs */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold text-white mb-3">الأسئلة الشائعة</h2>
                    <div className="space-y-2">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-surface-highlight rounded-xl border border-slate-700 overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                    className="w-full flex items-center justify-between p-4 text-right"
                                >
                                    <span className="font-medium text-white">{faq.question}</span>
                                    <span className={`material-symbols-outlined text-slate-400 transition-transform ${
                                        expandedFaq === index ? "rotate-180" : ""
                                    }`}>
                                        expand_more
                                    </span>
                                </button>
                                {expandedFaq === index && (
                                    <div className="px-4 pb-4 text-slate-400 text-sm">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Contact */}
                <section className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
                    <h2 className="text-lg font-bold text-white mb-3">تواصل معنا</h2>
                    <div className="space-y-3">
                        <a href="tel:+963123456789" className="flex items-center gap-3 text-slate-300 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">phone</span>
                            <span>+963 123 456 789</span>
                        </a>
                        <a href="mailto:support@metalix24.com" className="flex items-center gap-3 text-slate-300 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">email</span>
                            <span>support@metalix24.com</span>
                        </a>
                        <div className="flex items-center gap-3 text-slate-300">
                            <span className="material-symbols-outlined">schedule</span>
                            <span>متاح يومياً 8 ص - 8 م</span>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
