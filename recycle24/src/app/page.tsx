import TopAppBar from "@/components/TopAppBar";
import BottomNavigation from "@/components/BottomNavigation";
import MarketPriceCard from "@/components/MarketPriceCard";
import GlobalMarketTicker from "@/components/home/GlobalMarketTicker";
import PromoCarousel from "@/components/home/PromoCarousel";
import Link from "next/link";

const quickServices = [
  { id: "auction", label: "إنشاء مزاد", icon: "gavel", href: "/auctions/create", color: "bg-purple-500/20 text-purple-400" },
  { id: "transport", label: "طلب نقل", icon: "local_shipping", href: "/transport", color: "bg-blue-500/20 text-blue-400" },
  { id: "consultation", label: "استشارة", icon: "psychology", href: "/consultations", color: "bg-teal-500/20 text-teal-400" },
  { id: "alerts", label: "تنبيهات الأسعار", icon: "notifications_active", href: "/price-alerts", color: "bg-amber-500/20 text-amber-400" },
  { id: "jobs", label: "الوظائف", icon: "work", href: "/jobs", color: "bg-green-500/20 text-green-400" },
  { id: "support", label: "الدعم الفني", icon: "support_agent", href: "/support/chat", color: "bg-red-500/20 text-red-400" },
];

const materials = [
  { id: "iron", label: "حديد", icon: "hardware", color: "bg-slate-500/20 text-slate-300" },
  { id: "copper", label: "نحاس", icon: "category", color: "bg-orange-500/20 text-orange-400" },
  { id: "plastic", label: "بلاستيك", icon: "inventory_2", color: "bg-blue-500/20 text-blue-400" },
  { id: "cardboard", label: "كرتون", icon: "deployed_code", color: "bg-amber-500/20 text-amber-400" },
  { id: "aluminum", label: "ألمنيوم", icon: "stack", color: "bg-gray-500/20 text-gray-300" },
  { id: "mixed", label: "خلطة", icon: "recycling", color: "bg-green-500/20 text-green-400" },
];

const buyers = [
  {
    name: "ساحة النور للسكراب",
    materials: "حديد، نحاس، ألمنيوم",
    distance: "2.3 كم",
    price: "45,000 ل.س/كغ",
    badge: "✓ موثق",
  },
  {
    name: "مؤسسة الأمل للتجارة",
    materials: "حديد، كرتون",
    distance: "3.5 كم",
    price: "42,000 ل.س/كغ",
  },
  {
    name: "مركز الشرق للتدوير",
    materials: "جميع الأنواع",
    distance: "5.1 كم",
    price: "40,500 ل.س/كغ",
    badge: "سعر ثابت",
  },
];

export default function HomePage() {
  return (
    <>
      <TopAppBar />

      <main className="flex-1 pb-24">
        {/* الأسعار العالمية */}
        <section className="pt-6 pb-2">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-lg font-bold text-white">أسعار السوق العالمية</h2>
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              مباشر
            </span>
          </div>
          <div className="relative min-h-[140px]">
            <GlobalMarketTicker />
          </div>
        </section>

        {/* ماذا تبيع اليوم؟ */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">ماذا تبيع اليوم؟</h2>
            <Link href="/sell" className="text-sm font-bold text-primary">
              عرض الكل
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {materials.map((material) => (
              <Link
                key={material.id}
                href={`/sell?material=${material.id}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-700 bg-surface-dark hover:border-primary/50 active:scale-95 transition-all"
              >
                <div className={`p-3 rounded-xl ${material.color}`}>
                  <span className="material-symbols-outlined !text-[24px]">
                    {material.icon}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-200">
                  {material.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* الخدمات السريعة */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">الخدمات السريعة</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {quickServices.map((service) => (
              <Link
                key={service.id}
                href={service.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-700 bg-surface-dark hover:border-primary/50 active:scale-95 transition-all"
              >
                <div className={`p-3 rounded-xl ${service.color}`}>
                  <span className="material-symbols-outlined !text-[24px]">
                    {service.icon}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-200 text-center">
                  {service.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* الشرائح الترويجية (إعلان، مفقودات، سلامة، تدريب) */}
        <section className="px-4 mb-6">
          <PromoCarousel />
        </section>

        {/* إنشاء مزاد - CTA */}
        <section className="px-4 mb-6">
          <Link
            href="/auctions/create"
            className="block relative overflow-hidden rounded-xl p-5 bg-gradient-to-l from-indigo-600 to-purple-600 group active:scale-[0.98] transition shadow-lg"
          >
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined !text-[24px]">gavel</span>
                عندك كمية كبيرة؟
              </h3>
              <p className="text-sm text-indigo-100 mb-3">
                أنشئ مزادك الخاص واحصل على أفضل عروض الأسعار
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white bg-white/20 rounded-full px-4 py-2 hover:bg-white/30 transition">
                <span className="material-symbols-outlined !text-[18px]">
                  add_circle
                </span>
                إنشاء مزاد جديد
              </span>
            </div>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined !text-[80px] text-white/10">
              gavel
            </span>
          </Link>
        </section>

        {/* المزادات الحية */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">مزادات حية 🔴</h2>
            <Link href="/auctions" className="text-sm font-bold text-primary">
              عرض الكل
            </Link>
          </div>
          <Link
            href="/auctions/402"
            className="block rounded-xl bg-surface-highlight border border-red-500/20 p-4 hover:border-red-500/50 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white">دفعة #402: 20 طن نحاس</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  حلب - المنطقة الصناعية
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                مباشر
              </span>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700/50">
              <div>
                <p className="text-xs text-slate-400">أعلى مزايدة</p>
                <p className="text-lg font-bold text-white font-english dir-ltr">
                  45,200,000 <span className="text-sm text-primary">ل.س</span>
                </p>
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400">ينتهي خلال</p>
                <p className="text-lg font-bold text-red-500 font-english dir-ltr">
                  04:32
                </p>
              </div>
            </div>
          </Link>
        </section>

        {/* مشترين بالقرب منك */}
        <section className="px-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">مشترين بالقرب منك</h2>
            <Link href="/sell/buyers/map" className="text-sm font-bold text-primary">
              خريطة
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {buyers.map((buyer, i) => (
              <div
                key={i}
                className="flex items-center p-3 rounded-xl bg-surface-highlight border border-slate-700 shadow-sm"
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-lg bg-slate-700 shrink-0 flex items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined !text-[28px]">
                    storefront
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 mr-3 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white truncate text-sm">
                      {buyer.name}
                    </h3>
                    {buyer.badge && (
                      <span className="text-[10px] font-semibold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded mr-1 whitespace-nowrap">
                        {buyer.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    يشتري: {buyer.materials}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                      <span className="material-symbols-outlined !text-[12px]">
                        near_me
                      </span>
                      {buyer.distance}
                    </span>
                    <span className="text-[11px] font-bold text-primary font-english dir-ltr">
                      {buyer.price}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button className="size-9 rounded-full bg-slate-700 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition">
                    <span className="material-symbols-outlined !text-[18px]">
                      call
                    </span>
                  </button>
                  <button className="size-9 rounded-full bg-slate-700 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition">
                    <span className="material-symbols-outlined !text-[18px]">
                      chat
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNavigation />
    </>
  );
}
