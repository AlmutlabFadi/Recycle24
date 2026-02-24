import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

// Define market item type
interface MarketItem {
    id: string;
    label: string;
    base: number;
    unit: string;
    icon: string;
    color: string;
    bg: string;
}

// Base prices (Approximate Feb 2026)
const MARKET_DATA: {
    metals: MarketItem[];
    currencies: MarketItem[];
    commodities: MarketItem[];
    stocks: MarketItem[];
    crypto: MarketItem[];
} = {
    metals: [
        { id: "gold", label: "الذهب (XAU)", base: 2045.00, unit: "$/أونصة", icon: "diamond", color: "text-yellow-500", bg: "bg-yellow-500/10" },
        { id: "silver", label: "الفضة (XAG)", base: 24.50, unit: "$/أونصة", icon: "stars", color: "text-slate-300", bg: "bg-slate-300/10" },
        { id: "platinum", label: "البلاتين", base: 980.00, unit: "$/أونصة", icon: "settings_suggest", color: "text-slate-400", bg: "bg-slate-400/10" },
        { id: "palladium", label: "البلاديوم", base: 1100.00, unit: "$/أونصة", icon: "filter_tilt_shift", color: "text-orange-300", bg: "bg-orange-300/10" },
        { id: "copper", label: "النحاس", base: 8450.00, unit: "$/طن", icon: "category", color: "text-orange-500", bg: "bg-orange-500/10" },
        { id: "aluminum", label: "الألمنيوم", base: 2250.00, unit: "$/طن", icon: "stack", color: "text-gray-400", bg: "bg-gray-400/10" },
        { id: "iron", label: "الحديد", base: 120.50, unit: "$/طن", icon: "factory", color: "text-blue-400", bg: "bg-blue-400/10" },
        { id: "zinc", label: "الزنك", base: 2500.00, unit: "$/طن", icon: "hexagon", color: "text-slate-500", bg: "bg-slate-500/10" },
        { id: "nickel", label: "النيكل", base: 16500.00, unit: "$/طن", icon: "battery_full", color: "text-green-600", bg: "bg-green-600/10" },
    ],
    currencies: [
        // All rates against SYP (Approximate based on 1 USD = 14,650 SYP)
        { id: "usd_syp", label: "دولار أمريكي", base: 14650, unit: "ل.س", icon: "attach_money", color: "text-green-500", bg: "bg-green-500/10" },
        { id: "eur_syp", label: "يورو", base: 16000, unit: "ل.س", icon: "euro", color: "text-blue-500", bg: "bg-blue-500/10" },
        { id: "sar_syp", label: "ريال سعودي", base: 3900, unit: "ل.س", icon: "currency_exchange", color: "text-green-600", bg: "bg-green-600/10" },
        { id: "aed_syp", label: "درهم إماراتي", base: 4000, unit: "ل.س", icon: "currency_exchange", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { id: "try_syp", label: "ليرة تركية", base: 425, unit: "ل.س", icon: "currency_lira", color: "text-red-500", bg: "bg-red-500/10" },
        { id: "jod_syp", label: "دينار أردني", base: 20650, unit: "ل.س", icon: "currency_exchange", color: "text-amber-600", bg: "bg-amber-600/10" },
        { id: "kwd_syp", label: "دينار كويتي", base: 47700, unit: "ل.س", icon: "currency_exchange", color: "text-teal-500", bg: "bg-teal-500/10" },
        { id: "qar_syp", label: "ريال قطري", base: 4025, unit: "ل.س", icon: "currency_exchange", color: "text-cyan-600", bg: "bg-cyan-600/10" },
        { id: "egp_syp", label: "جنيه مصري", base: 290, unit: "ل.س", icon: "currency_exchange", color: "text-yellow-600", bg: "bg-yellow-600/10" },
        { id: "gbp_syp", label: "جنيه إسترليني", base: 18600, unit: "ل.س", icon: "currency_pound", color: "text-indigo-500", bg: "bg-indigo-500/10" },
        { id: "iqd_syp", label: "1000 دينار عراقي", base: 11200, unit: "ل.س", icon: "currency_exchange", color: "text-orange-600", bg: "bg-orange-600/10" }, // Per 1000 usually
        { id: "lbp_syp", label: "1000 ليرة لبنانية", base: 165, unit: "ل.س", icon: "currency_exchange", color: "text-red-400", bg: "bg-red-400/10" },
        { id: "sek_syp", label: "كرون سويدي", base: 1400, unit: "ل.س", icon: "euro", color: "text-blue-300", bg: "bg-blue-300/10" },
        { id: "chf_syp", label: "فرنك سويسري", base: 16600, unit: "ل.س", icon: "account_balance", color: "text-red-600", bg: "bg-red-600/10" },
        { id: "cny_syp", label: "يوان صيني", base: 2050, unit: "ل.س", icon: "currency_yen", color: "text-red-500", bg: "bg-red-500/10" },
        { id: "rub_syp", label: "روبل روسي", base: 160, unit: "ل.س", icon: "currency_ruble", color: "text-blue-600", bg: "bg-blue-600/10" },
    ],
    commodities: [
        { id: "oil", label: "نفط برنت", base: 82.30, unit: "$/برميل", icon: "water_drop", color: "text-black", bg: "bg-slate-200" },
        { id: "gas", label: "الغاز الطبيعي", base: 2.10, unit: "$/MMBtu", icon: "propane_tank", color: "text-blue-500", bg: "bg-blue-500/10" },
        { id: "wheat", label: "القمح", base: 580.00, unit: "$/بوشل", icon: "grass", color: "text-yellow-400", bg: "bg-yellow-400/10" },
        { id: "sugar", label: "السكر", base: 22.50, unit: "سنت/رطل", icon: "cookie", color: "text-white", bg: "bg-slate-400/50" },
        { id: "cotton", label: "القطن", base: 95.00, unit: "سنت/رطل", icon: "checkroom", color: "text-slate-100", bg: "bg-indigo-300/30" },
    ],
    stocks: [
        { id: "aapl", label: "Apple", base: 195.00, unit: "$", icon: "phone_iphone", color: "text-slate-300", bg: "bg-slate-500/20" },
        { id: "msft", label: "Microsoft", base: 420.00, unit: "$", icon: "window", color: "text-blue-400", bg: "bg-blue-400/10" },
        { id: "googl", label: "Alphabet", base: 155.00, unit: "$", icon: "search", color: "text-red-400", bg: "bg-red-400/10" },
        { id: "amzn", label: "Amazon", base: 180.00, unit: "$", icon: "shopping_cart", color: "text-orange-400", bg: "bg-orange-400/10" },
        { id: "nvda", label: "NVIDIA", base: 850.00, unit: "$", icon: "memory", color: "text-green-400", bg: "bg-green-400/10" },
        { id: "tsla", label: "Tesla", base: 220.00, unit: "$", icon: "electric_car", color: "text-red-500", bg: "bg-red-500/10" },
        { id: "meta", label: "Meta", base: 490.00, unit: "$", icon: "public", color: "text-blue-600", bg: "bg-blue-600/10" },
        { id: "tsm", label: "TSMC", base: 140.00, unit: "$", icon: "chip_extraction", color: "text-purple-400", bg: "bg-purple-400/10" },
        { id: "aramco", label: "Aramco", base: 8.50, unit: "$", icon: "oil_barrel", color: "text-green-600", bg: "bg-green-600/10" },
        { id: "v", label: "Visa", base: 280.00, unit: "$", icon: "credit_card", color: "text-blue-700", bg: "bg-blue-700/10" },
        { id: "jpm", label: "JPMorgan", base: 175.00, unit: "$", icon: "account_balance", color: "text-blue-800", bg: "bg-blue-800/10" },
        { id: "wmt", label: "Walmart", base: 60.00, unit: "$", icon: "store", color: "text-yellow-600", bg: "bg-yellow-600/10" },
    ],
    crypto: [
        { id: "btc", label: "Bitcoin", base: 65000.00, unit: "$", icon: "currency_bitcoin", color: "text-orange-500", bg: "bg-orange-500/10" },
        { id: "eth", label: "Ethereum", base: 3500.00, unit: "$", icon: "deployed_code", color: "text-indigo-400", bg: "bg-indigo-400/10" },
        { id: "bnb", label: "BNB", base: 450.00, unit: "$", icon: "token", color: "text-yellow-400", bg: "bg-yellow-400/10" },
        { id: "sol", label: "Solana", base: 140.00, unit: "$", icon: "sunny", color: "text-purple-500", bg: "bg-purple-500/10" },
        { id: "xrp", label: "XRP", base: 0.65, unit: "$", icon: "data_exploration", color: "text-slate-300", bg: "bg-slate-300/10" },
        { id: "usdt", label: "Tether", base: 1.00, unit: "$", icon: "attach_money", color: "text-green-500", bg: "bg-green-500/10" },
        { id: "ada", label: "Cardano", base: 0.60, unit: "$", icon: "schema", color: "text-blue-400", bg: "bg-blue-400/10" },
        { id: "doge", label: "Dogecoin", base: 0.15, unit: "$", icon: "pets", color: "text-yellow-300", bg: "bg-yellow-300/10" },
        { id: "avax", label: "Avalanche", base: 45.00, unit: "$", icon: "snowboarding", color: "text-red-500", bg: "bg-red-500/10" },
        { id: "dot", label: "Polkadot", base: 8.50, unit: "$", icon: "hub", color: "text-pink-500", bg: "bg-pink-500/10" },
        { id: "trx", label: "Tron", base: 0.12, unit: "$", icon: "details", color: "text-red-600", bg: "bg-red-600/10" },
        { id: "link", label: "Chainlink", base: 20.00, unit: "$", icon: "link", color: "text-blue-600", bg: "bg-blue-600/10" },
    ]
};

const fluctuate = (base: number, percent: number) => {
    const change = base * (Math.random() * percent * 2 - percent);
    return Number((base + change).toFixed(base < 10 ? 3 : 2));
};

export async function GET(request: NextRequest) {
    // Apply rate limiting: 60 requests per minute per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") || 
               "unknown";
    
    const { allowed, remaining, resetTime } = checkRateLimit(`market-prices-${ip}`, {
        windowMs: 60000, // 1 minute
        maxRequests: 60,
    });

    const headers = getRateLimitHeaders(allowed, remaining, resetTime, 60);

    if (!allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429, headers }
        );
    }

    const allItems = [
        ...MARKET_DATA.metals,
        ...MARKET_DATA.currencies,
        ...MARKET_DATA.commodities,
        ...MARKET_DATA.stocks,
        ...MARKET_DATA.crypto
    ].map((item: MarketItem) => {
        // Determine fluctuation
        const isCrypto = MARKET_DATA.crypto.some(c => c.id === item.id);
        const volatility = isCrypto ? 0.05 : 0.01;
        const currentPrice = fluctuate(item.base, volatility);
        const prevPrice = item.base;
        const changePercent = ((currentPrice - prevPrice) / prevPrice) * 100;

        return {
            id: item.id,
            label: item.label,
            price: currentPrice.toLocaleString(), // Format with commas
            unit: item.unit,
            change: (changePercent > 0 ? "+" : "") + changePercent.toFixed(2) + "%",
            changeType: changePercent >= 0 ? "up" : "down",
            icon: item.icon,
            iconBg: item.bg,
            iconColor: item.color,
            category: "global"
        };
    });

    return NextResponse.json(allItems, { headers });
}
