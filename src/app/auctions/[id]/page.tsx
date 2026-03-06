"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useAuctions, Auction } from "@/hooks/useAuctions";

interface Bid {
    id: string;
    amount: number;
    bidder: { id: string; name: string };
    createdAt: string;
}

export default function AuctionDetailPage() {
    const params = useParams();
    const auctionId = params.id as string;
    
    const { isAuthenticated, user } = useAuth();
    const { addToast } = useToast();
    const { fetchAuctionById, placeBid, joinAuction } = useAuctions();
    
    const [auction, setAuction] = useState<Auction | null>(null);
    const [bids, setBids] = useState<Bid[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [bidAmount, setBidAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isDischarging, setIsDischarging] = useState(false);
    
    // Join Modal State
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [agreements, setAgreements] = useState({
        agreedToTerms: false,
        agreedToPrivacy: false,
        agreedToCommission: false,
        agreedToDataSharing: false,
        hasInspectedGoods: false,
        agreedToInvoice: false
    });

    const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

    const fetchAuctionData = useCallback(async () => {
        setIsLoading(true);
        try {
            const auctionData = (await fetchAuctionById(auctionId)) as any;
            if (auctionData) {
                setAuction(auctionData);
                setBidAmount((auctionData.currentBid || auctionData.startingBid + 100000).toString());
            }
            
            const bidsResponse = await fetch(`/api/auctions/${auctionId}/bid`);
            if (bidsResponse.ok) {
                const bidsData = await bidsResponse.json();
                setBids(bidsData.bids || []);
            }
        } catch (error) {
            console.error("Error fetching auction:", error);
        } finally {
            setIsLoading(false);
        }
    }, [auctionId, fetchAuctionById]);

    useEffect(() => {
        fetchAuctionData();
    }, [fetchAuctionData]);

    useEffect(() => {
        if (!auction?.endsAt) return;
        
        const updateTimer = () => {
            const now = new Date();
            const end = new Date(auction.endsAt!);
            const diff = end.getTime() - now.getTime();
            
            if (diff <= 0) {
                setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
                return;
            }
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setTimeRemaining({ hours, minutes, seconds });
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [auction?.endsAt]);

    const handleQuickBid = (amount: number) => {
        const currentBidValue = auction?.currentBid || auction?.startingBid || 0;
        setBidAmount((currentBidValue + amount).toString());
    };

    const handlePlaceBid = async () => {
        if (!isAuthenticated) {
            addToast("يجب تسجيل الدخول للمزايدة", "error");
            return;
        }
        
        if (!bidAmount || isNaN(parseInt(bidAmount))) {
            addToast("يرجى إدخال مبلغ صحيح", "error");
            return;
        }
        
        const currentBidValue = auction?.currentBid || auction?.startingBid || 0;
        if (parseInt(bidAmount) <= currentBidValue) {
            addToast(`يجب أن تكون المزايدة أعلى من ${currentBidValue.toLocaleString()} ل.س`, "error");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const success = await placeBid(auctionId, parseInt(bidAmount));
            if (success) {
                addToast("تم تقديم المزايدة بنجاح!", "success");
                await fetchAuctionData();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJoinAuction = async () => {
        if (!Object.values(agreements).every(v => v)) {
            addToast("يرجى الموافقة على جميع الشروط والإقرارات", "error");
            return;
        }

        setIsJoining(true);
        try {
            const result = await joinAuction(auctionId, agreements);
            if (result.success) {
                addToast("تم الانضمام للمزاد بنجاح", "success");
                setIsJoinModalOpen(false);
                await fetchAuctionData();
            } else {
                addToast(result.message || "فشل الانضمام للمزاد", "error");
            }
        } finally {
            setIsJoining(false);
        }
    };

    const handleDischarge = async () => {
        if (!confirm("هل أنت متأكد من براءة ذمة المشتري وتحرير مبلغ التأمين له؟")) return;

        setIsDischarging(true);
        try {
            const response = await fetch(`/api/auctions/${auctionId}/discharge`, {
                method: "POST"
            });
            const data = await response.json();
            if (response.ok) {
                addToast("تمت براءة الذمة بنجاح وتحرير التأمين", "success");
                await fetchAuctionData();
            } else {
                addToast(data.error || "فشل إجراء براءة الذمة", "error");
            }
        } finally {
            setIsDischarging(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diff = now.getTime() - date.getTime();
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (seconds < 60) return "منذ ثوانٍ";
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        return `منذ ${hours} ساعة`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <span className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin block mx-auto mb-4"></span>
                        <p className="text-slate-400">جاري تحميل المزاد...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!auction) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-dark">
                <header className="sticky top-0 z-20 bg-bg-dark border-b border-slate-800 p-4">
                    <Link href="/auctions" className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition">
                        <span className="material-symbols-outlined text-white">arrow_forward</span>
                    </Link>
                </header>
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">error</span>
                        <h2 className="text-xl font-bold text-white mb-2">المزاد غير موجود</h2>
                        <Link href="/auctions" className="text-primary font-bold">العودة للمزادات</Link>
                    </div>
                </div>
            </div>
        );
    }

    const isLive = auction.status === "LIVE";
    const currentBidValue = auction.currentBid || auction.startingBid;
    const isSeller = user?.id === auction.sellerId;
    const hasWinner = !!auction.winnerId;
    const isEnded = auction.status === "ENDED";

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            {/* Header */}
            <header className={`flex-none px-4 pt-4 pb-4 ${isLive ? "bg-[#1a0f0f] border-red-500/20" : "bg-surface-dark border-slate-800"} border-b flex items-center justify-between sticky top-0 z-20`}>
                <Link href="/auctions" className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition">
                    <span className="material-symbols-outlined text-white">arrow_forward</span>
                </Link>
                <div className="flex flex-col items-center">
                    <h1 className="text-base font-bold text-white">{auction.title}</h1>
                    {isLive && (
                        <div className="flex items-center gap-1 text-xs text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded-full mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            <span>مباشر</span>
                        </div>
                    )}
                </div>
                <button className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition">
                    <span className="material-symbols-outlined text-white">share</span>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto pb-48">
                {/* Timer Section (only if live) */}
                {isLive && (
                    <div className="py-8 flex flex-col items-center justify-center">
                        <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">الوقت المتبقي</p>
                        <div className="flex items-center gap-3 dir-ltr">
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-16 h-16 bg-surface-dark border border-white/10 rounded-xl flex items-center justify-center">
                                    <span className="text-3xl font-bold text-white">{String(timeRemaining.hours).padStart(2, "0")}</span>
                                </div>
                                <span className="text-[10px] text-slate-400">ساعة</span>
                            </div>
                            <span className="text-2xl font-bold text-slate-600">:</span>
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-16 h-16 bg-surface-dark border border-white/10 rounded-xl flex items-center justify-center">
                                    <span className="text-3xl font-bold text-white">{String(timeRemaining.minutes).padStart(2, "0")}</span>
                                </div>
                                <span className="text-[10px] text-slate-400">دقيقة</span>
                            </div>
                            <span className="text-2xl font-bold text-slate-600">:</span>
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-16 h-16 bg-surface-dark border border-red-500/50 rounded-xl flex items-center justify-center ring-1 ring-red-500/30">
                                    <span className="text-3xl font-bold text-red-500">{String(timeRemaining.seconds).padStart(2, "0")}</span>
                                </div>
                                <span className="text-[10px] text-red-500 font-medium">ثانية</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Highest Bid Section */}
                <div className="px-4 mb-6">
                    <div className="bg-surface-dark border border-slate-700 rounded-xl p-5">
                        <span className="text-sm font-medium text-slate-400">أعلى مزايدة حالية</span>
                        <div className="flex items-baseline justify-center gap-2 mt-1">
                            <span className="text-3xl font-bold text-white">{currentBidValue.toLocaleString()}</span>
                            <span className="text-lg font-bold text-primary">ل.س</span>
                        </div>
                        {bids[0] && (
                            <div className="mt-3 flex items-center justify-center gap-2 border-t border-slate-800 pt-3">
                                <div className="size-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined !text-[14px]">person</span>
                                </div>
                                <span className="text-sm text-slate-300 font-medium">{bids[0].bidder.name}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Discharge UI for Seller (Phase 19) */}
                {isSeller && isEnded && hasWinner && (
                    <div className="px-4 mb-6">
                        <div className="bg-primary/10 border border-primary/30 rounded-xl p-5 text-center shadow-lg">
                            <h3 className="text-primary font-bold mb-2">إجراءات البائع</h3>
                            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                                المزاد انتهى وتم تحديد الفائز. اضغط على براءة الذمة بعد استلام كامل المبلغ وترحيل البضائع لتحرير تأمين المشتري.
                            </p>
                            <button
                                onClick={handleDischarge}
                                disabled={isDischarging}
                                className="w-full h-12 bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition active:scale-95 disabled:opacity-50"
                            >
                                {isDischarging ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">verified</span>
                                        براءة ذمة (تحرير التأمين)
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Details Section */}
                <div className="px-4 mb-6">
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
                        <h3 className="font-bold text-white mb-4 border-b border-slate-700 pb-2">تفاصيل المزاد</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">التأمين المطلوب:</span>
                                <span className="text-orange-400 font-bold">{(auction.securityDeposit || 0).toLocaleString()} ل.س</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">رسوم المشاركة:</span>
                                <span className="text-red-400 font-bold">{(auction.entryFee || 0).toLocaleString()} ل.س</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">المادة:</span>
                                <span className="text-white">{auction.category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">الوزن:</span>
                                <span className="text-white">{auction.weight} {auction.weightUnit}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">الموقع:</span>
                                <span className="text-white">{auction.location}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-700/50 pt-2 mt-2">
                                <span className="text-slate-400">الحالة:</span>
                                <span className="text-primary font-bold">{auction.status}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Last Activity Section */}
                <div className="px-4 pb-2 flex items-center justify-between sticky top-0 bg-bg-dark/90 z-10 backdrop-blur-md py-3">
                    <h3 className="text-sm font-bold text-white">النشاط الأخير</h3>
                    <span className="text-xs text-slate-500">{bids.length} مزايدات</span>
                </div>

                <div className="px-4 flex flex-col gap-3 pb-6">
                    {bids.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">gavel</span>
                            <p>لا توجد مزايدات بعد</p>
                        </div>
                    ) : (
                        bids.map((bid, i) => (
                            <div
                                key={bid.id}
                                className={`flex items-start gap-3 p-3 rounded-lg ${i === 0
                                        ? "bg-surface-dark border-r-4 border-primary"
                                        : "bg-transparent border-b border-slate-700/30 opacity-80"
                                    }`}
                            >
                                <div className="size-8 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-xs text-slate-400">
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <span className="text-sm font-bold text-white">{bid.bidder.name}</span>
                                        <span className="text-sm font-bold text-white">{bid.amount.toLocaleString()} ل.س</span>
                                    </div>
                                    <span className="text-xs text-slate-500">{formatTimeAgo(bid.createdAt)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Participation Footer */}
            {isLive && isAuthenticated && !isSeller && (
                <footer className="flex-none bg-surface-dark border-t border-slate-800 p-4 pb-8 fixed bottom-0 left-0 right-0 rounded-t-2xl z-30 shadow-2xl">
                    <div className="max-w-md mx-auto">
                        {!(auction as any).hasJoined ? (
                            <button
                                onClick={() => setIsJoinModalOpen(true)}
                                className="w-full h-14 bg-gradient-to-r from-primary to-orange-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition active:scale-95"
                            >
                                <span className="material-symbols-outlined">how_to_reg</span>
                                الاشتراك والمشاركة في المزاد
                            </button>
                        ) : (
                            <div>
                                <div className="flex gap-2 mb-4 overflow-x-auto justify-center no-scrollbar">
                                    {[100000, 500000, 1000000, 5000000].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => handleQuickBid(val)}
                                            className="shrink-0 h-8 px-4 rounded-full border border-slate-700 text-xs font-bold text-slate-300 hover:bg-primary/10 hover:border-primary hover:text-primary transition active:scale-95 shadow-sm"
                                        >
                                            +{(val / 1000).toFixed(0)}K
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(e.target.value.replace(/[^0-9]/g, ""))}
                                            placeholder="أدخل مبلغ المزايدة"
                                            className="w-full h-12 bg-surface-highlight border border-slate-600 rounded-lg px-3 text-center font-bold text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-inner"
                                        />
                                    </div>
                                    <button
                                        onClick={handlePlaceBid}
                                        disabled={isSubmitting || !bidAmount}
                                        className="h-12 px-8 bg-primary text-white rounded-lg font-bold text-base flex items-center justify-center gap-2 hover:bg-primary/90 transition active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/30"
                                    >
                                        {isSubmitting ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined !text-[20px]">gavel</span>
                                                زايد
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </footer>
            )}

            {!isAuthenticated && isLive && (
                <footer className="flex-none bg-surface-dark border-t border-slate-800 p-4 pb-8 fixed bottom-0 left-0 right-0 z-30">
                    <div className="max-w-md mx-auto text-center">
                        <p className="text-slate-400 mb-3">سجل دخولك للمشاركة في المزاد</p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold"
                        >
                            تسجيل الدخول
                        </Link>
                    </div>
                </footer>
            )}

            {/* Join Modal (Invoice & Agreements) */}
            {isJoinModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-surface-dark border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl">
                        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-surface-highlight">
                            <h3 className="text-lg font-bold text-white">فاتورة الاشتراك في المزاد</h3>
                            <button onClick={() => setIsJoinModalOpen(false)} className="size-8 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-400 transition">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto max-h-[80vh]">
                            {/* Invoice Breakdown */}
                            <div className="bg-surface-highlight rounded-xl p-4 mb-6 border border-slate-700">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 text-sm">تأمين المزاد (محجوز مسترد):</span>
                                        <span className="text-white font-bold">{auction.securityDeposit.toLocaleString()} ل.س</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 text-sm">رسوم المشاركة (غير مستردة):</span>
                                        <span className="text-white font-bold">{auction.entryFee.toLocaleString()} ل.س</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-700 pt-3">
                                        <span className="text-white font-bold">الإجمالي المقتطع من المحفظة:</span>
                                        <span className="text-primary font-bold text-lg">{(auction.securityDeposit + auction.entryFee).toLocaleString()} ل.س</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
                                    * ملاحظة: سيتم حجز مبلغ التأمين في محفظتك ولن تتمكن من سحبه حتى انتهاء المزاد أو براءة الذمة. رسوم المشاركة غير قابلة للاسترداد.
                                </p>
                            </div>

                            {/* Agreements Checkboxes */}
                            <div className="space-y-4 mb-8">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={agreements.hasInspectedGoods}
                                        onChange={(e) => setAgreements(prev => ({ ...prev, hasInspectedGoods: e.target.checked }))}
                                        className="mt-1 size-5 rounded border-slate-600 bg-surface-dark text-primary focus:ring-primary" 
                                    />
                                    <span className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition">
                                        أقر بأنني قمت بمعاينة البضائع شخصياً وأنها تطابق المواصفات المكتوبة.
                                    </span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={agreements.agreedToInvoice}
                                        onChange={(e) => setAgreements(prev => ({ ...prev, agreedToInvoice: e.target.checked }))}
                                        className="mt-1 size-5 rounded border-slate-600 bg-surface-dark text-primary focus:ring-primary" 
                                    />
                                    <span className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition">
                                        أوافق على تفاصيل الفاتورة أعلاه وأقر بصحة المبالغ المذكورة.
                                    </span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={agreements.agreedToTerms && agreements.agreedToPrivacy && agreements.agreedToCommission && agreements.agreedToDataSharing}
                                        onChange={(e) => setAgreements(prev => ({ 
                                            ...prev, 
                                            agreedToTerms: e.target.checked,
                                            agreedToPrivacy: e.target.checked,
                                            agreedToCommission: e.target.checked,
                                            agreedToDataSharing: e.target.checked
                                        }))}
                                        className="mt-1 size-5 rounded border-slate-600 bg-surface-dark text-primary focus:ring-primary" 
                                    />
                                    <span className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition font-bold">
                                        أوافق على شروط الخدمة، سياسة الخصوصية، وعمولة المنصة (1%).
                                    </span>
                                </label>
                            </div>

                            <button
                                onClick={handleJoinAuction}
                                disabled={isJoining || !Object.values(agreements).every(v => v)}
                                className="w-full h-12 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 transition active:scale-95"
                            >
                                {isJoining ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">payment</span>
                                        دفع وتأكيد الاشتراك
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
