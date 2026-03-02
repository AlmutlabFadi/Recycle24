import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {

        const [incidentsOpen, trainingsUpcoming, checklistCount, avgScore] = await Promise.all([
            db.safetyIncidentReport.count({
                where: { status: { in: ["OPEN", "IN_REVIEW"] } },
            }),
            db.safetyTrainingSession.count({
                where: { status: "OPEN", startDate: { gte: new Date() } },
            }),
            db.safetyChecklistSubmission.count(),
            db.safetyChecklistSubmission.aggregate({
                _avg: { score: true },
            }),
        ]);

        return NextResponse.json({
            success: true,
            stats: {
                incidentsOpen,
                trainingsUpcoming,
                checklistSubmissions: checklistCount,
                avgScore: Math.round(avgScore._avg.score || 0),
            },
        });
    } catch (error) {
        console.error("Safety overview error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل مؤشرات السلامة حالياً" },
            { status: 500 }
        );
    }
}
