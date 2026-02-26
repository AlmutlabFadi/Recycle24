import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, isDemoMode } from "@/lib/db";

interface SessionUser {
    id: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const sessionUser = session?.user as SessionUser | undefined;

        const body = await request.json();
        const { checklistName, score, responses, notes, sessionId } = body || {};

        if (!checklistName || !Array.isArray(responses)) {
            return NextResponse.json(
                { success: false, error: "يرجى إدخال اسم التقييم والإجابات" },
                { status: 400 }
            );
        }

        const parsedScore = Math.max(0, Math.min(100, parseInt(score || 0, 10)));

        if (isDemoMode) {
            return NextResponse.json({
                success: true,
                submissionId: `demo-${Date.now()}`,
                message: "تم حفظ التقييم (وضع تجريبي)",
            });
        }

        const submission = await db.safetyChecklistSubmission.create({
            data: {
                userId: sessionUser?.id,
                sessionId: sessionId || null,
                checklistName,
                score: parsedScore,
                responses,
                notes: notes || null,
            },
        });

        return NextResponse.json({
            success: true,
            submissionId: submission.id,
            message: "تم حفظ التقييم بنجاح",
        });
    } catch (error) {
        console.error("Safety checklist error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر حفظ التقييم" },
            { status: 500 }
        );
    }
}
