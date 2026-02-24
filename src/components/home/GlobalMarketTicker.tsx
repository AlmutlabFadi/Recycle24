"use client";

import { useEffect, useState, useRef } from "react";
import MarketPriceCard from "@/components/MarketPriceCard";

interface MarketItem {
    id: string;
    label: string;
    price: string;
    unit: string;
    change: string;
    changeType: "up" | "down" | "neutral";
    icon: string;
    iconBg: string;
    iconColor: string;
}

export default function GlobalMarketTicker() {
    const [data, setData] = useState<MarketItem[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const scrollRef = useRef<number>(0);
    const requestRef = useRef<number>(0);

    // Configuration
    const SPEED = 0.2; // Slow but visible (User asked for 0.1, but browser might freeze 0.1. Using 0.2)
    const ITEM_WIDTH = 240; // Card + gap (220+20) - Ensure CSS matches

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Add random query param to avoid caching stale data if needed
                const res = await fetch("/api/market-prices");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch market prices", error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const animate = () => {
            if (!isPaused && containerRef.current && data.length > 0) {
                // Calculate total width of ONE set of data
                const totalWidth = data.length * ITEM_WIDTH;

                // Move Left to Right -> Decrease negative offset towards 0?
                // Or Increase positive offset?
                // Let's visualize: 
                // | [Copy1] [Original] [Copy2] |
                // To move items RIGHT (>>), we shift the view LEFT (<<) or shift items RIGHT (>>).
                // Transform X increasing moves items to RIGHT.

                // Let's start at X = -totalWidth (showing Middle set?)
                // And increase X towards 0.

                scrollRef.current += SPEED;

                // Reset logic
                // If we moved a full set width (e.g. from -totalWidth to 0)
                if (scrollRef.current >= 0) {
                    scrollRef.current = -totalWidth;
                }

                // Apply transform
                containerRef.current.style.transform = `translateX(${scrollRef.current}px)`;
            }
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPaused, data]);

    // Initialize position to seamless start
    useEffect(() => {
        if (data.length > 0 && scrollRef.current === 0) {
            // Start offset by one full width to have buffer on left
            const totalWidth = data.length * ITEM_WIDTH;
            scrollRef.current = -totalWidth;
        }
    }, [data]);

    const handleManualScroll = (direction: "left" | "right") => {
        setIsPaused(true);
        const amount = ITEM_WIDTH;
        if (direction === "right") {
            scrollRef.current += amount;
        } else {
            scrollRef.current -= amount;
        }

        // Clamp/Wrap logic for manual scroll
        const totalWidth = data.length * ITEM_WIDTH;
        if (scrollRef.current >= 0) scrollRef.current = -totalWidth;
        if (scrollRef.current <= -(totalWidth * 2)) scrollRef.current = -totalWidth; // Wrap other way

        if (containerRef.current) {
            containerRef.current.style.transform = `translateX(${scrollRef.current}px)`;
        }
    };

    if (data.length === 0) {
        return (
            <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="min-w-[220px] h-[100px] rounded-xl bg-slate-800/50 animate-pulse border border-slate-700"></div>
                ))}
            </div>
        );
    }

    // Triplicate data for buffer on both sides
    // [Set 1] [Set 2 (Active)] [Set 3]
    // We start viewing Set 2.
    // Moving Right >> means we see Set 1 coming in.
    const seamlessData = [...data, ...data, ...data];

    return (
        <div
            className="w-full relative group overflow-hidden"
            dir="ltr"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <button
                onClick={() => handleManualScroll("left")}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-800/80 text-white flex items-center justify-center shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary cursor-pointer"
            >
                <span className="material-symbols-outlined !text-[20px]">chevron_left</span>
            </button>

            <button
                onClick={() => handleManualScroll("right")}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-800/80 text-white flex items-center justify-center shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary cursor-pointer"
            >
                <span className="material-symbols-outlined !text-[20px]">chevron_right</span>
            </button>

            <div
                ref={containerRef}
                className="flex w-max no-scrollbar whitespace-nowrap will-change-transform"
                style={{ transform: `translateX(0px)` }} // Initial style
            >
                {seamlessData.map((item, index) => (
                    <div
                        key={`${item.id}-${index}`}
                        className="inline-block w-[240px] px-2 flex-shrink-0"
                    >
                        <MarketPriceCard
                            icon={item.icon}
                            iconBg={item.iconBg}
                            iconColor={item.iconColor}
                            label={item.label}
                            price={item.price}
                            unit={item.unit}
                            change={item.change}
                            changeType={item.changeType}
                        />
                    </div>
                ))}
            </div>

            {isPaused && (
                <div className="absolute top-2 right-2 transition-opacity pointer-events-none z-10 w-fit">
                    <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[10px]">pause</span>
                        إيقاف
                    </span>
                </div>
            )}
        </div>
    );
}
