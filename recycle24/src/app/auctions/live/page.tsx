"use client";

import { useState, useEffect } from "react";

import HeaderWithBack from "@/components/HeaderWithBack";

// Mock auction data
const auctionData = {
    id: "402",
    title: "دفعة نحاس أحمر - 20 طن",
    material: "نحاس أحمر",
    weight: "20,000 كغ",
    location: "حلب - المنطقة الصناعية",
    seller: "شركة النور للمعادن",
    sellerRating: 4.8,
    startPrice: 40000000,
    currentBid: 45200000,
    bidCount: 12,
    participants: 8,
    endTime: new Date(Date.now() + 15 * 60 * 1000),
    images: ["/auction1.jpg", "/auction2.jpg"],
};

// Mock bids
const initialBids = [
    { id: 1, amount: 45200000, bidder: "تاجر ٨٤٣", time: "منذ دقيقة", type: "bid" as const },
    { id: 2, amount: 45000000, bidder: "تاجر ١٢٥", time: "منذ 3 دقائق", type: "bid" as const },
    { id: 3, amount: 44800000, bidder: "تاجر ٦٧١", time: "منذ 5 دقائق", type: "bid" as const },
];

interface Bid {
    id: number;
    amount: number;
    bidder: string;
    time: string;
    type: "bid" | "system";
}

export default function LiveAuctionPage() {
    const [bids, setBids] = useState<Bid[]>(initialBids);
    const [currentBid, setCurrentBid] = useState(auctionData.currentBid);
    const [timeLeft, setTimeLeft] = useState({ minutes: 15, seconds: 0 });
    const [bidInput, setBidInput] = useState<string>("");
    const [isBidModalOpen, setIsBidModalOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const diff = auctionData.endTime.getTime() - now.getTime();
            
            if (diff <= 0) {
                setTimeLeft({ minutes: 0, seconds: 0 });
                clearInterval(timer);
            } else {
                const minutes = Math.floor(diff / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft({ minutes, seconds });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handlePlaceBid = () => {
        const bidAmount = parseInt(bidInput);
        if (bidAmount > currentBid) {
            const newBid: Bid = {
                id: bids.length + 1,
                amount: bidAmount,
                bidder: "أنت",
                time: "الآن",
                type: "bid",
            };
            setBids([newBid, ...bids]);
            setCurrentBid(bidAmount);
            setBidInput("");
            setIsBidModalOpen(false);
        }
    };

    const quickBidAmounts = [
        currentBid + 100000,
        currentBid + 500000,
        currentBid + 1000000,
    ];

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark font-display">
            <HeaderWithBack title={`مزاد #${auctionData.id}`} />

            {/* Live Indicator */}
            <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-red-400 font-bold text-sm">مباشر</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">
                            <span className="material-symbols-outlined !text-[16px]">person</span>
                            {auctionData.participants} مشارك
                        </span>
                        <span className="text-sm text-slate-400">
                            <span className="material-symbols-outlined !text-[16px]">gavel</span>
                            {auctionData.bidCount} مزايدة
                        </span>
                    </div>
                </div>
            </div>

            <main className="flex-1 pb-32">
                {/* Auction Image */}
                <div className="relative h-48 bg-slate-800">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-6xl text-slate-600">image</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-bg-dark to-transparent p-4">
                        <h1 className="text-xl font-bold text-white">{auctionData.title}</h1>
                        <p className="text-slate-300 text-sm">{auctionData.material} • {auctionData.weight}</p>
                    </div>
                </div>

                {/* Timer & Current Bid */}
                <div className="px-4 py-4">
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-center">
                                <div className="text-sm text-slate-400 mb-1">الوقت المتبقي</div>
                                <div className="text-3xl font-bold text-red-400 font-mono">
                                    {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-slate-400 mb-1">أعلى مزايدة</div>
                                <div className="text-3xl font-bold text-primary">
                                    {currentBid.toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500">ل.س</div>
                            </div>
                        </div>

                        {/* Quick Bid Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            {quickBidAmounts.map((amount, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setBidInput(amount.toString());
                                        setIsBidModalOpen(true);
                                    }}
                                    className="py-2 px-3 rounded-lg bg-primary/20 text-primary text-sm font-bold hover:bg-primary/30 transition-colors"
                                >
                                    +{(amount - currentBid).toLocaleString()}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setIsBidModalOpen(true)}
                            className="w-full mt-3 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors"
                        >
                            مزايدة
                        </button>
                    </div>

                    {/* Seller Info */}
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-bold text-xl">
                                    {auctionData.seller.charAt(0)}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white">{auctionData.seller}</h3>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-yellow-400">★ {auctionData.sellerRating}</span>
                                    <span className="text-slate-400">|</span>
                                    <span className="text-slate-400">{auctionData.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bids History */}
                    <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700">
                        <h3 className="font-bold text-white mb-4">سجل المزايدات</h3>
                        <div className="space-y-3">
                            {bids.map((bid) => (
                                <div key={bid.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                            <span className="text-slate-300 text-sm">
                                                {bid.bidder.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{bid.bidder}</div>
                                            <div className="text-xs text-slate-400">{bid.time}</div>
                                        </div>
                                    </div>
                                    <div className="text-primary font-bold">
                                        {bid.amount.toLocaleString()} ل.س
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Bid Modal */}
            {isBidModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
                    <div className="w-full bg-surface-dark rounded-t-2xl p-4 animate-slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">تقديم مزايدة</h2>
                            <button
                                onClick={() => setIsBidModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700 mb-4">
                            <div className="text-sm text-slate-400 mb-1">المزايدة الحالية</div>
                            <div className="text-2xl font-bold text-white">{currentBid.toLocaleString()} ل.س</div>
                        </div>

                        <div className="bg-surface-highlight rounded-xl p-4 border border-slate-700 mb-4">
                            <label className="block text-sm text-slate-400 mb-2">مزايدتك</label>
                            <input
                                type="number"
                                value={bidInput}
                                onChange={(e) => setBidInput(e.target.value)}
                                placeholder="أدخل المبلغ..."
                                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg text-center focus:border-primary focus:outline-none transition-colors"
                            />
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                الحد الأدنى للمزايدة: {(currentBid + 100000).toLocaleString()} ل.س
                            </p>
                        </div>

                        <button
                            onClick={handlePlaceBid}
                            disabled={!bidInput || parseInt(bidInput) <= currentBid}
                            className={`w-full py-4 rounded-xl font-bold text-lg ${
                                bidInput && parseInt(bidInput) > currentBid
                                    ? "bg-primary text-white hover:bg-primary-dark"
                                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                            }`}
                        >
                            تأكيد المزايدة
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
