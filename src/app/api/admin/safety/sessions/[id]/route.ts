import { NextRequest, NextResponse } from "next/server";
import { getSessionPermissions, hasCenterAccess, requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

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
        const {
            title,
            description,
            level,
            location,
            startDate,
            durationHours,
            capacity,
            instructorName,
            status,
            contactWhatsapp,
            availableSeats,
        } = body || {};

        const updateData: Record<string, any> = {
            ...(title ? { title } : {}),
            ...(description !== undefined ? { description: description || null } : {}),
            ...(level ? { level } : {}),
            ...(location ? { location } : {}),
            ...(startDate ? { startDate: new Date(startDate) } : {}),
            ...(durationHours ? { durationHours: Math.max(1, parseInt(durationHours, 10)) } : {}),
            ...(capacity ? { capacity: Math.max(1, parseInt(capacity, 10)) } : {}),
            ...(availableSeats !== undefined ? { availableSeats: Math.max(0, parseInt(availableSeats, 10)) } : {}),
            ...(instructorName !== undefined ? { instructorName: instructorName || null } : {}),
            ...(status ? { status } : {}),
            ...(contactWhatsapp !== undefined ? { contactWhatsapp: contactWhatsapp || null } : {}),
        };

        const session = await db.safetyTrainingSession.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ success: true, session });
    } catch (error) {
        console.error("Admin safety sessions PATCH error:", error);
        return NextResponse.json(
            { success: false, error: "ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¬Ù„Ø³Ø©" },
            { status: 500 }
        );
    }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
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
        await db.safetyTrainingSession.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin safety sessions DELETE error:", error);
        return NextResponse.json(
            { success: false, error: "ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ø¬Ù„Ø³Ø©" },
            { status: 500 }
        );
    }
}

