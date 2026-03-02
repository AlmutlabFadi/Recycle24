import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface SessionUser {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        // Real DB mode
        const sessionUser = session.user as SessionUser;
        const userId = sessionUser.id;
        const { db } = await import("@/lib/db");

        const where: { userId: string; status?: string } = { userId };
        if (status && status !== "all") {
            where.status = status.toUpperCase();
        }

        const tickets = await db.supportTicket.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json({
            success: true,
            tickets,
        });
    } catch (error) {
        console.error("Get tickets error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء جلب التذاكر" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }

        const sessionUser = session.user as SessionUser;
        const userId = sessionUser.id;

        const body = await request.json();
        const { subject, category, priority, content } = body;

        if (!subject || !content) {
            return NextResponse.json(
                { error: "الموضوع والمحتوى مطلوبان" },
                { status: 400 }
            );
        }

        const ticketId = `TKT-${Date.now().toString().slice(-6)}`;

        // Real DB mode
        const { db } = await import("@/lib/db");
        const ticket = await db.supportTicket.create({
            data: {
                userId,
                ticketId,
                subject,
                category: category || "عام",
                priority: priority || "MEDIUM",
                status: "OPEN",
                messages: {
                    create: {
                        userId,
                        content,
                        senderType: "USER",
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            ticket: {
                id: ticket.id,
                ticketId: ticket.ticketId,
            },
            message: "تم إنشاء التذكرة بنجاح",
        });
    } catch (error) {
        console.error("Create ticket error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء إنشاء التذكرة" },
            { status: 500 }
        );
    }
}
