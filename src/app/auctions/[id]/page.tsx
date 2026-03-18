"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useAuctions, Auction, AuctionLot } from "@/hooks/useAuctions";

interface Bid {
  id: string;
  amount: number;
  bidder: { id: string; name: string };
  createdAt: string;
}

type AgreementsState = {
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  agreedToCommission: boolean;
  agreedToDataSharing: boolean;
  hasInspectedGoods: boolean;
  agreedToInvoice: boolean;
};

function resolveCurrentBidValue(
  auction: Auction | null,
  lot: AuctionLot | null
): number {
  if (lot) {
    return lot.currentBestBid ?? lot.startPrice ?? 0;
  }

  if (!auction) {
    return 0;
  }

  return auction.currentBid ?? auction.startingBid ?? 0;
}

function computeLotDeposit(lot: AuctionLot | null): number {
  if (!lot) return 0;

  if (lot.depositMode === "PERCENTAGE") {
    return Math.round(((lot.startPrice || 0) * (lot.depositValue || 0)) / 100);
  }

  if (lot.depositMode === "FIXED") {
    return Number(lot.depositValue || 0);
  }

  return 0;
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
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [agreements, setAgreements] = useState<AgreementsState>({
    agreedToTerms: false,
    agreedToPrivacy: false,
    agreedToCommission: false,
    agreedToDataSharing: false,
    hasInspectedGoods: false,
    agreedToInvoice: false,
  });
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const currentLot = useMemo(() => {
    return auction?.lots?.find((lot) => lot.id === selectedLotId) ?? null;
  }, [auction?.lots, selectedLotId]);

  const selectedLots = useMemo(() => {
    return (auction?.lots || []).filter((lot) => selectedLotIds.includes(lot.id));
  }, [auction?.lots, selectedLotIds]);

  const totalSelectedDeposit = useMemo(() => {
    return selectedLots.reduce((sum, lot) => sum + computeLotDeposit(lot), 0);
  }, [selectedLots]);

  const fetchAuctionData = useCallback(async () => {
    setIsLoading(true);

    try {
      const auctionData = await fetchAuctionById(auctionId);

      if (auctionData) {
        setAuction(auctionData);

        const firstLot = auctionData.lots?.[0] ?? null;
        if (firstLot) {
          setSelectedLotId((prev) => prev ?? firstLot.id);
          setSelectedLotIds((prev) => (prev.length > 0 ? prev : [firstLot.id]));
          const current = firstLot.currentBestBid ?? firstLot.startPrice ?? 0;
          setBidAmount(String(current + 100000));
        } else {
          const current = auctionData.currentBid ?? auctionData.startingBid ?? 0;
          setBidAmount(String(current + 100000));
        }
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
    void fetchAuctionData();
  }, [fetchAuctionData]);

  useEffect(() => {
    if (!auction?.endsAt) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(auction.endsAt as string);
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
    const interval = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(interval);
  }, [auction?.endsAt]);

  const handleQuickBid = (amount: number) => {
    const currentBidValue = resolveCurrentBidValue(auction, currentLot);
    setBidAmount(String(currentBidValue + amount));
  };

  const handlePlaceBid = async () => {
    if (!isAuthenticated) {
      addToast("يجب تسجيل الدخول للمزايدة", "error");
      return;
    }

    if (!currentLot) {
      addToast("يرجى اختيار مادة للمزايدة", "error");
      return;
    }

    if (!bidAmount || Number.isNaN(Number.parseInt(bidAmount, 10))) {
      addToast("يرجى إدخال مبلغ صحيح", "error");
      return;
    }

    const currentBidValue = currentLot.currentBestBid ?? currentLot.startPrice ?? 0;
    const parsedBidAmount = Number.parseInt(bidAmount, 10);

    if (parsedBidAmount <= currentBidValue) {
      addToast(
        `يجب أن تكون المزايدة أعلى من ${currentBidValue.toLocaleString()} ل.س`,
        "error"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await placeBid(auctionId, currentLot.id, parsedBidAmount);

      if (success) {
        addToast("تم تقديم المزايدة بنجاح", "success");
        await fetchAuctionData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinAuction = async () => {
    if (!Object.values(agreements).every(Boolean)) {
      addToast("يرجى الموافقة على جميع الشروط والإقرارات", "error");
      return;
    }

    if (selectedLotIds.length === 0) {
      addToast("يرجى اختيار مادة واحدة على الأقل", "error");
      return;
    }

    setIsJoining(true);

    try {
      const result = await joinAuction(auctionId, agreements, selectedLotIds);

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

  const handleDischarge = async (targetUserId?: string) => {
    if (!confirm("هل أنت متأكد من براءة ذمة المشتري وتحرير مبلغ التأمين له؟")) {
      return;
    }

    setIsDischarging(true);

    try {
      const response = await fetch(`/api/auctions/${auctionId}/discharge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
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
      <div className="flex min-h-screen flex-col bg-bg-dark">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <span className="mx-auto mb-4 block h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <p className="text-slate-400">جارٍ تحميل المزاد...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="flex min-h-screen flex-col bg-bg-dark">
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-bg-dark p-4">
          <Link
            href="/auctions"
            className="flex size-10 items-center justify-center rounded-full transition hover:bg-surface-highlight"
          >
            <span className="material-symbols-outlined text-white">arrow_forward</span>
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <span className="material-symbols-outlined mb-4 text-6xl text-slate-600">
              error
            </span>
            <h2 className="mb-2 text-xl font-bold text-white">المزاد غير موجود</h2>
            <Link href="/auctions" className="font-bold text-primary">
              العودة إلى المزادات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isLive = auction.status === "LIVE";
  const currentBidValue = resolveCurrentBidValue(auction, currentLot);
  const isSeller = user?.id === auction.sellerId;

  return (
    <div className="flex min-h-screen flex-col bg-bg-dark font-display">
      <header
        className={`sticky top-0 z-20 flex items-center justify-between border-b px-4 pb-4 pt-4 ${
          isLive
            ? "border-red-500/20 bg-[#1a0f0f]"
            : "border-slate-800 bg-surface-dark"
        }`}
      >
        <Link
          href="/auctions"
          className="flex size-10 items-center justify-center rounded-full transition hover:bg-surface-highlight"
        >
          <span className="material-symbols-outlined text-white">arrow_forward</span>
        </Link>

        <div className="flex flex-col items-center">
          <h1 className="text-base font-bold text-white">{auction.title}</h1>
          {isLive && (
            <div className="mt-1 flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              <span>مباشر</span>
            </div>
          )}
        </div>

        <button className="flex size-10 items-center justify-center rounded-full transition hover:bg-surface-highlight">
          <span className="material-symbols-outlined text-white">share</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-48">
        {isLive && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
              الوقت المتبقي
            </p>

            <div className="dir-ltr flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-surface-dark">
                  <span className="text-3xl font-bold text-white">
                    {String(timeRemaining.hours).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">ساعة</span>
              </div>

              <span className="text-2xl font-bold text-slate-600">:</span>

              <div className="flex flex-col items-center gap-1">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-surface-dark">
                  <span className="text-3xl font-bold text-white">
                    {String(timeRemaining.minutes).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">دقيقة</span>
              </div>

              <span className="text-2xl font-bold text-slate-600">:</span>

              <div className="flex flex-col items-center gap-1">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-red-500/50 bg-surface-dark ring-1 ring-red-500/30">
                  <span className="text-3xl font-bold text-red-500">
                    {String(timeRemaining.seconds).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-red-500">ثانية</span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 px-4">
          <div className="rounded-xl border border-slate-700 bg-surface-dark p-5">
            <span className="text-sm font-medium text-slate-400">
              أعلى مزايدة حالية {currentLot?.title ? `· ${currentLot.title}` : ""}
            </span>

            <div className="mt-1 flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold text-white">
                {currentBidValue.toLocaleString()}
              </span>
              <span className="text-lg font-bold text-primary">ل.س</span>
            </div>

            {bids[0] && (
              <div className="mt-3 flex items-center justify-center gap-2 border-t border-slate-800 pt-3">
                <div className="flex size-6 items-center justify-center rounded-full bg-slate-700 text-slate-400">
                  <span className="material-symbols-outlined !text-[14px]">person</span>
                </div>
                <span className="text-sm font-medium text-slate-300">
                  {bids[0].bidder.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {isSeller && auction.workflowStatus === "AWAITING_PAYMENT_PROOF" && (
          <div className="mb-6 px-4">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 text-center shadow-lg">
              <h3 className="mb-2 font-bold text-primary">إجراءات البائع</h3>
              <p className="mb-4 text-sm leading-relaxed text-slate-300">
                المزاد انتهى وتم تحديد الفائزين. اضغط على براءة الذمة لكل مشترٍ بعد
                استلام كامل المبلغ وترحيل البضائع لتحرير تأمين المشتري.
              </p>

              {auction.winnerSelectionMode === "PER_LOT" &&
              Array.isArray(auction.lots) &&
              auction.lots.some((lot) => lot.winnerId) ? (
                <div className="space-y-3">
                  {Array.from(
                    new Set(
                      auction.lots
                        .map((lot) => lot.winnerId)
                        .filter((winnerId): winnerId is string => Boolean(winnerId))
                    )
                  ).map((winnerId) => {
                    const winnerLotTitles = auction.lots
                      ?.filter((lot) => lot.winnerId === winnerId)
                      .map((lot) => lot.title)
                      .join("، ");

                    return (
                      <div
                        key={winnerId}
                        className="rounded-lg border border-slate-700/50 bg-surface-dark p-3 text-right"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            فاز بـ: {winnerLotTitles}
                          </span>
                          <span className="text-sm font-bold text-white">
                            المشتري #{winnerId.slice(-4)}
                          </span>
                        </div>

                        <button
                          onClick={() => void handleDischarge(winnerId)}
                          disabled={isDischarging}
                          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/20 text-sm font-bold text-primary transition hover:bg-primary/30 disabled:opacity-50"
                        >
                          {isDischarging ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">
                                verified
                              </span>
                              براءة ذمة
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <button
                  onClick={() => void handleDischarge()}
                  disabled={isDischarging}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-bold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {isDischarging ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined">verified</span>
                      براءة ذمة (تحرير التأمين)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mb-6 px-4">
          <div className="rounded-xl border border-slate-700 bg-surface-highlight p-4">
            <h3 className="mb-4 border-b border-slate-700 pb-2 font-bold text-white">
              تفاصيل المزاد
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">التأمين المطلوب:</span>
                <span className="font-bold text-orange-400">
                  {(auction.securityDeposit || 0).toLocaleString()} ل.س
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">رسوم المشاركة:</span>
                <span className="font-bold text-red-400">
                  {(auction.entryFee || 0).toLocaleString()} ل.س
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">المادة:</span>
                <span className="text-white">{auction.category}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">الوزن:</span>
                <span className="text-white">
                  {auction.weight} {auction.weightUnit}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">الموقع:</span>
                <span className="text-white">{auction.location}</span>
              </div>

              <div className="mt-2 flex justify-between border-t border-slate-700/50 pt-2">
                <span className="text-slate-400">الحالة:</span>
                <span className="font-bold text-primary">{auction.status}</span>
              </div>
            </div>

            {Array.isArray(auction.lots) && auction.lots.length > 0 && (
              <div className="mt-5 border-t border-slate-700/50 pt-4">
                <h4 className="mb-3 text-sm font-bold text-slate-300">مواد المزاد</h4>

                <div className="grid gap-3">
                  {auction.lots.map((lot) => (
                    <div
                      key={lot.id}
                      className="rounded-xl border border-slate-800 bg-surface-dark p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{lot.title}</p>
                          <p className="text-xs text-slate-500">
                            {lot.quantity} {lot.unit}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] ${
                            lot.status === "OPEN"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-slate-500/10 text-slate-400"
                          }`}
                        >
                          {lot.status}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div>
                          <span>سعر البداية:</span>
                          <span className="ml-1 font-bold text-white">
                            {lot.startPrice?.toLocaleString()} ل.س
                          </span>
                        </div>

                        <div>
                          <span>السعر الحالي:</span>
                          <span className="ml-1 font-bold text-white">
                            {(lot.currentBestBid ?? lot.startPrice ?? 0).toLocaleString()} ل.س
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky top-0 z-10 flex items-center justify-between bg-bg-dark/90 px-4 py-3 pb-2 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white">النشاط الأخير</h3>
          <span className="text-xs text-slate-500">{bids.length} مزايدات</span>
        </div>

        <div className="flex flex-col gap-3 px-4 pb-6">
          {bids.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 py-8 text-center text-slate-500">
              <span className="material-symbols-outlined mb-2 text-4xl opacity-20">
                gavel
              </span>
              <p>لا توجد مزايدات بعد</p>
            </div>
          ) : (
            bids.map((bid, index) => (
              <div
                key={bid.id}
                className={`flex items-start gap-3 rounded-lg p-3 ${
                  index === 0
                    ? "border-r-4 border-primary bg-surface-dark"
                    : "border-b border-slate-700/30 bg-transparent opacity-80"
                }`}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-400">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-bold text-white">
                      {bid.bidder.name}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {bid.amount.toLocaleString()} ل.س
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatTimeAgo(bid.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {isLive && isAuthenticated && !isSeller && (
        <footer className="fixed bottom-0 left-0 right-0 z-30 flex-none rounded-t-2xl border-t border-slate-800 bg-surface-dark p-4 pb-8 shadow-2xl">
          <div className="mx-auto max-w-md">
            {!auction.hasJoined ? (
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-orange-600 text-lg font-bold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.02] active:scale-95"
              >
                <span className="material-symbols-outlined">how_to_reg</span>
                الاشتراك والمشاركة في المزاد
              </button>
            ) : (
              <div>
                {Array.isArray(auction.lots) && auction.lots.length > 0 && (
                  <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
                    {auction.lots.map((lot) => (
                      <button
                        key={lot.id}
                        onClick={() => {
                          setSelectedLotId(lot.id);
                          const current = lot.currentBestBid ?? lot.startPrice ?? 0;
                          setBidAmount(String(current + 100000));
                        }}
                        className={`shrink-0 rounded-xl border px-3 py-2 text-[11px] font-bold transition ${
                          selectedLotId === lot.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-700 text-slate-300 hover:border-primary/40"
                        }`}
                      >
                        {lot.title}
                        <span className="block text-[10px] text-slate-500">
                          {(lot.currentBestBid ?? lot.startPrice ?? 0).toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="no-scrollbar mb-4 flex justify-center gap-2 overflow-x-auto">
                  {[100000, 500000, 1000000, 5000000].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleQuickBid(value)}
                      className="h-8 shrink-0 rounded-full border border-slate-700 px-4 text-xs font-bold text-slate-300 shadow-sm transition hover:border-primary hover:bg-primary/10 hover:text-primary active:scale-95"
                    >
                      +{(value / 1000).toFixed(0)}K
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={bidAmount}
                      onChange={(e) =>
                        setBidAmount(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      placeholder="أدخل مبلغ المزايدة"
                      className="h-12 w-full rounded-lg border border-slate-600 bg-surface-highlight px-3 text-center font-bold text-white shadow-inner outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    onClick={() => void handlePlaceBid()}
                    disabled={isSubmitting || !bidAmount}
                    className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined !text-[20px]">
                          gavel
                        </span>
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
        <footer className="fixed bottom-0 left-0 right-0 z-30 flex-none border-t border-slate-800 bg-surface-dark p-4 pb-8">
          <div className="mx-auto max-w-md text-center">
            <p className="mb-3 text-slate-400">سجل دخولك للمشاركة في المزاد</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white"
            >
              تسجيل الدخول
            </Link>
          </div>
        </footer>
      )}

      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-surface-dark shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 bg-surface-highlight p-5">
              <h3 className="text-lg font-bold text-white">فاتورة الاشتراك في المزاد</h3>
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-6">
              {Array.isArray(auction.lots) && auction.lots.length > 0 && (
                <div className="mb-5">
                  <p className="mb-3 text-sm font-bold text-slate-300">
                    اختر المواد التي تريد المشاركة بها
                  </p>

                  <div className="space-y-2">
                    {auction.lots.map((lot) => {
                      const checked = selectedLotIds.includes(lot.id);

                      return (
                        <label
                          key={lot.id}
                          className="flex items-center justify-between rounded-xl border border-slate-700 bg-surface-highlight p-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-white">{lot.title}</p>
                            <p className="text-xs text-slate-400">
                              {lot.quantity} {lot.unit} · {lot.startPrice?.toLocaleString()} ل.س
                            </p>
                          </div>

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedLotIds((prev) =>
                                checked
                                  ? prev.filter((id) => id !== lot.id)
                                  : [...prev, lot.id]
                              );
                            }}
                            className="size-4 accent-primary"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-6 rounded-xl border border-slate-700 bg-surface-highlight p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">
                      تأمين المواد المختارة (محجوز مسترد):
                    </span>
                    <span className="font-bold text-white">
                      {totalSelectedDeposit.toLocaleString()} ل.س
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">
                      رسوم المشاركة (غير مستردة):
                    </span>
                    <span className="font-bold text-white">
                      {(auction.entryFee || 0).toLocaleString()} ل.س
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-slate-700 pt-3">
                    <span className="font-bold text-white">
                      الإجمالي المقتطع من المحفظة:
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {(totalSelectedDeposit + (auction.entryFee || 0)).toLocaleString()} ل.س
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-[10px] leading-relaxed text-slate-500">
                  سيتم حجز مبلغ التأمين في محفظتك ولن تتمكن من سحبه حتى انتهاء
                  المزاد أو براءة الذمة. رسوم المشاركة غير قابلة للاسترداد.
                </p>
              </div>

              <div className="mb-8 space-y-4">
                <label className="group flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreements.hasInspectedGoods}
                    onChange={(e) =>
                      setAgreements((prev) => ({
                        ...prev,
                        hasInspectedGoods: e.target.checked,
                      }))
                    }
                    className="mt-1 size-5 rounded border-slate-600 bg-surface-dark text-primary focus:ring-primary"
                  />
                  <span className="text-sm leading-relaxed text-slate-300 transition group-hover:text-white">
                    أقر بأنني قمت بمعاينة البضائع شخصيًا وأنها تطابق المواصفات المكتوبة.
                  </span>
                </label>

                <label className="group flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreements.agreedToInvoice}
                    onChange={(e) =>
                      setAgreements((prev) => ({
                        ...prev,
                        agreedToInvoice: e.target.checked,
                      }))
                    }
                    className="mt-1 size-5 rounded border-slate-600 bg-surface-dark text-primary focus:ring-primary"
                  />
                  <span className="text-sm leading-relaxed text-slate-300 transition group-hover:text-white">
                    أوافق على تفاصيل الفاتورة أعلاه وأقر بصحة المبالغ المذكورة.
                  </span>
                </label>

                <label className="group flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={
                      agreements.agreedToTerms &&
                      agreements.agreedToPrivacy &&
                      agreements.agreedToCommission &&
                      agreements.agreedToDataSharing
                    }
                    onChange={(e) =>
                      setAgreements((prev) => ({
                        ...prev,
                        agreedToTerms: e.target.checked,
                        agreedToPrivacy: e.target.checked,
                        agreedToCommission: e.target.checked,
                        agreedToDataSharing: e.target.checked,
                      }))
                    }
                    className="mt-1 size-5 rounded border-slate-600 bg-surface-dark text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-bold leading-relaxed text-slate-300 transition group-hover:text-white">
                    أوافق على شروط الخدمة، سياسة الخصوصية، وعمولة المنصة.
                  </span>
                </label>
              </div>

              <button
                onClick={() => void handleJoinAuction()}
                disabled={isJoining || !Object.values(agreements).every(Boolean)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-lg shadow-primary/20 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-primary/90"
              >
                {isJoining ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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