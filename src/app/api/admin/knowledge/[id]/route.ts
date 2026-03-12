import { NextRequest, NextResponse } from "next/server";
import { getSessionPermissions, hasCenterAccess, requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const access = await requirePermission("MANAGE_KNOWLEDGE");
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const existing = await db.knowledgeItem.findUnique({
            where: { id: (await context.params).id },
            select: { center: true },
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: "Ø§Ù„Ù…Ø­ØªÙˆÙ‰ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" }, { status: 404 });
        }

        const permissions = (await getSessionPermissions()) ?? [];
        if (!hasCenterAccess(permissions, existing.center)) {
            return NextResponse.json({ success: false, error: "Ù„Ø§ ØªÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ© Ù„Ù‡Ø°Ø§ Ø§Ù„Ù…Ø±ÙƒØ²" }, { status: 403 });
        }

        const body = await request.json();
        const {
            center,
            type,
            title,
            summary,
            content,
            mediaUrl,
            coverImageUrl,
            tags,
            priority,
            status,
            authorName,
            sourceLabel,
        } = body;

        if (center && !hasCenterAccess(permissions, center)) {
            return NextResponse.json({ success: false, error: "Ù„Ø§ ØªÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ© Ù„Ù†Ù‚Ù„ Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ù„Ù‡Ø°Ø§ Ø§Ù„Ù…Ø±ÙƒØ²" }, { status: 403 });
        }

        const cleanedTags = Array.isArray(tags) ? tags.filter((tag) => typeof tag === "string") : undefined;

        const updated = await db.knowledgeItem.update({
            where: { id: (await context.params).id },
            data: {
                ...(center ? { center } : {}),
                ...(type ? { type } : {}),
                ...(title ? { title } : {}),
                summary: summary === undefined ? undefined : summary || null,
                content: content === undefined ? undefined : content || null,
                mediaUrl: mediaUrl === undefined ? undefined : mediaUrl || null,
                coverImageUrl: coverImageUrl === undefined ? undefined : coverImageUrl || null,
                tags: cleanedTags,
                priority: Number.isFinite(priority) ? Number(priority) : undefined,
                status: status || undefined,
                authorName: authorName === undefined ? undefined : authorName || null,
                sourceLabel: sourceLabel === undefined ? undefined : sourceLabel || null,
            },
        });

        return NextResponse.json({ success: true, item: updated });
    } catch (error) {
        console.error("Admin knowledge PATCH error:", error);
        return NextResponse.json(
            { success: false, error: "ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø­ØªÙˆÙ‰" },
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

        const existing = await db.knowledgeItem.findUnique({
            where: { id: (await context.params).id },
            select: { center: true },
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: "Ø§Ù„Ù…Ø­ØªÙˆÙ‰ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" }, { status: 404 });
        }

        const permissions = (await getSessionPermissions()) ?? [];
        if (!hasCenterAccess(permissions, existing.center)) {
            return NextResponse.json({ success: false, error: "Ù„Ø§ ØªÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ© Ù„Ù‡Ø°Ø§ Ø§Ù„Ù…Ø±ÙƒØ²" }, { status: 403 });
        }

        await db.knowledgeItem.delete({ where: { id: (await context.params).id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin knowledge DELETE error:", error);
        return NextResponse.json(
            { success: false, error: "ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ù…Ø­ØªÙˆÙ‰" },
            { status: 500 }
        );
    }
}

