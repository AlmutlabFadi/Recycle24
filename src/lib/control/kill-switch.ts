import { db } from "@/lib/db";

/**
 * Kill Switch cache with TTL.
 * Reads from DB at most once every CACHE_TTL_MS milliseconds.
 */
let cachedSwitches: Record<string, string> = {};
let lastFetchedAt = 0;
const CACHE_TTL_MS = 3000; // 3 seconds

/**
 * Get all kill switch states (cached).
 */
export async function getKillSwitches(): Promise<Record<string, string>> {
    const now = Date.now();
    if (now - lastFetchedAt < CACHE_TTL_MS && Object.keys(cachedSwitches).length > 0) {
        return cachedSwitches;
    }

    try {
        const switches = await db.killSwitch.findMany();
        const map: Record<string, string> = {};
        for (const ks of switches) {
            map[ks.key] = ks.state;
        }
        cachedSwitches = map;
        lastFetchedAt = now;
        return map;
    } catch (error) {
        console.error("[KillSwitch] Cache fetch failed:", error);
        return cachedSwitches; // Return stale cache on error
    }
}

/**
 * Check if a specific kill switch is active (state === 'on' means BLOCKED).
 */
export async function isKilled(key: string): Promise<boolean> {
    const switches = await getKillSwitches();
    return switches[key] === "on";
}

/**
 * Guard function — throws if kill switch is active.
 * Use at the top of API routes:
 * 
 * ```ts
 * await guardKillSwitch("AUCTIONS_GLOBAL", "المزادات معطلة حالياً");
 * ```
 */
export async function guardKillSwitch(key: string, message?: string): Promise<void> {
    if (await isKilled(key)) {
        throw new KillSwitchError(key, message || `Service disabled by kill switch: ${key}`);
    }
}

/**
 * Custom error for kill switch blocks.
 */
export class KillSwitchError extends Error {
    public readonly killSwitchKey: string;
    public readonly statusCode = 503;

    constructor(key: string, message: string) {
        super(message);
        this.name = "KillSwitchError";
        this.killSwitchKey = key;
    }
}

/**
 * Invalidate the cache (call after updating a kill switch).
 */
export function invalidateKillSwitchCache(): void {
    lastFetchedAt = 0;
    cachedSwitches = {};
}
