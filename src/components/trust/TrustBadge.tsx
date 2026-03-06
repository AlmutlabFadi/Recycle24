import React from "react";

interface TrustBadgeProps {
  score: number;
  successRate: number;
  totalReviews: number;
  size?: "sm" | "md" | "lg";
}

export default function TrustBadge({ score, successRate, totalReviews, size = "md" }: TrustBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 3.0) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  const colorClass = totalReviews > 0 ? getScoreColor(score) : "text-slate-400 bg-slate-800 border-slate-700";
  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 space-x-1 rtl:space-x-reverse",
    md: "text-xs px-2.5 py-1 space-x-1.5 rtl:space-x-reverse",
    lg: "text-sm px-3 py-1.5 space-x-2 rtl:space-x-reverse"
  };

  const displayScore = totalReviews > 0 ? score.toFixed(1) : "جديد";

  return (
    <div className={`inline-flex items-center rounded-full border ${colorClass} ${sizeClasses[size]} font-display`} dir="rtl">
      <span className="material-symbols-outlined !text-[1em] filled">star</span>
      <span className="font-bold">{displayScore}</span>
      <div className="w-px h-[1em] bg-current opacity-30"></div>
      <span className="opacity-90">{successRate}% نجاح</span>
      <div className="w-px h-[1em] bg-current opacity-30"></div>
      <span className="opacity-75">({totalReviews})</span>
    </div>
  );
}
