import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Transaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "PAYMENT" | "REFUND";
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  method?: string;
  referenceNumber?: string;
  accountNumber?: string;
  createdAt: string;
}

interface DebtDetails {
  slug: string;
  balance: number;
  remainingDays: number;
  expiryDate: string;
}

interface LedgerHistory {
  id: string;
  amount: number;
  description: string;
  type: string;
  date: string;
  metadata?: {
    originalAmount?: number;
    isExempt?: boolean;
    supportType?: string;
    auctionId?: string;
  };
}

interface Wallet {
  id: string;
  userId: string;
  balanceSYP: number;
  balanceUSD: number;
  verifiedBalance: number;
  availableBalance: number;
  heldAmount: number;
  transactions: Transaction[]; // Kept for backward compat if needed
  history: LedgerHistory[];    // New ledger-based history
  debtDetails?: DebtDetails[] | null;
  isLocked?: boolean;
  lockReason?: string | null;
}

interface UseWalletReturn {
  wallet: Wallet | null;
  isLoading: boolean;
  error: string | null;
  deposit: (amount: number, method: string, referenceNumber: string) => Promise<boolean>;
  withdraw: (amount: number, method: string, accountNumber: string) => Promise<boolean>;
  refresh: () => void;
}

export function useWallet(): UseWalletReturn {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  const fetchWallet = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/wallet?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل جلب المحفظة");
      }

      setWallet(data.wallet);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const deposit = useCallback(async (
    amount: number,
    method: string,
    referenceNumber: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          amount,
          method,
          referenceNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل الإيداع");
      }

      await fetchWallet();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, user, fetchWallet]);

  const withdraw = useCallback(async (
    amount: number,
    method: string,
    accountNumber: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/wallet", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          amount,
          method,
          accountNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل السحب");
      }

      await fetchWallet();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, user, fetchWallet]);

  const refresh = useCallback(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user, fetchWallet]);

  return { wallet, isLoading, error, deposit, withdraw, refresh };
}
