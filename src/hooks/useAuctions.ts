import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface AuctionLot {
  id: string;
  lineNo: number;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  pricingUnit: string;
  startPrice: number;
  currentBestBid: number | null;
  depositMode: string;
  depositValue: number;
  status: string;
  winnerId?: string | null;
}

export interface Auction {
  id: string;
  title: string;
  category: string;
  weight: number;
  weightUnit: string;
  location: string;
  startingBid: number;
  currentBid?: number | null;
  buyNowPrice?: number | null;
  securityDeposit: number;
  entryFee: number;
  status: string;
  workflowStatus?: string;
  winnerSelectionMode?: string;
  duration: number;
  scheduledAt?: string;
  startedAt?: string;
  endsAt?: string;
  winnerId?: string | null;
  finalPrice?: number | null;
  createdAt: string;
  sellerId: string;
  seller?: { id: string; name: string; phone: string };
  images: { id: string; imageUrl: string }[];
  lots?: AuctionLot[];
  bidsCount: number;
  hasJoined?: boolean;
}

interface CreateAuctionData {
  title: string;
  category: string;
  weight: number;
  weightUnit?: string;
  location: string;
  startingBid: number;
  buyNowPrice?: number;
  duration?: number;
}

type JoinAuctionAgreements = {
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  agreedToCommission: boolean;
  agreedToDataSharing: boolean;
  hasInspectedGoods: boolean;
  agreedToInvoice: boolean;
};

interface UseAuctionsReturn {
  auctions: Auction[];
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; total: number; pages: number };
  fetchAuctions: (params?: {
    status?: string;
    category?: string;
    page?: number;
  }) => Promise<void>;
  fetchAuctionById: (id: string) => Promise<Auction | null>;
  createAuction: (auctionData: CreateAuctionData) => Promise<Auction | null>;
  placeBid: (auctionId: string, lotId: string, amount: number) => Promise<boolean>;
  joinAuction: (
    auctionId: string,
    agreements: JoinAuctionAgreements,
    lotIds?: string[]
  ) => Promise<{ success: boolean; message?: string }>;
  refresh: () => void;
}

export function useAuctions(): UseAuctionsReturn {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
  });

  const { token, user } = useAuth();

  const fetchAuctions = useCallback(
    async (params: { status?: string; category?: string; page?: number } = {}) => {
      try {
        setIsLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append("status", params.status);
        if (params.category) queryParams.append("category", params.category);
        if (params.page) queryParams.append("page", params.page.toString());

        const response = await fetch(`/api/auctions?${queryParams.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "فشل جلب المزادات");
        }

        setAuctions(data.auctions || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
        setError(errorMessage);
        setAuctions([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchAuctionById = useCallback(async (id: string): Promise<Auction | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/auctions/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل جلب المزاد");
      }

      return data.auction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAuction = useCallback(
    async (auctionData: CreateAuctionData): Promise<Auction | null> => {
      if (!user) {
        setError("يجب تسجيل الدخول لإنشاء مزاد");
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/auctions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...auctionData, sellerId: user.id }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "فشل إنشاء المزاد");
        }

        setAuctions((prev) => [data.auction, ...prev]);
        return data.auction;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [token, user]
  );

  const placeBid = useCallback(
    async (auctionId: string, lotId: string, amount: number): Promise<boolean> => {
      if (!user) {
        setError("يجب تسجيل الدخول للمزايدة");
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/auctions/${auctionId}/bid`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount, lotId, bidderId: user.id }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "فشل تقديم المزايدة");
        }

        setAuctions((prev) =>
          prev.map((auction) =>
            auction.id === auctionId
              ? {
                  ...auction,
                  currentBid: amount,
                  bidsCount: (auction.bidsCount || 0) + 1,
                  lots: auction.lots?.map((lot) =>
                    lot.id === lotId ? { ...lot, currentBestBid: amount } : lot
                  ),
                }
              : auction
          )
        );

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [token, user]
  );

  const joinAuction = useCallback(
    async (
      auctionId: string,
      agreements: JoinAuctionAgreements,
      lotIds?: string[]
    ): Promise<{ success: boolean; message?: string }> => {
      if (!user) {
        const message = "يجب تسجيل الدخول للمشاركة";
        setError(message);
        return { success: false, message };
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/auctions/${auctionId}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...agreements, lotIds }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "فشل الانضمام للمزاد");
        }

        return { success: true, message: data.message };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [token, user]
  );

  const refresh = useCallback(() => {
    void fetchAuctions();
  }, [fetchAuctions]);

  useEffect(() => {
    void fetchAuctions();
  }, [fetchAuctions]);

  return {
    auctions,
    isLoading,
    error,
    pagination,
    fetchAuctions,
    fetchAuctionById,
    createAuction,
    placeBid,
    joinAuction,
    refresh,
  };
}