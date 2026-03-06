import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recalculateUserTrustScore } from "@/lib/services/trust-score";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { reviewerId, revieweeId, dealId, rating, comment } = body;

        if (!reviewerId || !revieweeId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "بيانات التقييم غير مكتملة أو غير صالحة" }, { status: 400 });
        }

        // Check if a review already exists for this exact combination
        const existingReview = await db.review.findFirst({
            where: {
                reviewerId,
                revieweeId,
                dealId: dealId || null,
            }
        });

        if (existingReview) {
            return NextResponse.json({ error: "لقد قمت بتقييم هذا المستخدم في هذه الصفقة مسبقاً" }, { status: 400 });
        }

        // Create the review
        const review = await db.review.create({
            data: {
                reviewerId,
                revieweeId,
                dealId: dealId || null,
                rating,
                comment,
            }
        });

        // Recalculate trust score
        await recalculateUserTrustScore(revieweeId);

        return NextResponse.json({ success: true, review });
    } catch (error: any) {
        console.error("Error submitting review:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء تقديم التقييم" }, { status: 500 });
    }
}
