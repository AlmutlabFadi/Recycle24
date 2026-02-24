"use client";

import HeaderWithBack from "@/components/HeaderWithBack";
import { useState } from "react";

const faqs = [
    {
        category: "التداول والأسعار",
        questions: [
            { q: "كيف يتم تحديد أسعار الخردة؟", a: "يتم تحديث الأسعار لحظياً بناءً على مؤشرات الأسواق العالمية (LME) والسوق المحلي." },
            { q: "هل الأسعار المعروضة شاملة النقل؟", a: "الأسعار المعروضة هي أسعار التسليم في أرض التاجر. تكاليف النقل يتم الاتفاق عليها بشكل منفصل." },
        ]
    },
    {
        category: "الحساب والتوثيق",
        questions: [
            { q: "لماذا أحتاج لتوثيق الهوية؟", a: "لضمان بيئة آمنة ومنع التعامل بالمواد المسروقة أو المحظورة وفقاً للقوانين المحلية." },
            { q: "كيف يمكنني استعادة كلمة المرور؟", a: "يمكنك استخدام خيار 'نسيت كلمة المرور' في صفحة تسجيل الدخول وسيتم إرسال رمز التحقق لهاتفك." },
        ]
    },
    {
        category: "المدفوعات",
        questions: [
            { q: "متى أحصل على أرباحي؟", a: "يتم تحويل الأرباح لمحفظتك الرقمية فور تأكيد استلام البضاعة من قبل المشتري." },
            { q: "ما هي طرق السحب المتاحة؟", a: "يمكنك السحب عبر الوكلاء المعتمدين، أو التحويل البنكي، أو شركات التحويل المالية." },
        ]
    }
];

export default function HelpPage() {
    const [openIndex, setOpenIndex] = useState<string | null>(null);

    const toggleFAQ = (id: string) => {
        setOpenIndex(openIndex === id ? null : id);
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark font-display pb-24">
            <HeaderWithBack title="مركز المساعدة" />

            <main className="flex-1 p-4 flex flex-col gap-6">
                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="بماذا يمكننا مساعدتك؟"
                        className="w-full bg-white dark:bg-surface-highlight border-none rounded-xl py-3 px-4 pl-10 shadow-sm focus:ring-2 focus:ring-primary text-sm"
                    />
                    <span className="material-symbols-outlined !text-[20px] absolute left-3 top-3 text-slate-400">search</span>
                </div>

                {/* FAQs */}
                <div className="space-y-6">
                    {faqs.map((cat, catIdx) => (
                        <div key={catIdx}>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3 px-1">{cat.category}</h3>
                            <div className="bg-white dark:bg-surface-highlight rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700/50">
                                {cat.questions.map((item, qIdx) => {
                                    const id = `${catIdx}-${qIdx}`;
                                    const isOpen = openIndex === id;
                                    return (
                                        <div key={qIdx} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                                            <button
                                                onClick={() => toggleFAQ(id)}
                                                className="w-full flex items-center justify-between p-4 text-start hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                                            >
                                                <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{item.q}</span>
                                                <span className={`material-symbols-outlined !text-[20px] text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                                                    keyboard_arrow_down
                                                </span>
                                            </button>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <div className="p-4 pt-0 text-sm text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-black/10">
                                                    {item.a}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact Support */}
                <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-primary text-sm">لم تجد إجابة؟</h4>
                        <p className="text-xs text-slate-500 mt-1">فريق الدعم جاهز لمساعدتك على مدار الساعة</p>
                    </div>
                    <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition">
                        تحدث معنا
                    </button>
                </div>
            </main>
        </div>
    );
}
