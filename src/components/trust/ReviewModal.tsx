"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewerId: string;
  revieweeId: string;
  revieweeName: string;
  dealId?: string;
  onSuccess?: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  reviewerId,
  revieweeId,
  revieweeName,
  dealId,
  onSuccess
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            reviewerId,
            revieweeId,
            dealId,
            rating,
            comment
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إرسال التقييم");

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "فشل إرسال التقييم";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-display">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface-dark border border-slate-700 rounded-2xl p-6 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-white mb-2">تقييم المتعامل</h3>
            <p className="text-sm text-slate-400">
              كيف كانت تجربتك مع <span className="text-primary font-bold">{revieweeName}</span>؟
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-bold">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-2 mb-6" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`transition-colors duration-200 ${
                  star <= rating ? "text-yellow-400" : "text-slate-600 hover:text-yellow-400/50"
                }`}
              >
                <span className="material-symbols-outlined !text-[40px] filled">star</span>
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 mb-2 text-right">تعليق (اختياري)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary min-h-[100px] text-right"
              placeholder="اكتب تجربتك هنا ليرى الآخرون مصداقية البائع..."
              dir="rtl"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition"
            >
              تخطي
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin">refresh</span>
              ) : (
                <>إرسال التقييم</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
