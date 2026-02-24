import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface Auction {
  id: string;
  title: string;
  category: string;
  weight: number;
  weightUnit: string;
  location: string;
  startingBid: number;
  currentBid?: number;
  buyNowPrice?: number;
  securityDeposit: number;
  entryFee: number;
  status: string;
  duration: number;
  scheduledAt?: string;
  startedAt?: string;
  endsAt?: string;
  winnerId?: string;
  finalPrice?: number;
  createdAt: string;
  sellerId: string;
  seller?: { id: string; name: string; phone: string };
  images?: Array<{ id: string; imageUrl: string; order: number }>;
  bidsCount?: number;
  hasJoined?: boolean; // New field to track if current user joined
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

interface UseAuctionsReturn {
  auctions: Auction[];
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; total: number; pages: number };
  fetchAuctions: (params?: { status?: string; category?: string; page?: number }) => Promise<void>;
  fetchAuctionById: (id: string) => Promise<Auction | null>;
  createAuction: (auctionData: CreateAuctionData) => Promise<Auction | null>;
  placeBid: (auctionId: string, amount: number) => Promise<boolean>;
  joinAuction: (auctionId: string) => Promise<{ success: boolean; message?: string }>;
  refresh: () => void;
}

export function useAuctions(): UseAuctionsReturn {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const { token, user } = useAuth();

  const fetchAuctions = useCallback(async (params: { status?: string; category?: string; page?: number } = {}) => {
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
  }, []);

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

  const createAuction = useCallback(async (auctionData: CreateAuctionData): Promise<Auction | null> => {
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
  }, [token, user]);

  const placeBid = useCallback(async (auctionId: string, amount: number): Promise<boolean> => {
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
        body: JSON.stringify({ amount, bidderId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل تقديم المزايدة");
      }

      // تحديث المزاد في القائمة
      setAuctions((prev) =>
        prev.map((a) =>
          a.id === auctionId ? { ...a, currentBid: amount, bidsCount: (a.bidsCount || 0) + 1 } : a
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
  }, [token, user]);

  const joinAuction = useCallback(async (auctionId: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      setError("يجب تسجيل الدخول للمشاركة");
      return { success: false, message: "يجب تسجيل الدخول للمشاركة" };
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/auctions/${auctionId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
  }, [user]);

  const refresh = useCallback(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  useEffect(() => {
    fetchAuctions();
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
    refresh 
  };
}
