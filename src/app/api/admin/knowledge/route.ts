import { NextRequest, NextResponse } from "next/server";
import { getUserPermissions, hasCenterAccess, requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_KNOWLEDGE");
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { searchParams } = new URL(request.url);
        const center = searchParams.get("center") || undefined;
        const type = searchParams.get("type") || undefined;
        const status = searchParams.get("status") || undefined;
        const parsedLimit = parseInt(searchParams.get("limit") || "60", 10);
        const limit = Number.isNaN(parsedLimit) ? 60 : Math.min(parsedLimit, 200);

        const permissions = await getUserPermissions(access.userId);
        const allowedCenters = [
            "SAFETY",
            "CONSULTATIONS",
            "ACADEMY",
        ].filter((center) => hasCenterAccess(permissions, center));

        const centerFilter = center
            ? { center }
            : allowedCenters.length
                ? { center: { in: allowedCenters } }
                : { center: "__NONE__" };

        const items = await db.knowledgeItem.findMany({
            where: {
                ...centerFilter,
                ...(type ? { type } : {}),
                ...(status ? { status } : {}),
            },
            orderBy: [{ updatedAt: "desc" }],
            take: limit,
        });

        return NextResponse.json({ success: true, items });
    } catch (error) {
        console.error("Admin knowledge GET error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل محتوى الإدارة" },
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

        if (!center || !type || !title) {
            return NextResponse.json(
                { success: false, error: "الحقول الأساسية مطلوبة" },
                { status: 400 }
            );
        }

        const permissions = await getUserPermissions(access.userId);
        if (!hasCenterAccess(permissions, center)) {
            return NextResponse.json(
                { success: false, error: "لا تملك صلاحية لهذا المركز" },
                { status: 403 }
            );
        }

        if (type === "VIDEO" || type === "IMAGE") {
            if (!mediaUrl) {
                return NextResponse.json(
                    { success: false, error: "رابط الوسائط مطلوب لهذا النوع" },
                    { status: 400 }
                );
            }
        }

        const cleanedTags = Array.isArray(tags) ? tags.filter((tag) => typeof tag === "string") : [];

        const item = await db.knowledgeItem.create({
            data: {
                center,
                type,
                title,
                summary: summary || null,
                content: content || null,
                mediaUrl: mediaUrl || null,
                coverImageUrl: coverImageUrl || null,
                tags: cleanedTags,
                priority: Number.isFinite(priority) ? Number(priority) : 0,
                status: status || "DRAFT",
                authorName: authorName || null,
                sourceLabel: sourceLabel || null,
                createdById: access.userId,
            },
        });

        return NextResponse.json({ success: true, item });
    } catch (error) {
        console.error("Admin knowledge POST error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر حفظ المحتوى" },
            { status: 500 }
        );
    }
}
