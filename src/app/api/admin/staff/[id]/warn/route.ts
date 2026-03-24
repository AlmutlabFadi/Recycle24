import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const staffId = params.id;
        const { reason, snapshot } = await req.json();

        if (!reason) {
            return NextResponse.json({ success: false, error: "Reason is required" }, { status: 400 });
        }

        const result = await db.$transaction(async (tx) => {
            // 1. Create the warning record
            const warning = await tx.staffWarning.create({
                data: {
                    staffId,
                    issuerId: access.userId,
                    reason,
                    activitySnapshot: snapshot || {},
                },
            });

            // 2. Create a notification for the staff member
            await tx.notification.create({
                data: {
                    userId: staffId,
                    title: "تحذير إداري رسمي",
                    message: `تم إصدار تحذير لك من قبل الإدارة. السبب: ${reason}`,
                    type: "SYSTEM",
                    metadata: { warningId: warning.id },
                },
            });

            return warning;
        });

        return NextResponse.json({ success: true, warningId: result.id });
    } catch (error) {
        console.error("Staff warning error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
