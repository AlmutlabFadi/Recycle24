import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_LIMIT = 30;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const center = searchParams.get("center") || undefined;
        const type = searchParams.get("type") || undefined;
        const status = searchParams.get("status") || "PUBLISHED";
        const parsedLimit = parseInt(searchParams.get("limit") || `${DEFAULT_LIMIT}`, 10);
        const limit = Number.isNaN(parsedLimit) ? DEFAULT_LIMIT : Math.min(parsedLimit, 100);

        const items = await db.knowledgeItem.findMany({
            where: {
                status,
                ...(center ? { center } : {}),
                ...(type ? { type } : {}),
            },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
            take: limit,
        });

        return NextResponse.json({ success: true, items });
    } catch (error) {
        console.error("Knowledge GET error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل المحتوى حالياً" },
            { status: 500 }
        );
    }
}
