import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {

        const sessions = await db.safetyTrainingSession.findMany({
            where: {
                status: { in: ["OPEN", "FULL"] },
                startDate: { gte: new Date() },
            },
            orderBy: { startDate: "asc" },
            take: 6,
        });

        return NextResponse.json({ success: true, sessions });
    } catch (error) {
        console.error("Safety sessions error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل جلسات التدريب" },
            { status: 500 }
        );
    }
}
