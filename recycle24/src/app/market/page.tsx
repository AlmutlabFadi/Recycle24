import Link from "next/link";
import BottomNavigation from "@/components/BottomNavigation";

const metals = [
    { symbol: "Fe", name: "الحديد الخام", price: "$120.50", change: "+2.1%", isUp: true, vol: "2.4M T", color: "text-slate-300" },
    { symbol: "Cu", name: "النحاس", price: "$8,450.00", change: "+1.24%", isUp: true, vol: "840K T", color: "text-orange-400" },
    { symbol: "Al", name: "الألمنيوم", price: "$2,230.00", change: "-0.45%", isUp: false, vol: "1.2M T", color: "text-gray-400" },
    { symbol: "Zn", name: "الزنك", price: "$2,510.00", change: "+0.8%", isUp: true, vol: "600K T", color: "text-blue-300" },
    { symbol: "Pb", name: "الرصاص", price: "$2,120.00", change: "-0.2%", isUp: false, vol: "450K T", color: "text-purple-300" },
];

const tabs = ["المعادن الأساسية", "المعادن الثمينة", "صناعية", "العملات"];

export default function MarketPage() {
    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-30 w-full glass border-b border-slate-800">
                <div className="flex items-center justify-between px-4 py-3">
                    <button className="flex items-center justify-center size-10 rounded-full hover:bg-surface-dark transition">
                        <span className="material-symbols-outlined text-white">menu</span>
                    </button>
                    <h1 className="text-lg font-bold tracking-tight text-center flex-1 text-primary font-english">
                        Metalix<span className="text-white">24</span>
                        <span className="text-xs font-normal text-slate-400 block -mt-0.5 font-arabic">الذكاء العالمي</span>
                    </h1>
                    <button className="flex items-center justify-center size-10 rounded-full hover:bg-surface-dark transition relative">
                        <span className="material-symbols-outlined text-white">notifications</span>
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    </button>
                </div>

                {/* Ticker Bar */}
                <div className="w-full bg-surface-dark/50 border-t border-b border-slate-800/50 py-2 overflow-hidden relative">
                    <div className="flex gap-6 whitespace-nowrap px-4 overflow-x-auto no-scrollbar items-center">
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="material-symbols-outlined text-slate-400 !text-[18px]">public</span>
                            <span className="text-xs font-bold text-slate-400">LME (لندن)</span>
                            <span className="text-sm font-english font-medium text-white">$8,200</span>
                            <span className="text-xs font-english text-success">▲ 0.5%</span>
                        </div>
                        <div className="w-[1px] h-4 bg-slate-700"></div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="material-symbols-outlined text-slate-400 !text-[18px]">public</span>
                            <span className="text-xs font-bold text-slate-400">SHFE (شنغهاي)</span>
                            <span className="text-sm font-english font-medium text-white">¥6,500</span>
                            <span className="text-xs font-english text-danger">▼ 1.2%</span>
                        </div>
                        <div className="w-[1px] h-4 bg-slate-700"></div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="material-symbols-outlined text-slate-400 !text-[18px]">currency_exchange</span>
                            <span className="text-xs font-bold text-slate-400">USD/SYP</span>
                            <span className="text-sm font-english font-medium text-white">14,500</span>
                            <span className="text-xs font-english text-success">▲ 0.1%</span>
                        </div>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="px-2 pt-2">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar px-2 pb-2">
                        {tabs.map((tab, i) => (
                            <button
                                key={tab}
                                className={`flex flex-col items-center min-w-max pb-2 border-b-[3px] text-sm font-bold transition-all ${i === 0
                                    ? "border-primary text-primary"
                                    : "border-transparent text-slate-400 hover:text-slate-200"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 flex flex-col gap-4 pb-24">
                {/* AI Daily Insight */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-symbols-outlined !text-[100px]">psychology</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined !text-[20px]">auto_awesome</span>
                            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">تحليل AI اليومي</span>
                        </div>
                        <h3 className="font-bold text-lg mb-2">توقعات بارتفاع أسعار النحاس</h3>
                        <p className="text-sm text-indigo-100 leading-relaxed mb-4">
                            تشير بيانات التوريد العالمية وقرارات الفائدة الأخيرة إلى احتمال زيادة الطلب الصناعي على النحاس بنسبة 5% خلال الأسبوع القادم.
                        </p>
                        <div className="flex gap-2">
                            <Link href="/market/alerts" className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg py-2 flex items-center justify-center gap-2 text-xs font-bold transition">
                                <span className="material-symbols-outlined !text-[16px]">notifications_active</span>
                                ضبط تنبيه
                            </Link>
                            <Link href="/market/calendar" className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg py-2 flex items-center justify-center gap-2 text-xs font-bold transition">
                                <span className="material-symbols-outlined !text-[16px]">calendar_month</span>
                                المفكرة الاقتصادية
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Context Header */}
                <div className="flex items-center justify-between pb-2">
                    <h2 className="text-xl font-bold text-white">
                        نظرة السوق <span className="text-sm font-normal text-slate-500">(مباشر)</span>
                    </h2>
                    <div className="flex items-center gap-1 bg-surface-dark rounded-md px-2 py-1">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                        <span className="text-xs text-slate-300">متصل</span>
                    </div>
                </div>

                {/* Metal Cards */}
                {metals.map((metal) => (
                    <div key={metal.symbol} className="w-full bg-surface-dark rounded-xl p-5 shadow-lg border border-slate-800 relative overflow-hidden group">
                        {/* Background glow */}
                        <div className={`absolute top-0 right-0 w-32 h-32 ${metal.isUp ? "bg-success" : "bg-danger"}/10 blur-[50px] rounded-full pointer-events-none`}></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                                    <span className={`text-lg font-bold font-english ${metal.color}`}>{metal.symbol}</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white leading-tight">{metal.name}</h3>
                                    <p className="text-xs text-slate-400">سوق عالمي</p>
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="text-2xl font-bold font-english text-white tracking-tight">{metal.price}</p>
                            </div>
                        </div>

                        {/* Mini Chart */}
                        <div className="h-16 w-full relative mb-2">
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 80">
                                <defs>
                                    <linearGradient id={`grad-${metal.symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: metal.isUp ? "#10b981" : "#ef4444", stopOpacity: 0.2 }} />
                                        <stop offset="100%" style={{ stopColor: metal.isUp ? "#10b981" : "#ef4444", stopOpacity: 0 }} />
                                    </linearGradient>
                                </defs>
                                <path
                                    d={metal.isUp ? "M0,60 C50,55 70,40 120,35 C160,30 200,20 250,15 C270,12 290,8 300,5 V80 H0 Z" : "M0,20 C50,15 80,30 120,35 C160,40 200,55 240,60 C270,65 290,70 300,75 V80 H0 Z"}
                                    fill={`url(#grad-${metal.symbol})`}
                                />
                                <path
                                    d={metal.isUp ? "M0,60 C50,55 70,40 120,35 C160,30 200,20 250,15 C270,12 290,8 300,5" : "M0,20 C50,15 80,30 120,35 C160,40 200,55 240,60 C270,65 290,70 300,75"}
                                    fill="none"
                                    stroke={metal.isUp ? "#10b981" : "#ef4444"}
                                    strokeLinecap="round"
                                    strokeWidth="2"
                                />
                            </svg>
                        </div>

                        <div className="flex justify-between items-center relative z-10">
                            <div className={`flex items-center gap-1 ${metal.isUp ? "bg-success/10" : "bg-danger/10"} px-2 py-1 rounded-md`}>
                                <span className={`material-symbols-outlined ${metal.isUp ? "text-success" : "text-danger"} !text-[14px]`}>
                                    {metal.isUp ? "trending_up" : "trending_down"}
                                </span>
                                <span className={`text-sm font-bold font-english ${metal.isUp ? "text-success" : "text-danger"}`}>
                                    {metal.change}
                                </span>
                            </div>
                            <span className="text-xs text-slate-500 font-english">Vol: {metal.vol}</span>
                        </div>
                    </div>
                ))}

                {/* Local Exchange Rate */}
                <div className="mt-2">
                    <h3 className="text-sm font-semibold text-slate-400 mb-3 px-1">أسعار الصرف المحلية (سوريا)</h3>
                    <div className="bg-surface-dark rounded-lg p-3 border border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-xs font-english">$</div>
                            <div>
                                <p className="text-sm font-bold text-white">دولار أمريكي</p>
                                <p className="text-xs text-slate-500">سوق السوداء</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <p className="text-base font-bold font-english text-white">14,500 SYP</p>
                            <p className="text-xs text-success font-english text-left">+50 SYP</p>
                        </div>
                    </div>
                </div>
            </main>

            <BottomNavigation />
        </>
    );
}
