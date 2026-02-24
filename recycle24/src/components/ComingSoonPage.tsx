"use client";

import Link from "next/link";
import BottomNavigation from "@/components/BottomNavigation";

interface ComingSoonProps {
    title: string;
    icon: string;
    description: string;
}

export default function ComingSoonPage({ title, icon, description }: ComingSoonProps) {
    return (
        <>
            <div className="flex flex-col min-h-screen bg-bg-dark">
                <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
                    <div className="flex items-center gap-3 p-4">
                        <Link href="/" className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition">
                            <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
                        </Link>
                        <h1 className="text-lg font-bold text-white">{title}</h1>
                    </div>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
                    <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined !text-[48px] text-primary">{icon}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-slate-400 mb-8 max-w-xs mx-auto">{description}</p>
                    
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <Link 
                            href="/" 
                            className="bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-dark transition w-full"
                        >
                            العودة للرئيسية
                        </Link>
                        <Link 
                            href="/dashboard" 
                            className="bg-surface-highlight text-slate-300 font-bold py-3 px-6 rounded-xl hover:bg-surface-dark transition w-full"
                        >
                            لوحة التحكم
                        </Link>
                    </div>
                </main>

                <BottomNavigation />
            </div>
        </>
    );
}
