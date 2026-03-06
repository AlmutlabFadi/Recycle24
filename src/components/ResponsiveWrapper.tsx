"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function ResponsiveWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Routes that should NOT be constrained to max-w-md (Desktop/Admin views)
  const isFullWidthRoute = pathname?.startsWith("/gsocc") || pathname?.startsWith("/admin") || pathname?.startsWith("/gsocc/");

  if (isFullWidthRoute) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-bg-dark overflow-hidden">
        {children}
      </div>
    );
  }

  // Default mobile-responsive centered layout
  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-bg-dark shadow-xl overflow-hidden shadow-black/50 border-x border-slate-800/50">
      {children}
    </div>
  );
}
