import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface SessionUser {
    id: string;
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const sessionUser = session?.user as SessionUser | undefined;

        if (!sessionUser?.id) {
            return NextResponse.json({ success: true, latestScore: null });
        }

        const latest = await db.safetyChecklistSubmission.findFirst({
            where: { userId: sessionUser.id },
            orderBy: { createdAt: "desc" },
            select: { score: true, createdAt: true },
        });

        return NextResponse.json({
            success: true,
            latestScore: latest?.score ?? null,
            latestAt: latest?.createdAt ?? null,
        });
    } catch (error) {
        console.error("Safety checklist summary error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل ملخص التقييم" },
            { status: 500 }
        );
    }
}
