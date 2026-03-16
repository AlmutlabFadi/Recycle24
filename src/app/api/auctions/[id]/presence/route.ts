import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface SessionUser { id: string; name?: string | null; role?: string; }

// In-memory presence store — key = auctionId:userId
const store = new Map<string, { userId: string; name: string; isTyping: boolean; lastSeen: number; role: "ADMIN" | "SELLER" }>();

function isOnline(ts: number) { return Date.now() - ts < 30_000; } // 30s
function isTypingActive(ts: number) { return Date.now() - ts < 5_000; } // 5s

// GET /api/auctions/[id]/presence — returns presence for everyone in this chat
export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const sessionUser = session.user as SessionUser;

    const result: Record<string, { name: string; isOnline: boolean; isTyping: boolean; role: string }> = {};
    for (const [key, val] of store.entries()) {
        if (!key.startsWith(`${id}:`)) continue;
        if (val.userId === sessionUser.id) continue; // skip self
        result[val.userId] = {
            name: val.name,
            isOnline: isOnline(val.lastSeen),
            isTyping: isTypingActive(val.lastSeen) && val.isTyping,
            role: val.role,
        };
    }
    return NextResponse.json({ success: true, presence: result });
}

// POST /api/auctions/[id]/presence — heartbeat + typing status
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const sessionUser = session.user as SessionUser;
    const body = await req.json().catch(() => ({}));
    const isTyping = !!body.isTyping;

    const isAdminRole = (sessionUser.role || "").toUpperCase().includes("ADMIN") || (sessionUser.role || "").toUpperCase().includes("SUPPORT");

    store.set(`${id}:${sessionUser.id}`, {
        userId: sessionUser.id,
        name: sessionUser.name || "مجهول",
        isTyping,
        lastSeen: Date.now(),
        role: isAdminRole ? "ADMIN" : "SELLER",
    });

    // Cleanup old entries periodically
    if (Math.random() < 0.1) {
        for (const [key, val] of store.entries()) {
            if (Date.now() - val.lastSeen > 120_000) store.delete(key);
        }
    }

    return NextResponse.json({ success: true });
}
