import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverSession } from "@/lib/driver-auth";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDriverSession();
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const access = await requirePermission(PERMISSIONS.MANAGE_SUPPORT);
    const isSupport = access.ok;

    if (!isSupport && session.userType !== "DRIVER") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body || {};

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "CONTENT_REQUIRED" }, { status: 400 });
    }

    const { id: ticketIdParam } = await context.params;

    const ticket = await db.supportTicket.findFirst({
      where: {
        OR: [{ ticketId: ticketIdParam }, { id: ticketIdParam }],
        ...(isSupport ? {} : { userId: session.userId }),
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "TICKET_NOT_FOUND" }, { status: 404 });
    }

    const message = await db.supportTicketMessage.create({
      data: {
        ticketId: ticket.id,
        userId: isSupport ? null : session.userId,
        content,
        senderType: isSupport ? "SUPPORT" : "DRIVER",
      },
    });

    await db.supportTicket.update({
      where: { id: ticket.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    console.error("Post ticket message error:", error);
    return NextResponse.json({ error: "POST_TICKET_MESSAGE_FAILED" }, { status: 500 });
  }
}