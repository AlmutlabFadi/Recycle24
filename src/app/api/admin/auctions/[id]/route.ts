import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface SessionUser {
    id: string;
    name?: string | null;
    role?: string;
}

// PATCH /api/admin/auctions/[id] - Approve, move to review, or reject an auction
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const sessionUser = session.user as SessionUser;
        const isAdmin = (sessionUser.role || "").includes("ADMIN") || (sessionUser.role || "").includes("SUPPORT");
        if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const { id } = await context.params;
        const body = await request.json();
        const { action, rejectionReason } = body as {
            action: "start_review" | "approve" | "reject";
            rejectionReason?: string;
        };

        if (!["start_review", "approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "إجراء غير صالح" }, { status: 400 });
        }

        const auction = await db.auction.findUnique({ where: { id } });
        if (!auction) return NextResponse.json({ error: "المزاد غير موجود" }, { status: 404 });

        let newWorkflowStatus: string;
        let newStatus: string;
        let notifTitle: string;
        let notifMessage: string;
        let notifType: string;

        if (action === "start_review") {
            if (auction.workflowStatus !== "PENDING_APPROVAL") {
                return NextResponse.json({ error: "المزاد ليس في حالة انتظار" }, { status: 400 });
            }
            newWorkflowStatus = "UNDER_REVIEW";
            newStatus = "PENDING";
            notifTitle = "مزادك قيد المراجعة 🔍";
            notifMessage = `بدأت لجنة الإدارة مراجعة مزادك "${auction.title}". يمكنك التواصل معهم مباشرة من صفحة مزاداتي.`;
            notifType = "INFO";
        } else if (action === "approve") {
            if (!["PENDING_APPROVAL", "UNDER_REVIEW"].includes(auction.workflowStatus)) {
                return NextResponse.json({ error: "لا يمكن الموافقة على مزاد في هذه الحالة" }, { status: 400 });
            }
            newWorkflowStatus = "SCHEDULED";
            newStatus = "SCHEDULED";
            notifTitle = "تمت الموافقة على مزادك ✅";
            notifMessage = `تمت الموافقة على مزادك "${auction.title}" وسيبدأ في الموعد المحدد.`;
            notifType = "SUCCESS";
        } else {
            // reject
            newWorkflowStatus = "CANCELED";
            newStatus = "CANCELED";
            notifTitle = "تم رفض مزادك ❌";
            notifMessage = `تم رفض مزادك "${auction.title}".${rejectionReason ? ` السبب: ${rejectionReason}` : ""}`;
            notifType = "WARNING";
        }

        const updated = await db.auction.update({
            where: { id },
            data: { workflowStatus: newWorkflowStatus, status: newStatus },
        });

        // Notify seller
        await db.notification.create({
            data: {
                userId: auction.sellerId,
                title: notifTitle,
                message: notifMessage,
                type: notifType,
                link: `/auctions/my-auctions`,
            },
        });

        // Log the event
        await db.auctionEventLog.create({
            data: {
                auctionId: id,
                actorId: sessionUser.id,
                eventType: `ADMIN_ACTION_${action.toUpperCase()}`,
                payload: { rejectionReason: rejectionReason || null },
            },
        });

        return NextResponse.json({ success: true, auction: updated });
    } catch (error) {
        console.error("Admin auction PATCH error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب" }, { status: 500 });
    }
}
