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
  verifiedBalanceSYP: number;
  availableBalanceSYP: number;
  heldAmountSYP: number;
  verifiedBalanceUSD: number;
  availableBalanceUSD: number;
  heldAmountUSD: number;
  transactions: Transaction[];
  history: LedgerHistory[];
  debtDetails?: DebtDetails[] | null;
  isLocked?: boolean;
  lockReason?: string | null;
}

interface UseWalletReturn {
  wallet: Wallet | null;
  isLoading: boolean;
  error: string | null;
  deposit: (
    amount: number,
    method: string,
    referenceNumber: string
  ) => Promise<boolean>;
  withdraw: (
    amount: number,
    method: string,
    accountNumber: string
  ) => Promise<boolean>;
  refresh: () => void;
}

export function useWallet(): UseWalletReturn {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  const fetchWallet = useCallback(async () => {
    if (!user) {
      return;
    }

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
        throw new Error(data.error || "Failed to fetch wallet");
      }

      setWallet(data.wallet);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown wallet error";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  const deposit = useCallback(
    async (
      amount: number,
      method: string,
      referenceNumber: string
    ): Promise<boolean> => {
      if (!user) {
        return false;
      }

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
            amount,
            method,
            proofUrl: referenceNumber,
            currency: "SYP",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create deposit request");
        }

        await fetchWallet();
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown deposit error";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [token, user, fetchWallet]
  );

  const withdraw = useCallback(
    async (
      amount: number,
      method: string,
      accountNumber: string
    ): Promise<boolean> => {
      if (!user) {
        return false;
      }

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
            amount,
            method,
            destination: accountNumber,
            currency: "SYP",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create payout request");
        }

        await fetchWallet();
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown withdrawal error";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [token, user, fetchWallet]
  );

  const refresh = useCallback(() => {
    void fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (user) {
      void fetchWallet();
    }
  }, [user, fetchWallet]);

  return {
    wallet,
    isLoading,
    error,
    deposit,
    withdraw,
    refresh,
  };
}