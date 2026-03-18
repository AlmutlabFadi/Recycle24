import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface SessionUser {
    id: string;
    name?: string | null;
    role?: string;
}

// GET /api/auctions/[id]/messages
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { id } = await context.params;

        const events = await db.auctionEventLog.findMany({
            where: { auctionId: id, eventType: "REVIEW_MESSAGE" },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ success: true, messages: events });
    } catch (error) {
        console.error("Get messages error:", error);
        return NextResponse.json({ error: "فشل جلب الرسائل" }, { status: 500 });
    }
}

// POST /api/auctions/[id]/messages
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await context.params;
        const sessionUser = session.user as SessionUser;
        const body = await request.json();
        const { text, fileUrl, fileName } = body as { text?: string; fileUrl?: string; fileName?: string };

        if (!text?.trim() && !fileUrl) {
            return NextResponse.json({ error: "الرسالة فارغة" }, { status: 400 });
        }

        const auction = await db.auction.findUnique({ where: { id }, select: { sellerId: true, workflowStatus: true, title: true } });
        if (!auction) return NextResponse.json({ error: "المزاد غير موجود" }, { status: 404 });

        const isAdmin = (sessionUser.role || "").toUpperCase().includes("ADMIN") || (sessionUser.role || "").toUpperCase().includes("SUPPORT");
        const isSeller = auction.sellerId === sessionUser.id;
        if (!isAdmin && !isSeller) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const message = await db.auctionEventLog.create({
            data: {
                auctionId: id,
                actorId: sessionUser.id,
                eventType: "REVIEW_MESSAGE",
                payload: {
                    text: text?.trim() || (fileName ? `📎 ${fileName}` : "مرفق"),
                    senderName: sessionUser.name || "غير معروف",
                    senderRole: isAdmin ? "ADMIN" : "SELLER",
                    fileUrl: fileUrl || null,
                    fileName: fileName || null,
                },
            },
        });

        // Notify other party
        if (isAdmin) {
            // Notify seller
            await db.notification.create({
                data: {
                    userId: auction.sellerId,
                    title: "📩 رسالة جديدة من الإدارة بشأن مزادك",
                    message: `${sessionUser.name || "الإدارة"}: ${text?.substring(0, 80) || "أرسل مرفقاً"}`,
                    type: "INFO",
                    link: `/auctions/my-auctions?aucId=${id}`,
                },
            });
        }

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error("Post message error:", error);
        return NextResponse.json({ error: "فشل إرسال الرسالة" }, { status: 500 });
    }
}
