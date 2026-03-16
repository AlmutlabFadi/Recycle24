"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface PendingMsg {
    auctionId: string;
    auctionTitle: string;
    senderName: string;
    text: string;
    createdAt: string;
}

/**
 * AuctionChatPopup — polls for new REVIEW_MESSAGE events addressed to the current user.
 * Shown as a floating bottom sheet when a new admin message arrives.
 * Stays visible until the user taps X.
 * Tapping the banner opens the my-auctions page.
 */
export default function AuctionChatPopup() {
    const { user, activeRole } = useAuth();
    const router = useRouter();
    const [popup, setPopup] = useState<PendingMsg | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const lastSeenRef = useRef<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const poll = useCallback(async () => {
        if (!user?.id) return;
        try {
            // Fetch seller's own auctions that are UNDER_REVIEW
            const res = await fetch("/api/auctions/mine");
            if (!res.ok) return;
            const data = await res.json();
            const reviewAuctions: { id: string; title: string; workflowStatus: string }[] = (data.auctions || [])
                .filter((a: { workflowStatus: string }) => a.workflowStatus === "UNDER_REVIEW");

            for (const auction of reviewAuctions) {
                const msgRes = await fetch(`/api/auctions/${auction.id}/messages`);
                if (!msgRes.ok) continue;
                const msgData = await msgRes.json();
                const msgs: { id: string; payload: { senderRole: string; senderName: string; text: string }; createdAt: string }[] = msgData.messages || [];
                // Find latest ADMIN message
                const adminMsgs = msgs
                    .filter(m => m.payload?.senderRole === "ADMIN")
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                if (adminMsgs.length > 0) {
                    const latest = adminMsgs[0];
                    const key = `${auction.id}:${latest.id}`;
                    if (lastSeenRef.current === key) continue;
                    // New admin message
                    lastSeenRef.current = key;
                    setDismissed(false);
                    setPopup({
                        auctionId: auction.id,
                        auctionTitle: auction.title,
                        senderName: latest.payload.senderName || "الإدارة",
                        text: latest.payload.text,
                        createdAt: latest.createdAt,
                    });
                    break;
                }
            }
        } catch (e) { /* silent */ }
    }, [user?.id]);

    useEffect(() => {
        // Only poll for TRADER role
        if (activeRole !== "TRADER") return;
        // Load last seen from localStorage
        const stored = localStorage.getItem("auction_chat_lastSeen");
        if (stored) lastSeenRef.current = stored;

        intervalRef.current = setInterval(poll, 15000); // every 15s
        poll(); // immediate
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [activeRole, poll]);

    const handleDismiss = () => {
        setDismissed(true);
        // Store so we don't re-show same message after page reload
        if (lastSeenRef.current) localStorage.setItem("auction_chat_lastSeen", lastSeenRef.current);
    };

    const handleOpen = () => {
        handleDismiss();
        router.push("/auctions/my-auctions");
    };

    if (!popup || dismissed) return null;

    return (
        <div
            className="fixed bottom-24 left-0 right-0 z-[999] px-4 pointer-events-none"
            aria-live="polite"
        >
            <div
                className="pointer-events-auto max-w-sm mx-auto bg-slate-900 border border-blue-500/40 rounded-2xl shadow-2xl shadow-blue-900/30 overflow-hidden animate-slideUpFade"
            >
                {/* Top bar */}
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/15 border-b border-blue-500/20">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                    <p className="text-xs font-bold text-blue-300 flex-1">رسالة جديدة من الإدارة</p>
                    <button
                        onClick={handleDismiss}
                        className="text-slate-400 hover:text-white transition"
                        aria-label="إغلاق"
                    >
                        <span className="material-symbols-outlined !text-[18px]">close</span>
                    </button>
                </div>
                {/* Content */}
                <button
                    onClick={handleOpen}
                    className="w-full text-right p-4 flex items-start gap-3 hover:bg-slate-800 transition"
                >
                    <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined !text-[18px] text-primary">support_agent</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 truncate">{popup.auctionTitle}</p>
                        <p className="text-sm font-bold text-white mt-0.5 line-clamp-2">{popup.text}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                            {new Date(popup.createdAt).toLocaleTimeString("ar-SY", { hour: "2-digit", minute: "2-digit" })}
                            {" • "}اضغط للرد
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );
}
