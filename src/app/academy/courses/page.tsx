"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderWithBack from "@/components/HeaderWithBack";

const courses = [
    {
        id: 1,
        title: "أساسيات تصنيف المعادن",
        description: "تعلم كيفية التمييز بين أنواع المعادن المختلفة وتحديد قيمتها",
        duration: "3 ساعات",
        level: "مبتدئ",
        lessons: 12,
        enrolled: 1250,
        rating: 4.8,
        progress: 0,
        image: "/course1.jpg",
        tags: ["معادن", "تصنيف"],
    },
    {
        id: 2,
        title: "التسعير الذكي للخردة",
        description: "استراتيجيات التسعير الصحيحة بناءً على السوق والجودة",
        duration: "2.5 ساعة",
        level: "متوسط",
        lessons: 8,
        enrolled: 890,
        rating: 4.9,
        progress: 45,
        image: "/course2.jpg",
        tags: ["تسعير", "استراتيجية"],
    },
    {
        id: 3,
        title: "إدارة المزادات الاحترافية",
        description: "كيفية إنشاء وإدارة مزادات ناجحة لتحقيق أقصى ربح",
        duration: "4 ساعات",
        level: "متقدم",
        lessons: 15,
        enrolled: 650,
        rating: 4.7,
        progress: 0,
        image: "/course3.jpg",
        tags: ["مزادات", "إدارة"],
    },
    {
        id: 4,
        title: "السلامة في التعامل مع الخردة",
        description: "إرشادات ونصائح للتعامل الآمن مع المواد الخطرة",
        duration: "1.5 ساعة",
        level: "مبتدئ",
        lessons: 6,
        enrolled: 2100,
        rating: 4.9,
        progress: 100,
        image: "/course4.jpg",
        tags: ["سلامة", "صحة"],
    },
];

const categories = [
    { id: "all", name: "الكل", icon: "apps" },
    { id: "metals", name: "المعادن", icon: "category" },
    { id: "pricing", name: "التسعير", icon: "payments" },
    { id: "auctions", name: "المزادات", icon: "gavel" },
    { id: "safety", name: "السلامة", icon: "health_and_safety" },
];

export default function AcademyCoursesPage() {
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCourses = courses.filter(course => {
        const matchesCategory = activeCategory === "all" || course.tags.some(tag => 
            activeCategory === "metals" && tag === "معادن" ||
            activeCategory === "pricing" && tag === "تسعير" ||
            activeCategory === "auctions" && tag === "مزادات" ||
            activeCategory === "safety" && tag === "سلامة"
        );
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            course.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title="الدورات التدريبية" />

            {/* Hero */}
            <div className="bg-gradient-to-br from-primary to-primary-dark p-6">
                <h1 className="text-2xl font-bold text-white mb-2">أكاديمية Metalix24</h1>
                <p className="text-white/80">تعلم مهارات تجارة الخردة من الخبراء</p>
                <div className="flex gap-4 mt-4">
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-white">15+</div>
                        <div className="text-xs text-white/70">دورة</div>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-white">5K+</div>
                        <div className="text-xs text-white/70">متدرب</div>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-white">50+</div>
                        <div className="text-xs text-white/70">ساعة</div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 py-4">
                <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">
                        search
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن دورة..."
                        className="w-full bg-surface-highlight border border-slate-700 rounded-xl pr-12 pl-4 py-3 text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="px-4 pb-4">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                activeCategory === cat.id
                                    ? "bg-primary text-white"
                                    : "bg-surface-highlight text-slate-300 border border-slate-700"
                            }`}
                        >
                            <span className="material-symbols-outlined !text-[18px]">{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Courses List */}
            <main className="flex-1 px-4 pb-24">
                <div className="space-y-4">
                    {filteredCourses.map((course) => (
                        <Link
                            key={course.id}
                            href={`/academy/courses/${course.id}`}
                            className="block bg-surface-highlight rounded-xl border border-slate-700 overflow-hidden hover:border-primary transition-colors"
                        >
                            {/* Course Image */}
                            <div className="h-32 bg-slate-800 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-slate-600">play_circle</span>
                                </div>
                                {course.progress > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                                        <div 
                                            className="h-full bg-primary"
                                            style={{ width: `${course.progress}%` }}
                                        ></div>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                        course.level === "مبتدئ" ? "bg-green-500/20 text-green-400" :
                                        course.level === "متوسط" ? "bg-yellow-500/20 text-yellow-400" :
                                        "bg-red-500/20 text-red-400"
                                    }`}>
                                        {course.level}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-bold text-white mb-2">{course.title}</h3>
                                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{course.description}</p>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[14px]">schedule</span>
                                        {course.duration}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[14px]">menu_book</span>
                                        {course.lessons} درس
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[14px]">person</span>
                                        {course.enrolled}
                                    </span>
                                </div>

                                {/* Rating & Progress */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-yellow-400 !text-[18px]">star</span>
                                        <span className="text-white font-bold">{course.rating}</span>
                                    </div>
                                    {course.progress > 0 ? (
                                        <span className="text-sm text-primary">
                                            {course.progress === 100 ? "مكتمل" : `${course.progress}%`}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-slate-400">ابدأ الآن</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {filteredCourses.length === 0 && (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">school</span>
                        <p className="text-slate-400">لا توجد دورات مطابقة</p>
                    </div>
                )}
            </main>
        </div>
    );
}
