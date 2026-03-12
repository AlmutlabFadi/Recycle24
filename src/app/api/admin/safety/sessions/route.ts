import { NextRequest, NextResponse } from "next/server";
import { getSessionPermissions, hasCenterAccess, requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_KNOWLEDGE");
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const permissions = (await getSessionPermissions()) ?? [];
        if (!hasCenterAccess(permissions, "SAFETY")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || undefined;
        const search = searchParams.get("search") || undefined;
        const parsedLimit = parseInt(searchParams.get("limit") || "50", 10);
        const limit = Number.isNaN(parsedLimit) ? 50 : Math.min(parsedLimit, 200);

        const where: Record<string, any> = {
            ...(status && status !== "ALL" ? { status } : {}),
        };

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { location: { contains: search } },
                { instructorName: { contains: search } },
            ];
        }

        const sessions = await db.safetyTrainingSession.findMany({
            where,
            orderBy: { startDate: "desc" },
            take: limit,
        });

        return NextResponse.json({ success: true, sessions });
    } catch (error) {
        console.error("Admin safety sessions GET error:", error);
        return NextResponse.json(
            { success: false, error: "ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¬Ù„Ø³Ø§Øª" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_KNOWLEDGE");
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const permissions = (await getSessionPermissions()) ?? [];
        if (!hasCenterAccess(permissions, "SAFETY")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

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
        } = body || {};

        if (!title || !location || !startDate || !durationHours || !capacity) {
            return NextResponse.json(
                { success: false, error: "Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© Ù…Ø·Ù„ÙˆØ¨Ø©" },
                { status: 400 }
            );
        }

        const parsedCapacity = Math.max(1, parseInt(capacity, 10));
        const parsedDuration = Math.max(1, parseInt(durationHours, 10));

        const session = await db.safetyTrainingSession.create({
            data: {
                title,
                description: description || null,
                level: level || "BASIC",
                location,
                startDate: new Date(startDate),
                durationHours: parsedDuration,
                capacity: parsedCapacity,
                availableSeats: parsedCapacity,
                instructorName: instructorName || null,
                status: status || "OPEN",
                contactWhatsapp: contactWhatsapp || null,
            },
        });

        return NextResponse.json({ success: true, session });
    } catch (error) {
        console.error("Admin safety sessions POST error:", error);
        return NextResponse.json(
            { success: false, error: "ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø§Ù„Ø¬Ù„Ø³Ø©" },
            { status: 500 }
        );
    }
}

