import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverSession } from "@/lib/driver-auth";

export async function GET(request: NextRequest) {
    try {
        const session = await requireDriverSession();
        if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

        if (session.userType !== "DRIVER") {
            return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const where: { userId: string; status?: string } = { userId: session.userId };
        if (status && status !== "all") {
            where.status = status.toUpperCase();
        }

        const tickets = await db.supportTicket.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json({ ok: true, tickets });
    } catch (error) {
        console.error("Driver tickets GET error:", error);
        return NextResponse.json({ error: "FETCH_DRIVER_TICKETS_FAILED" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await requireDriverSession();
        if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

        if (session.userType !== "DRIVER") {
            return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
        }

        const body = await request.json();
        const { subject, category, priority, content } = body || {};

        if (!subject || !content) {
            return NextResponse.json({ error: "SUBJECT_AND_CONTENT_REQUIRED" }, { status: 400 });
        }

        const ticketId = `TKT-${Date.now().toString().slice(-6)}`;

        const ticket = await db.supportTicket.create({
            data: {
                userId: session.userId,
                ticketId,
                subject,
                category: category || "عام",
                priority: priority || "MEDIUM",
                status: "OPEN",
                messages: {
                    create: {
                        userId: session.userId,
                        content,
                        senderType: "DRIVER",
                    },
                },
            },
        });

        return NextResponse.json({ ok: true, ticketId: ticket.ticketId });
    } catch (error) {
        console.error("Driver tickets POST error:", error);
        return NextResponse.json({ error: "CREATE_DRIVER_TICKET_FAILED" }, { status: 500 });
    }
}
