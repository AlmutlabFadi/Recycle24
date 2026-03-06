import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const item = await db.knowledgeItem.findUnique({
            where: { id },
        });

        if (!item || item.status !== "PUBLISHED") {
            return NextResponse.json({ success: false, error: "غير متاح" }, { status: 404 });
        }

        return NextResponse.json({ success: true, item });
    } catch (error) {
        console.error("Knowledge item GET error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل المحتوى" },
            { status: 500 }
        );
    }
}
