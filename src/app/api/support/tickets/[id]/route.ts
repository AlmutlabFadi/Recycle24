import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }

        const ticketId = params.id;
        const userId = (session.user as any).id;

        const ticket = await db.supportTicket.findFirst({
            where: {
                OR: [
                    { ticketId: ticketId },
                    { id: ticketId }
                ],
                userId: userId
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: "asc"
                    }
                }
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            ticket
        });
    } catch (error) {
        console.error("Get ticket details error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء جلب تفاصيل التذكرة" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }

        const ticketId = params.id;
        const userId = (session.user as any).id;
        const { content } = await request.json();

        if (!content) {
            return NextResponse.json({ error: "المحتوى مطلوب" }, { status: 400 });
        }

        // Verify ticket ownership
        const ticket = await db.supportTicket.findFirst({
            where: {
                OR: [
                    { ticketId: ticketId },
                    { id: ticketId }
                ],
                userId: userId
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
        }

        const message = await db.supportTicketMessage.create({
            data: {
                ticketId: ticket.id,
                userId,
                content,
                senderType: "USER"
            }
        });

        // Update ticket updated timestamp
        await db.supportTicket.update({
            where: { id: ticket.id },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({
            success: true,
            message
        });
    } catch (error) {
        console.error("Post ticket message error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء إرسال الرسالة" },
            { status: 500 }
        );
    }
}
