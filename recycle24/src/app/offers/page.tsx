import BottomNavigation from "@/components/BottomNavigation";

export default function OffersPage() {
    return (
        <>
            <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
                <div className="flex items-center justify-between p-4">
                    <div className="size-10" />
                    <h1 className="text-base font-bold text-white">عروضي</h1>
                    <button className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition">
                        <span className="material-symbols-outlined text-white">filter_list</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 pb-24 flex flex-col items-center justify-center px-8 text-center">
                <div className="size-24 rounded-full bg-surface-highlight flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-slate-500 !text-[48px]">list_alt</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">لا توجد عروض حالية</h2>
                <p className="text-sm text-slate-400 mb-6">
                    ابدأ ببيع خردتك واحصل على عروض من المشترين القريبين
                </p>
                <a
                    href="/sell"
                    className="h-12 px-8 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined !text-[20px]">add</span>
                    أضف إعلانك الأول
                </a>
            </main>

            <BottomNavigation />
        </>
    );
}
