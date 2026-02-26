"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";

function RatingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const trackingId = searchParams.get('trackingId') || 'TRK-XXXX';
    const { addToast } = useToast();

    // For demo purposes, allow switching between who is rating who
    const [raterRole, setRaterRole] = useState<"client" | "driver">("client");
    
    // Ratings state
    const [rating1, setRating1] = useState(0); // Driver (if client), or Sender (if driver)
    const [rating2, setRating2] = useState(0); // Receiver (if driver)
    
    const [hover1, setHover1] = useState(0);
    const [hover2, setHover2] = useState(0);
    
    const [review, setReview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        setIsSubmitting(true);
        // Simulate API saving the evaluation
        setTimeout(() => {
            addToast("تم حفظ التقييم بنجاح، شكراً لك!", "success");
            router.push("/");
        }, 1500);
    };

    const StarRating = ({ rating, hover, setRating, setHover, title, subtitle }: any) => (
        <div className="bg-[#111820]/80 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-xl flex flex-col items-center gap-4 mb-4">
            <div className="text-center">
                <h3 className="text-base font-bold text-white mb-1">{title}</h3>
                {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
            <div className="flex gap-2 flex-row-reverse my-2">
                {[5, 4, 3, 2, 1].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`transition-all duration-300 ${
                            star <= (hover || rating) 
                                ? "text-amber-400 scale-110 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" 
                                : "text-slate-700 hover:text-slate-500"
                        }`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                    >
                        <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: `'FILL' ${star <= (hover || rating) ? 1 : 0}` }}>
                            star
                        </span>
                    </button>
                ))}
            </div>
            <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${rating > 0 ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'text-slate-500'}`}>
                {rating === 5 && "ممتاز جداً - خدمة استثنائية"}
                {rating === 4 && "جيد جداً - أداء احترافي"}
                {rating === 3 && "مقبول - يفي بالغرض"}
                {rating === 2 && "سيء - يحتاج للتحسين"}
                {rating === 1 && "سيء جداً - تجربة غير مرضية"}
                {rating === 0 && "الرجاء اختيار التقييم"}
            </span>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#070b10] font-arabic text-white relative pb-28 overflow-hidden">
            {/* Elegant Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Custom Premium Header */}
            <header className="flex justify-between items-center p-5 bg-[#070b10]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
                <button onClick={() => router.push("/")} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-slate-300">
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-black text-white tracking-wide drop-shadow-md">التقييم والمراجعة</h1>
                    <span className="text-[10px] text-primary font-bold tracking-widest uppercase flex items-center gap-1">
                        شحنة {trackingId}
                    </span>
                </div>
                <div className="w-10"></div> {/* Spacer for balance */}
            </header>

            <main className="flex-1 px-5 flex flex-col pt-6 relative z-10 max-w-md mx-auto w-full">
                
                {/* Visual Header */}
                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(0,123,255,0.4)] mb-4 border-4 border-[#070b10]">
                        <span className="material-symbols-outlined text-4xl text-white">verified</span>
                    </div>
                    <h2 className="text-xl font-black text-white mb-2">اكتملت الرحلة بنجاح!</h2>
                    <p className="text-sm text-slate-400 text-center">يرجى تقييم الأطراف المشاركة للمساهمة في تحسين جودة الخدمة.</p>
                </div>

                {/* Role Switcher (For Demo/Testing Purposes) */}
                <div className="flex bg-[#111820]/80 backdrop-blur-md rounded-2xl p-1.5 border border-white/5 shadow-inner mb-6">
                    <button 
                        onClick={() => { setRaterRole("client"); setRating1(0); setRating2(0); }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all duration-300 ${raterRole === "client" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-slate-400 hover:bg-white/5"}`}
                    >
                        تقييم السائق (كالعميل)
                    </button>
                    <button 
                        onClick={() => { setRaterRole("driver"); setRating1(0); setRating2(0); }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all duration-300 ${raterRole === "driver" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-slate-400 hover:bg-white/5"}`}
                    >
                        تقييم العملاء (كالسائق)
                    </button>
                </div>

                <div className="space-y-4">
                    {raterRole === "client" ? (
                        <>
                            <StarRating 
                                rating={rating1} 
                                hover={hover1} 
                                setRating={setRating1} 
                                setHover={setHover1} 
                                title="تقييم السائق والمركبة" 
                                subtitle="كيف كانت احترافية السائق وحالة المركبة؟"
                            />
                        </>
                    ) : (
                        <>
                            <StarRating 
                                rating={rating1} 
                                hover={hover1} 
                                setRating={setRating1} 
                                setHover={setHover1} 
                                title="تقييم المُرسِل (نقطة التحميل)" 
                                subtitle="كيف كان التعامل والتجهيز في نقطة التحميل؟"
                            />
                            <StarRating 
                                rating={rating2} 
                                hover={hover2} 
                                setRating={setRating2} 
                                setHover={setHover2} 
                                title="تقييم المُستلِم (نقطة التفريغ)" 
                                subtitle="كيف كان التعامل والتنظيم في نقطة التفريغ؟"
                            />
                        </>
                    )}
                </div>

                {/* Detailed Feedback Textarea */}
                <div className="mt-4 bg-[#111820]/80 backdrop-blur-md rounded-3xl border border-white/5 p-5 shadow-xl">
                    <label className="text-sm font-bold text-slate-300 block mb-3 text-right">ملاحظات إضافية (اختياري)</label>
                    <textarea 
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="شاركنا تفاصيل تجربتك..."
                        className="w-full h-32 bg-[#070b10] border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-primary transition-colors resize-none"
                        dir="rtl"
                    ></textarea>
                </div>

            </main>

            {/* Premium Floating Action Button Navbar */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#070b10] via-[#070b10]/95 to-transparent pt-10 z-50">
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting || (raterRole === "client" ? rating1 === 0 : (rating1 === 0 || rating2 === 0))}
                    className="w-full h-[60px] bg-primary text-white rounded-2xl font-bold text-base flex justify-center items-center gap-3 hover:bg-primary/90 transition-all shadow-[0_10px_30px_rgba(0,123,255,0.4)] disabled:opacity-50 disabled:scale-100 disabled:shadow-none active:scale-95 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                    {isSubmitting ? (
                        <div className="flex items-center gap-3">
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span className="tracking-wide">جاري إرسال التقييم...</span>
                        </div>
                    ) : (
                        <>
                            <span className="tracking-wide text-[15px]">حفظ التقييم والمتابعة</span>
                            <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">send</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function RatingPageWrapper() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#070b10] flex items-center justify-center text-primary">جاري التحميل...</div>}>
            <RatingContent />
        </Suspense>
    );
}
