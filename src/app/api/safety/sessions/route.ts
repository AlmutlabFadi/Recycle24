import { NextResponse } from "next/server";
import { db, isDemoMode } from "@/lib/db";

const demoSessions = [
    {
        id: "demo-session-1",
        title: "الاستجابة لمخلفات الحرب غير المنفجرة",
        description: "تدريب عملي على التعرف والإبلاغ الآمن والتصرف الصحيح.",
        level: "BASIC",
        location: "دمشق - مركز التدريب الصناعي",
        startDate: new Date(Date.now() + 3 * 86400000),
        durationHours: 4,
        capacity: 30,
        availableSeats: 12,
        instructorName: "م. رائد الحسن",
        status: "OPEN",
    },
    {
        id: "demo-session-2",
        title: "إدارة المواد الخطرة في ساحات الخردة",
        description: "تصنيف، تخزين، ونقل البطاريات والمواد الكيميائية بأمان.",
        level: "ADVANCED",
        location: "حلب - مركز السلامة المهنية",
        startDate: new Date(Date.now() + 6 * 86400000),
        durationHours: 6,
        capacity: 25,
        availableSeats: 7,
        instructorName: "د. ناهد شهاب",
        status: "OPEN",
    },
    {
        id: "demo-session-3",
        title: "خطة الطوارئ والإخلاء السريع",
        description: "محاكاة سيناريوهات الحرائق والانفجارات وكيفية الإخلاء.",
        level: "BASIC",
        location: "حمص - قاعة الدفاع المدني",
        startDate: new Date(Date.now() + 9 * 86400000),
        durationHours: 3,
        capacity: 40,
        availableSeats: 21,
        instructorName: "م. هبة المصري",
        status: "OPEN",
    },
];

export async function GET() {
    try {
        if (isDemoMode) {
            return NextResponse.json({ success: true, sessions: demoSessions });
        }

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
