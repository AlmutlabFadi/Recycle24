import Link from "next/link";
import BottomNavigation from "@/components/BottomNavigation";

const buyers = [
    {
        name: "ساحة النور للسكراب",
        price: "46,000",
        distance: "2.3 كم",
        rating: "4.8",
        reviews: 124,
        verified: true,
        materials: ["حديد", "نحاس", "ألمنيوم"],
        status: "مفتوح",
    },
    {
        name: "مؤسسة الأمل للتجارة",
        price: "44,500",
        distance: "3.5 كم",
        rating: "4.5",
        reviews: 89,
        verified: true,
        materials: ["حديد", "كرتون"],
        status: "مفتوح",
    },
    {
        name: "ورشة الفرات للمعادن",
        price: "43,000",
        distance: "4.2 كم",
        rating: "4.2",
        reviews: 56,
        verified: false,
        materials: ["حديد", "نحاس"],
        status: "مفتوح",
    },
    {
        name: "مركز الشرق للتدوير",
        price: "41,000",
        distance: "5.1 كم",
        rating: "4.7",
        reviews: 201,
        verified: true,
        materials: ["جميع الأنواع"],
        status: "يغلق ٦:٠٠ م",
    },
    {
        name: "المركز الوطني للخردة",
        price: "40,500",
        distance: "6.8 كم",
        rating: "3.9",
        reviews: 44,
        verified: false,
        materials: ["حديد"],
        status: "مفتوح ٢٤ ساعة",
    },
];

export default function BuyersPage() {
    return (
        <>
            <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
                <div className="flex items-center justify-between p-4">
                    <Link href="/sell" className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition">
                        <span className="material-symbols-outlined text-white">arrow_forward</span>
                    </Link>
                    <h1 className="text-base font-bold text-white">المشترين المتاحين</h1>
                    <Link href="/sell/buyers/map" className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition">
                        <span className="material-symbols-outlined text-primary">map</span>
                    </Link>
                </div>

                {/* Sort & Filter Dropdown */}
                <div className="px-4 pb-3">
                    <div className="relative">
                        <select className="w-full h-10 appearance-none rounded-lg bg-surface-highlight border border-slate-700 text-white text-xs font-bold px-4 pl-10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer">
                            <option value="price_high">الأعلى سعراً</option>
                            <option value="nearest">الأقرب</option>
                            <option value="rating">التقييم</option>
                            <option value="verified">موثق فقط</option>
                        </select>
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <span className="material-symbols-outlined !text-[16px]">expand_more</span>
                        </div>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                            <span className="material-symbols-outlined !text-[16px]">sort</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 pb-24">
                {/* Search Summary */}
                <div className="px-4 py-3 bg-primary/5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary !text-[18px]">hardware</span>
                        <span className="text-sm text-slate-300">
                            <strong className="text-white">حديد</strong> · 500 كغ · دمشق
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        تم العثور على <strong className="text-white">{buyers.length}</strong> مشتري
                    </p>
                </div>

                {/* Buyers List */}
                <div className="flex flex-col gap-3 p-4">
                    {buyers.map((buyer, i) => (
                        <div
                            key={i}
                            className="bg-surface-highlight border border-slate-700 rounded-xl p-4 transition hover:border-primary/30"
                        >
                            <div className="flex justify-between items-start mb-3 gap-2">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="size-12 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-slate-400 !text-[24px]">storefront</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <h3 className="font-bold text-white text-sm truncate">{buyer.name}</h3>
                                            {buyer.verified && (
                                                <span className="material-symbols-outlined text-primary !text-[14px] filled shrink-0">verified</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="flex items-center gap-0.5 text-yellow-500 text-xs">
                                                <span className="material-symbols-outlined !text-[12px] filled">star</span>
                                                <span className="font-english">{buyer.rating}</span>
                                            </span>
                                            <span className="text-[10px] text-slate-500">(<span className="font-english">{buyer.reviews}</span> تقييم)</span>
                                            <span className="text-[10px] text-slate-500">· {buyer.distance}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-left shrink-0">
                                    <p className="text-lg font-bold text-success font-english whitespace-nowrap" dir="ltr">{buyer.price}</p>
                                    <p className="text-[10px] text-slate-500 text-right whitespace-nowrap">ل.س / كغ</p>
                                </div>
                            </div>

                            {/* Materials Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {buyer.materials.map((m) => (
                                    <span key={m} className="text-[10px] bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full">
                                        {m}
                                    </span>
                                ))}
                                <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full border border-success/20">
                                    {buyer.status}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button className="flex-1 h-10 bg-primary text-white rounded-lg font-bold text-sm flex items-center justify-center gap-1 hover:bg-primary-dark transition active:scale-[0.98]">
                                    <span className="material-symbols-outlined !text-[18px]">handshake</span>
                                    <span>تواصل</span>
                                </button>
                                <button className="size-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20 hover:bg-green-500 hover:text-white transition shrink-0">
                                    <span className="material-symbols-outlined !text-[20px]">call</span>
                                </button>
                                <button className="size-10 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-600 transition shrink-0">
                                    <span className="material-symbols-outlined !text-[20px]">directions</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <BottomNavigation />
        </>
    );
}
