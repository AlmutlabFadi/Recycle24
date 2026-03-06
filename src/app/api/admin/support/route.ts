import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_SUPPORT");
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || undefined;

        const tickets = await db.supportTicket.findMany({
            where: {
                ...(status ? { status } : {}),
            },
            include: {
                user: {
                    select: {
                        name: true,
                        phone: true,
                        email: true,
                        userType: true,
                    }
                },
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: [
                { status: "asc" },
                { createdAt: "desc" }
            ],
        });

        // Summary stats for the helpdesk
        const stats = await db.supportTicket.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        return NextResponse.json({ success: true, tickets, stats });
    } catch (error) {
        console.error("Admin support GET error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل تذاكر الدعم" },
            { status: 500 }
        );
    }
}
