"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/contexts/ToastContext";

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<void>;
  expiresInSeconds: number;
}

export default function OTPModal({ isOpen, onClose, onSubmit, expiresInSeconds }: OTPModalProps) {
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(expiresInSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setTimeLeft(expiresInSeconds);
      
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, expiresInSeconds]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      addToast("الرمز يجب أن يتكون من 6 أرقام", "error");
      return;
    }
    if (timeLeft <= 0) {
      addToast("انتهت صلاحية الرمز. يرجى إعادة المحاولة لإرسال رمز جديد.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(code);
    } finally {
      setIsSubmitting(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface border border-slate-700 p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">التحقق بخطوتين (OTP)</h2>
          <p className="text-sm text-slate-300">
            تم إرسال رمز تحقق من 6 أرقام إلى بريدك الإلكتروني. هذا الرمز صالح لعملية واحدة فقط.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono text-white transition-colors focus:border-primary focus:outline-none"
              disabled={isExpired || isSubmitting}
              autoFocus
            />
          </div>

          <div className="flex justify-center items-center">
            {isExpired ? (
              <span className="text-red-400 font-bold text-sm">انتهت الصلاحية</span>
            ) : (
              <span className={`text-lg font-mono font-bold ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-primary'}`}>
                {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isExpired || isSubmitting || code.length !== 6}
            className={`w-full rounded-xl py-3 font-bold text-white transition-all ${
              isExpired || isSubmitting || code.length !== 6
                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark"
            }`}
          >
            {isSubmitting ? "جاري التحقق..." : "تأكيد العملية"}
          </button>
        </form>
      </div>
    </div>
  );
}
