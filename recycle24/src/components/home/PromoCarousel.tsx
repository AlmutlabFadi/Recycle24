"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const SLIDES = [
    {
        id: "ad",
        title: "عندك خطة جاهزة؟",
        description: "لا تفوّت فرصة الإعلان عنها واحصل على أفضل سعر",
        link: "/offers",
        icon: "gavel",
        bg: "bg-gradient-to-l from-orange-500 to-orange-600",
        textClass: "text-orange-100",
        btnText: "أعلن الآن"
    },
    {
        id: "stolen",
        title: "الإبلاغ عن المفقودات",
        description: "ساعد في حماية الوطن من اللصوص وبلغ عن أي مواد مسروقة أو مشبوهة",
        link: "/stolen-reports",
        icon: "security",
        bg: "bg-gradient-to-l from-red-600 to-rose-700",
        textClass: "text-red-100",
        btnText: "بلغ الآن"
    },
    {
        id: "safety",
        title: "مركز السلامة والتحذيرات",
        description: "تعرف على أحدث إرشادات السلامة وتجنب الاحتيال",
        link: "/safety",
        icon: "shield",
        bg: "bg-gradient-to-l from-blue-600 to-indigo-700",
        textClass: "text-blue-100",
        btnText: "دليل السلامة"
    },
    {
        id: "academy",
        title: "أكاديمية التدريب",
        description: "طور مهاراتك في تجارة الخردة مع دوراتنا المتخصصة",
        link: "/academy",
        icon: "school",
        bg: "bg-gradient-to-l from-emerald-600 to-teal-700",
        textClass: "text-emerald-100",
        btnText: "ابدأ التعلم"
    }
];

export default function PromoCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, []);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    }, []);

    useEffect(() => {
        if (!isPaused) {
            const interval = setInterval(nextSlide, 5000);
            return () => clearInterval(interval);
        }
    }, [isPaused, nextSlide]);

    return (
        <div
            className="relative group overflow-hidden rounded-xl shadow-lg"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)`, direction: 'ltr' }}
            >
                {/* Note: Translate logic depends on direction. For RTL visual stack:
            If we map normally, slide 1 is at 0. Slide 2 is at 100%.
            To show Slide 2, we move container -100%?
            In LTR: TranslateX(-100%) shows next. 
            In RTL: TranslateX(100%) shows next?
            Let's force LTR container logic and render slides, 
            but keep content RTL text.
        */}
                {SLIDES.map((slide) => (
                    <Link
                        key={slide.id}
                        href={slide.link}
                        className={`w-full flex-shrink-0 block relative p-5 ${slide.bg} min-h-[160px] flex flex-col justify-center`}
                        dir="rtl"
                    >
                        <div className="relative z-10 pl-16">
                            <h3 className="text-xl font-bold text-white mb-1.5 shadow-sm">
                                {slide.title}
                            </h3>
                            <p className={`text-sm ${slide.textClass} mb-4 font-medium max-w-[85%]`}>
                                {slide.description}
                            </p>
                            <span className="inline-flex items-center gap-1 text-sm font-bold text-white bg-white/20 rounded-full px-4 py-1.5 hover:bg-white/30 transition backdrop-blur-sm">
                                <span className="material-symbols-outlined !text-[18px]">
                                    {slide.icon === 'gavel' ? 'add_circle' : 'arrow_back'}
                                </span>
                                {slide.btnText}
                            </span>
                        </div>

                        {/* Background Icon Watermark */}
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined !text-[100px] text-white/10 rotate-12">
                            {slide.icon}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={(e) => { e.preventDefault(); prevSlide(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            >
                <span className="material-symbols-outlined !text-[20px]">chevron_right</span>
            </button>

            <button
                onClick={(e) => { e.preventDefault(); nextSlide(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            >
                <span className="material-symbols-outlined !text-[20px]">chevron_left</span>
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {SLIDES.map((_, index) => (
                    <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-white w-6" : "bg-white/40"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
