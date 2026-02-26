import { NextResponse } from "next/server";
import { isDemoMode, db } from "@/lib/db";

const demoStats = {
    incidentsOpen: 6,
    trainingsUpcoming: 4,
    checklistSubmissions: 128,
    avgScore: 86,
};

export async function GET() {
    try {
        if (isDemoMode) {
            return NextResponse.json({ success: true, stats: demoStats });
        }

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
