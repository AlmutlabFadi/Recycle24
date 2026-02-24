import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Deal {
  id: string;
  dealNumber: string;
  material: string;
  weight: string;
  price: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  sellerId: string;
  buyerId: string;
  seller?: { id: string; name: string; phone: string };
  buyer?: { id: string; name: string; phone: string };
  createdAt: string;
}

interface UseDealsReturn {
  deals: Deal[];
  isLoading: boolean;
  error: string | null;
  fetchDeals: (params?: { status?: string; page?: number }) => Promise<void>;
  createDeal: (dealData: Partial<Deal>) => Promise<Deal | null>;
  updateDeal: (dealId: string, updates: Partial<Deal>) => Promise<boolean>;
  refresh: () => void;
}

export function useDeals(): UseDealsReturn {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  const fetchDeals = useCallback(async (params: { status?: string; page?: number } = {}) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append("userId", user.id);
      if (params.status) queryParams.append("status", params.status);
      if (params.page) queryParams.append("page", params.page.toString());

      const response = await fetch(`/api/deals?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل جلب الصفقات");
      }

      setDeals(data.deals);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const createDeal = useCallback(async (dealData: Partial<Deal>): Promise<Deal | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dealData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل إنشاء الصفقة");
      }

      setDeals((prev) => [data.deal, ...prev]);
      return data.deal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const updateDeal = useCallback(async (dealId: string, updates: Partial<Deal>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/deals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dealId, ...updates }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل تحديث الصفقة");
      }

      setDeals((prev) =>
        prev.map((deal) => (deal.id === dealId ? { ...deal, ...updates } : deal))
      );

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const refresh = useCallback(() => {
    fetchDeals();
  }, [fetchDeals]);

  // جلب الصفقات عند تحميل المكون
  useEffect(() => {
    if (user) {
      fetchDeals();
    }
  }, [user, fetchDeals]);

  return { deals, isLoading, error, fetchDeals, createDeal, updateDeal, refresh };
}
