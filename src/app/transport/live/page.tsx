"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LiveTrackingPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("driver");
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareDuration, setShareDuration] = useState("4 hours");
    const [isRecording, setIsRecording] = useState(false);

    const shareOptions = [
        { id: "1 hour", label: "١ ساعة" },
        { id: "4 hours", label: "٤ ساعات" },
        { id: "8 hours", label: "٨ ساعات" },
        { id: "12 hours", label: "١٢ ساعة" },
        { id: "24 hours", label: "٢٤ ساعة" },
        { id: "72 hours", label: "٧٢ ساعة" },
    ];

    return (
        <div className="flex flex-col h-screen bg-[#0A111A] font-arabic text-white relative overflow-hidden">
            {/* Map Grid Background (Simulated) */}
            <div 
                className="absolute inset-0 bg-repeat opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}
            />
            
            {/* Simulated Animated SVG Route */}
            <div className="absolute inset-0 flex items-center justify-center translate-x-10 -translate-y-20 pointer-events-none opacity-40">
                <svg width="400" height="600" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 50 C 200 200, 100 400, 350 550" stroke="#007BFF" strokeWidth="4" strokeDasharray="10 10" className="animate-[dash_2s_linear_infinite]" />
                </svg>
            </div>

            {/* Simulated Map Roads (Yellowish) */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <path d="M-50 200 Q 150 150 300 300 T 500 400" stroke="#FFD700" strokeWidth="2" fill="none" />
                    <path d="M100 -50 Q 150 250 50 400 T 200 700" stroke="#FFD700" strokeWidth="1" fill="none" />
                </svg>
            </div>

            {/* Custom Header */}
            <header className="flex justify-between items-center p-4 relative z-10">
                <button className="w-10 h-10 rounded-full bg-surface-dark border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors">
                    <span className="material-symbols-outlined text-slate-300">settings</span>
                </button>
                <h1 className="text-xl font-bold">ميتاليكس ٢٤</h1>
                <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-surface-dark border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors">
                    <span className="material-symbols-outlined text-slate-300">arrow_forward</span>
                </button>
            </header>

            {/* Top Tabs */}
            <div className="px-4 mb-2 relative z-10 cursor-pointer">
                <div className="flex bg-surface-dark/90 backdrop-blur-sm border border-slate-800 rounded-xl p-1">
                    <button 
                        onClick={() => setActiveTab("receiver")}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex justify-center items-center gap-2 transition-colors ${activeTab === "receiver" ? "bg-slate-800 text-white" : "text-slate-400"}`}
                    >
                        <span>المستلم</span>
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    </button>
                    <button 
                        onClick={() => setActiveTab("driver")}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex justify-center items-center gap-2 transition-colors ${activeTab === "driver" ? "bg-primary/20 text-primary border border-primary/30" : "text-slate-400"}`}
                    >
                        <span>السائق</span>
                        <span className="material-symbols-outlined text-[16px]">steering_wheel</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab("sender")}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex justify-center items-center gap-2 transition-colors ${activeTab === "sender" ? "bg-slate-800 text-white" : "text-slate-400"}`}
                    >
                        <span>المرسل</span>
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    </button>
                </div>
            </div>

            {/* Main Interactive Area */}
            <main className="flex-1 relative">
                
                {/* Left Info Panel */}
                <div className="absolute top-4 left-4 w-36 bg-surface-dark/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-lg shadow-black/50 z-10 cursor-pointer hover:border-slate-700 transition-colors">
                    <div className="mb-4">
                        <span className="text-xs text-slate-400 block mb-1">السرعة</span>
                        <div className="flex items-end gap-1">
                            <span className="text-xl font-bold text-white leading-none">٨٢</span>
                            <span className="text-xs text-slate-300 mb-0.5">كم/س</span>
                        </div>
                    </div>
                    <div className="w-full h-[1px] bg-slate-800 mb-4"></div>
                    <div>
                        <span className="text-xs text-slate-400 block mb-1">المتبقي</span>
                        <div className="flex items-end gap-1">
                            <span className="text-xl font-bold text-white leading-none">١٥</span>
                            <span className="text-xs text-slate-300 mb-0.5">دقيقة</span>
                        </div>
                    </div>
                </div>

                {/* Destination Pin */}
                <div className="absolute top-1/4 right-1/4 flex flex-col items-center">
                    <span className="material-symbols-outlined text-red-500 text-4xl drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">location_on</span>
                    <span className="text-xs bg-slate-800/90 text-white px-3 py-1 rounded-full mt-1 border border-slate-700 backdrop-blur">المستودع</span>
                </div>

                {/* Truck Marker */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shadow-[0_0_20px_rgba(0,123,255,0.4)]">
                        <span className="material-symbols-outlined text-primary text-2xl">local_shipping</span>
                    </div>
                    <span className="text-xs bg-slate-800/90 text-white px-3 py-1 rounded-full mt-2 border border-slate-700 backdrop-blur">شاحنة ٤٠٢</span>
                </div>

                {/* Float Action Button - Share */}
                <div className="absolute bottom-6 right-4 z-20">
                    <button 
                        onClick={() => setIsShareModalOpen(true)}
                        className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                    >
                        <span className="material-symbols-outlined text-2xl">chat</span>
                    </button>
                </div>

            </main>

            {/* Bottom Communication Panel */}
            <div className="bg-[#151D26] rounded-t-3xl border-t border-slate-800 px-6 pt-3 pb-24 relative z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-5"></div>
                
                <div className="flex justify-between items-center mb-6">
                    <button className="px-4 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-bold hover:bg-primary/10 transition-colors">
                        تغيير القناة
                    </button>
                    <div className="text-right">
                        <span className="text-xs text-slate-400 block mb-0.5">الحالة الحالية</span>
                        <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm font-bold text-white">نشط - القناة ٤</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center mb-4 relative">
                    {/* Ripple Effects if recording */}
                    {isRecording && (
                        <>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="absolute w-24 h-24 rounded-full bg-primary/20 animate-ping" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="absolute w-32 h-32 rounded-full border border-primary/20 animate-ping" style={{ animationDelay: '0.2s' }} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="absolute w-40 h-40 rounded-full border border-primary/10 animate-ping" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </>
                    )}

                    <button 
                        onMouseDown={() => setIsRecording(true)}
                        onMouseUp={() => setIsRecording(false)}
                        onMouseLeave={() => setIsRecording(false)}
                        onTouchStart={() => setIsRecording(true)}
                        onTouchEnd={() => setIsRecording(false)}
                        className={`w-28 h-28 rounded-full border-4 ${isRecording ? 'border-primary bg-primary shadow-[0_0_30px_rgba(0,123,255,0.6)]' : 'border-primary/20 bg-primary/10'} flex flex-col items-center justify-center gap-1 transition-all relative z-10 active:scale-95 duration-150`}
                    >
                        <span className={`material-symbols-outlined text-4xl ${isRecording ? 'text-white' : 'text-primary'}`}>mic</span>
                        <span className={`text-xs font-bold ${isRecording ? 'text-white' : 'text-primary'}`}>تحدث</span>
                    </button>
                </div>
            </div>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#111820] border-t border-slate-800 flex justify-around items-center px-2 z-40">
                <Link href="/" className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">home</span>
                    <span className="text-[10px] font-medium">الرئيسية</span>
                </Link>
                <Link href="/transport/live" className="flex flex-col items-center gap-1 text-primary">
                    <span className="material-symbols-outlined">map</span>
                    <span className="text-[10px] font-medium">التتبع</span>
                </Link>
                <Link href="/messages" className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">chat_bubble</span>
                    <span className="text-[10px] font-medium">الرسائل</span>
                </Link>
                <Link href="/profile" className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">person</span>
                    <span className="text-[10px] font-medium">حسابي</span>
                </Link>
            </nav>

            {/* Share Location Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsShareModalOpen(false)}>
                    <div 
                        className="w-full max-w-sm bg-[#151D26] rounded-3xl border border-slate-700 p-6 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-slate-400">my_location</span>
                            <h2 className="text-lg font-bold text-white">مشاركة الموقع المباشر</h2>
                        </div>

                        <div className="mb-6">
                            <span className="text-xs text-slate-400 block mb-3 text-right">المدة الزمنية</span>
                            <div className="grid grid-cols-3 gap-3">
                                {shareOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setShareDuration(opt.id)}
                                        className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                                            shareDuration === opt.id 
                                                ? "bg-primary/20 text-primary border border-primary" 
                                                : "bg-surface-dark text-slate-300 border border-slate-700 hover:bg-slate-800"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => setIsShareModalOpen(false)}
                                className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                            >
                                إرسال الموقع الحالي
                                <span className="material-symbols-outlined text-[18px]">send</span>
                            </button>
                            <button 
                                onClick={() => setIsShareModalOpen(false)}
                                className="w-full h-12 rounded-xl bg-surface-dark text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                            >
                                فتح المحادثة
                                <span className="material-symbols-outlined text-[18px]">chat</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
