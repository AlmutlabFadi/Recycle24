import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverSession } from "@/lib/driver-auth";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireDriverSession();
        if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

        if (session.userType !== "DRIVER") {
            return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
        }

        const { id } = await context.params;
        const ticket = await db.supportTicket.findFirst({
            where: { id, userId: session.userId },
            include: {
                messages: { orderBy: { createdAt: "asc" } },
            },
        });

        if (!ticket) {
            return NextResponse.json({ error: "TICKET_NOT_FOUND" }, { status: 404 });
        }

        return NextResponse.json({ ok: true, ticket });
    } catch (error) {
        console.error("Driver ticket detail GET error:", error);
        return NextResponse.json({ error: "FETCH_DRIVER_TICKET_FAILED" }, { status: 500 });
    }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireDriverSession();
        if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

        if (session.userType !== "DRIVER") {
            return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
        }

        const { id } = await context.params;
        const { content } = await request.json();

        if (!content || typeof content !== "string") {
            return NextResponse.json({ error: "CONTENT_REQUIRED" }, { status: 400 });
        }

        const ticket = await db.supportTicket.findFirst({
            where: { id, userId: session.userId },
            select: { id: true },
        });

        if (!ticket) {
            return NextResponse.json({ error: "TICKET_NOT_FOUND" }, { status: 404 });
        }

        const message = await db.supportTicketMessage.create({
            data: {
                ticketId: id,
                userId: session.userId,
                content,
                senderType: "DRIVER",
            },
        });

        await db.supportTicket.update({
            where: { id },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json({ ok: true, message });
    } catch (error) {
        console.error("Driver ticket message POST error:", error);
        return NextResponse.json({ error: "CREATE_DRIVER_TICKET_MESSAGE_FAILED" }, { status: 500 });
    }
}
