import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, isDemoMode } from "@/lib/db";

interface SessionUser {
    id: string;
    name?: string | null;
    phone?: string | null;
    userType?: string | null;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const sessionUser = session?.user as SessionUser | undefined;

        const body = await request.json();
        const {
            sessionId,
            requestedSessionTitle,
            preferredDate,
            participantsCount,
            requesterName,
            requesterPhone,
            requesterRole,
            location,
            notes,
        } = body || {};

        const count = Math.max(parseInt(participantsCount || 1, 10), 1);

        if (!sessionId && !requestedSessionTitle) {
            return NextResponse.json(
                { success: false, error: "يرجى اختيار جلسة أو كتابة عنوان التدريب المطلوب" },
                { status: 400 }
            );
        }

        if (!sessionUser?.id && !requesterPhone) {
            return NextResponse.json(
                { success: false, error: "رقم الهاتف مطلوب لتأكيد الحجز" },
                { status: 400 }
            );
        }

        if (isDemoMode) {
            return NextResponse.json({
                success: true,
                requestId: `demo-${Date.now()}`,
                message: "تم استلام طلب التدريب (وضع تجريبي)",
            });
        }

        const parsedPreferredDate = preferredDate ? new Date(preferredDate) : null;

        const requestData = await db.$transaction(async (tx: any) => {
            if (sessionId) {
                const sessionData = await tx.safetyTrainingSession.findUnique({
                    where: { id: sessionId },
                });

                if (!sessionData || sessionData.status === "CANCELLED") {
                    throw new Error("SESSION_NOT_FOUND");
                }

                if (sessionData.availableSeats < count) {
                    throw new Error("NO_SEATS");
                }

                await tx.safetyTrainingSession.update({
                    where: { id: sessionId },
                    data: {
                        availableSeats: sessionData.availableSeats - count,
                        status: sessionData.availableSeats - count <= 0 ? "FULL" : "OPEN",
                    },
                });
            }

            const rName: string | null = requesterName || sessionUser?.name || null;
            return tx.safetyTrainingRequest.create({
                data: {
                    userId: sessionUser?.id,
                    requesterName: rName,
                    requesterPhone: requesterPhone || sessionUser?.phone || null,
                    requesterRole: requesterRole || sessionUser?.userType || null,
                    sessionId: sessionId || null,
                    requestedSessionTitle: requestedSessionTitle || null,
                    preferredDate: parsedPreferredDate,
                    participantsCount: count,
                    location,
                    notes,
                },
            });
        });

        return NextResponse.json({
            success: true,
            requestId: requestData.id,
            message: "تم استلام طلب التدريب وسيتم التواصل قريباً",
        });
    } catch (error) {
        if (error instanceof Error && error.message === "SESSION_NOT_FOUND") {
            return NextResponse.json(
                { success: false, error: "الجلسة غير متاحة" },
                { status: 400 }
            );
        }
        if (error instanceof Error && error.message === "NO_SEATS") {
            return NextResponse.json(
                { success: false, error: "عدد المقاعد المتاحة غير كاف" },
                { status: 400 }
            );
        }

        console.error("Safety training request error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر استقبال طلب التدريب" },
            { status: 500 }
        );
    }
}
