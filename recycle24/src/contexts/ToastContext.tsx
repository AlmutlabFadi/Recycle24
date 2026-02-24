"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from "react";
import { Gender, getTitleDisplay } from "@/lib/title-system";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  titleId?: string;
  gender?: Gender;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: Toast["type"], duration?: number, options?: { titleId?: string; gender?: Gender }) => void;
  addSmartToast: (messageKey: string, type: Toast["type"], options?: { name?: string; titleId?: string; gender?: Gender; data?: Record<string, string | number> }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const SMART_MESSAGES: Record<string, { male: string; female: string }> = {
  welcome: {
    male: "مرحباً بك يا {}",
    female: "مرحبتاً بكِ يا {}",
  },
  welcome_back: {
    male: "أهلاً بعودتك يا {}",
    female: "أهلاً بعودتكِ يا {}",
  },
  order_placed: {
    male: "تم تقديم طلبك يا {}",
    female: "تم تقديم طلبك يا {}",
  },
  order_confirmed: {
    male: "تم تأكيد طلبك يا {}",
    female: "تم تأكيد طلبك يا {}",
  },
  payment_success: {
    male: "تم الدفع بنجاح يا {}",
    female: "تم الدفع بنجاح يا {}",
  },
  auction_won: {
    male: "فزت بالمزاد يا {}!",
    female: "فزت بالمزاد يا {}!",
  },
  verification_approved: {
    male: "مبارك! تم توثيق حسابك يا {}",
    female: "مبارك! تم توثيق حسابك يا {}",
  },
  points_earned: {
    male: "لديك {} نقاط جديدة يا {}",
    female: "لديك {} نقاط جديدة يا {}",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastsRef = useRef(toasts);
  
  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: Toast["type"], duration = 5000, options?: { titleId?: string; gender?: Gender }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, duration, ...options };
    
    setToasts((prev) => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const addSmartToast = useCallback((messageKey: string, type: Toast["type"], options?: { name?: string; titleId?: string; gender?: Gender; data?: Record<string, string | number> }) => {
    const template = SMART_MESSAGES[messageKey];
    const gender = (options?.gender === 'female' ? 'female' : 'male');
    
    if (!template) {
      addToast(messageKey, type);
      return;
    }

    let message = template[gender];
    
    if (options?.titleId) {
      const titleDisplay = getTitleDisplay(options.titleId, gender);
      const nameWithTitle = titleDisplay ? `${titleDisplay} ${options.name || ''}` : (options.name || '');
      message = message.replace('{}', nameWithTitle.trim());
    } else if (options?.name) {
      message = message.replace('{}', options.name);
    }

    if (options?.data) {
      Object.entries(options.data).forEach(([key, value]) => {
        message = message.replace(key, String(value));
      });
    }

    addToast(message, type);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, addSmartToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-xl shadow-lg animate-slide-down ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : toast.type === "error"
                ? "bg-red-500 text-white"
                : toast.type === "warning"
                ? "bg-yellow-500 text-black"
                : "bg-blue-500 text-white"
            }`}
          >
            <span className="material-symbols-outlined">
              {toast.type === "success"
                ? "check_circle"
                : toast.type === "error"
                ? "error"
                : toast.type === "warning"
                ? "warning"
                : "info"}
            </span>
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-70 hover:opacity-100"
            >
              <span className="material-symbols-outlined !text-[18px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
