import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface UseApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

interface UseApiReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (url: string, options?: UseApiOptions) => Promise<void>;
  reset: () => void;
}

export function useApi<T = unknown>(): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, logout } = useAuth();

  const execute = useCallback(async (url: string, options: UseApiOptions = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      // إضافة token إذا كان موجوداً
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        // إذا كان الخطأ 401، قم بتسجيل الخروج
        if (response.status === 401) {
          logout();
          throw new Error("انتهت جلستك، يرجى تسجيل الدخول مرة أخرى");
        }
        throw new Error(result.error || "حدث خطأ");
      }

      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير معروف";
      setError(errorMessage);
      console.error("API Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, isLoading, error, execute, reset };
}

// Hook مخصص للـ GET
export function useGet<T = unknown>(url: string) {
  const { data, isLoading, error, execute } = useApi<T>();

  const fetch = useCallback(() => {
    execute(url, { method: "GET" });
  }, [execute, url]);

  return { data, isLoading, error, fetch };
}

// Hook مخصص للـ POST
export function usePost<T = unknown>() {
  const { data, isLoading, error, execute } = useApi<T>();

  const post = useCallback((url: string, body: unknown) => {
    execute(url, { method: "POST", body });
  }, [execute]);

  return { data, isLoading, error, post };
}

// Hook مخصص للـ PUT
export function usePut<T = unknown>() {
  const { data, isLoading, error, execute } = useApi<T>();

  const put = useCallback((url: string, body: unknown) => {
    execute(url, { method: "PUT", body });
  }, [execute]);

  return { data, isLoading, error, put };
}

// Hook مخصص للـ PATCH
export function usePatch<T = unknown>() {
  const { data, isLoading, error, execute } = useApi<T>();

  const patch = useCallback((url: string, body: unknown) => {
    execute(url, { method: "PATCH", body });
  }, [execute]);

  return { data, isLoading, error, patch };
}

// Hook مخصص للـ DELETE
export function useDelete<T = unknown>() {
  const { data, isLoading, error, execute } = useApi<T>();

  const del = useCallback((url: string) => {
    execute(url, { method: "DELETE" });
  }, [execute]);

  return { data, isLoading, error, del };
}
