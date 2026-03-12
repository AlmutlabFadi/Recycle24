import { NextRequest, NextResponse } from "next/server";
import { getSessionPermissions, hasCenterAccess, requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

const ALLOWED_STATUSES = ["PENDING", "CONFIRMED", "REJECTED"];

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const access = await requirePermission("MANAGE_KNOWLEDGE");
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const permissions = (await getSessionPermissions()) ?? [];
        if (!hasCenterAccess(permissions, "SAFETY")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await request.json();
        const { status } = body || {};

        if (!status || !ALLOWED_STATUSES.includes(status)) {
            return NextResponse.json(
                { success: false, error: "Ø­Ø§Ù„Ø© ØºÙŠØ± ØµØ§Ù„Ø­Ø©" },
                { status: 400 }
            );
        }

        const requestRecord = await db.safetyTrainingRequest.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({ success: true, request: requestRecord });
    } catch (error) {
        console.error("Admin training request PATCH error:", error);
        return NextResponse.json(
            { success: false, error: "ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø·Ù„Ø¨" },
            { status: 500 }
        );
    }
}

