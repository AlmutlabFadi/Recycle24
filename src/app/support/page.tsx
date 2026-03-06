"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

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
    const { isAuthenticated } = useAuth();
    const { addToast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [faqs, setFaqs] = useState<{id: string, title: string, content: string}[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    useEffect(() => {
        fetchFaqs();
    }, [selectedCategory]);

    const fetchFaqs = async () => {
        setIsLoading(true);
        try {
            const url = `/api/support/faqs?category=${selectedCategory}${searchQuery ? `&search=${searchQuery}` : ""}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setFaqs(data.faqs);
            }
        } catch (error) {
            console.error("Error fetching FAQs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchFaqs();
    };

    const filteredFaqs = faqs.filter(faq => 
        faq.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="الدعم والمساعدة" />

            <main className="flex-1 p-4 pb-24">
                {/* Search */}
                <div className="mb-6">
                    <form onSubmit={handleSearch} className="relative">
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onBlur={() => fetchFaqs()}
                            placeholder="ابحث عن مساعدة..."
                            className="w-full bg-surface-highlight border border-slate-700 rounded-xl pr-12 pl-4 py-3 text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
                        />
                    </form>
                </div>

                {/* Quick Actions */}
                <section className="mb-6">
                    <div className="grid grid-cols-2 gap-3">
                        <Link 
                            href="/support/chat"
                            className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 hover:border-primary transition-all group"
                        >
                            <span className="material-symbols-outlined text-3xl text-primary mb-2 group-hover:scale-110 transition-transform">support_agent</span>
                            <span className="font-bold text-white">دردشة مباشرة</span>
                            <span className="text-xs text-slate-400 mt-1">تواصل فوري الآن</span>
                        </Link>
                        <Link 
                            href={isAuthenticated ? "/support/tickets" : "/login"}
                            className="flex flex-col items-center p-4 rounded-xl bg-surface-highlight border border-slate-700 hover:border-secondary transition-all group"
                        >
                            <span className="material-symbols-outlined text-3xl text-secondary mb-2 group-hover:scale-110 transition-transform">confirmation_number</span>
                            <span className="font-bold text-white">تذاكر الدعم</span>
                            <span className="text-xs text-slate-400 mt-1">متابعة طلباتك</span>
                        </Link>
                    </div>
                </section>

                {/* Categories */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold text-white mb-3">تصفح حسب الموضوع</h2>
                    <div className="grid grid-cols-3 gap-2">
                        {supportCategories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(selectedCategory === cat.id ? "all" : cat.id)}
                                className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                                    selectedCategory === cat.id 
                                    ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" 
                                    : "bg-surface-highlight border-slate-700 hover:border-slate-500"
                                }`}
                            >
                                <span className={`material-symbols-outlined text-2xl mb-1 ${
                                    selectedCategory === cat.id ? "text-primary" : "text-slate-400"
                                }`}>
                                    {cat.icon}
                                </span>
                                <span className={`text-xs text-center ${
                                    selectedCategory === cat.id ? "text-primary font-bold" : "text-slate-300"
                                }`}>{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* FAQs */}
                <section className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-white">الأسئلة الشائعة</h2>
                        {selectedCategory !== "all" && (
                            <button 
                                onClick={() => {
                                    setSelectedCategory("all");
                                    setSearchQuery("");
                                }}
                                className="text-xs text-primary font-bold"
                            >
                                عرض الكل
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {isLoading ? (
                            <div className="flex flex-col gap-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-14 w-full bg-slate-800 animate-pulse rounded-xl"></div>
                                ))}
                            </div>
                        ) : filteredFaqs.length === 0 ? (
                            <div className="p-8 text-center bg-surface-highlight rounded-xl border border-slate-700">
                                <span className="material-symbols-outlined text-slate-600 text-4xl mb-2">search_off</span>
                                <p className="text-slate-500 text-sm">لا توجد نتائج بحث</p>
                            </div>
                        ) : (
                            filteredFaqs.map((faq, index) => (
                                <div
                                    key={faq.id}
                                    className="bg-surface-highlight rounded-xl border border-slate-700 overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                        className="w-full flex items-center justify-between p-4 text-right"
                                    >
                                        <span className="font-medium text-white">{faq.title}</span>
                                        <span className={`material-symbols-outlined text-slate-400 transition-transform ${
                                            expandedFaq === index ? "rotate-180" : ""
                                        }`}>
                                            expand_more
                                        </span>
                                    </button>
                                    {expandedFaq === index && (
                                        <div className="px-4 pb-4 text-slate-400 text-sm leading-relaxed border-t border-slate-700/50 pt-3">
                                            {faq.content}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
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
            <BottomNavigation />
        </div>
    );
}
