import { NextRequest, NextResponse } from "next/server";
import { getSessionPermissions, hasCenterAccess, requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

const ALLOWED_STATUSES = ["IN_REVIEW", "EN_ROUTE", "ARRIVED", "RESOLVED", "CLOSED"];

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
        const { status, note } = body || {};

        if (!status || !ALLOWED_STATUSES.includes(status)) {
            return NextResponse.json(
                { success: false, error: "Ø­Ø§Ù„Ø© ØºÙŠØ± ØµØ§Ù„Ø­Ø©" },
                { status: 400 }
            );
        }

        const incident = await db.$transaction(async (tx) => {
            const updated = await tx.safetyIncidentReport.update({
                where: { id },
                data: { status },
            });

            await tx.safetyIncidentStatusLog.create({
                data: {
                    incidentId: id,
                    status,
                    note: note || null,
                    changedById: access.userId!,
                },
            });

            return updated;
        });

        return NextResponse.json({ success: true, incident });
    } catch (error) {
        console.error("Admin safety incident PATCH error:", error);
        return NextResponse.json(
            { success: false, error: "ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¨Ù„Ø§Øº" },
            { status: 500 }
        );
    }
}

