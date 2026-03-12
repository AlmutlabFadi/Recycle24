import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requirePermission("MANAGE_SUPPORT");
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        const { id } = await params;
        const ticket = await db.supportTicket.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, phone: true, email: true } },
                messages: { orderBy: { createdAt: "asc" } }
            }
        });

        if (!ticket) return NextResponse.json({ success: false, error: "التذكرة غير موجودة" }, { status: 404 });

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        console.error("Admin ticket detail GET error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل تفاصيل التذكرة" }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requirePermission("MANAGE_SUPPORT");
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        const { id } = await params;
        const { content } = await request.json();

        if (!content) return NextResponse.json({ success: false, error: "المحتوى مطلوب" }, { status: 400 });

        const message = await db.supportTicketMessage.create({
            data: {
                ticketId: id,
                content,
                senderType: "SUPPORT",
            }
        });

        // Update ticket timestamp
        await db.supportTicket.update({
            where: { id },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error("Admin ticket reply error:", error);
        return NextResponse.json({ success: false, error: "تعذر إرسال الرد" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requirePermission("MANAGE_SUPPORT");
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        const { id } = await params;
        const { status } = await request.json();

        const updatedTicket = await db.supportTicket.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ success: true, ticket: updatedTicket });
    } catch (error) {
        console.error("Admin ticket status PATCH error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحديث حالة التذكرة" }, { status: 500 });
    }
}
