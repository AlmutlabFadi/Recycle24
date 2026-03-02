import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsAppText } from "@/lib/whatsapp";

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
            requesterCompanyName,
            location,
            governorate,
            city,
            street,
            locationUrl,
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

        const parsedPreferredDate = preferredDate ? new Date(preferredDate) : null;

        let sessionContactWhatsapp: string | null = null;
        let sessionTitle: string | null = null;
        const requestData = await db.$transaction(async (tx: any) => {
            if (sessionId) {
                const sessionData = await tx.safetyTrainingSession.findUnique({
                    where: { id: sessionId },
                });

                if (!sessionData || sessionData.status === "CANCELLED") {
                    throw new Error("SESSION_NOT_FOUND");
                }

                sessionContactWhatsapp = sessionData.contactWhatsapp || null;
                sessionTitle = sessionData.title || null;

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
                    requesterCompanyName: requesterCompanyName || null,
                    governorate: governorate || null,
                    city: city || null,
                    street: street || null,
                    locationUrl: locationUrl || null,
                    sessionId: sessionId || null,
                    requestedSessionTitle: requestedSessionTitle || null,
                    preferredDate: parsedPreferredDate,
                    participantsCount: count,
                    location,
                    notes,
                },
            });
        });

        const recipient = sessionContactWhatsapp || process.env.SAFETY_TRAINING_WHATSAPP_RECIPIENT || "";

        const messageLines = [
            "📣 طلب تدريب سلامة جديد",
            sessionId ? `الجلسة: ${sessionTitle || requestedSessionTitle || ""}` : "طلب تدريب مخصص",
            requestedSessionTitle ? `عنوان التدريب: ${requestedSessionTitle}` : "",
            preferredDate ? `تاريخ مفضل: ${preferredDate}` : "",
            `عدد المشاركين: ${count}`,
            `الموقع: ${location || "غير محدد"}`,
            governorate ? `المحافظة: ${governorate}` : "",
            city ? `المدينة: ${city}` : "",
            street ? `الشارع/الحي: ${street}` : "",
            locationUrl ? `رابط الموقع: ${locationUrl}` : "",
            notes ? `ملاحظات: ${notes}` : "",
            `اسم مقدم الطلب: ${requesterName || sessionUser?.name || "غير محدد"}`,
            `رقم الهاتف: ${requesterPhone || sessionUser?.phone || "غير متوفر"}`,
            requesterCompanyName ? `اسم المنشأة: ${requesterCompanyName}` : "",
        ].filter(Boolean);

        let whatsappError: string | undefined;
        if (recipient) {
            const sendResult = await sendWhatsAppText({ to: recipient, body: messageLines.join("\n") });
            if (!sendResult.ok) whatsappError = sendResult.error;
        } else {
            whatsappError = "WHATSAPP_RECIPIENT_NOT_SET";
        }

        return NextResponse.json({
            success: true,
            requestId: requestData.id,
            message: whatsappError
                ? "تم استلام طلب التدريب، لكن تعذر إرسال إشعار واتساب فوري"
                : "تم استلام طلب التدريب وسيتم التواصل قريباً",
            whatsappStatus: whatsappError ? "failed" : "sent",
            whatsappError,
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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 30);
        const requesterPhone = searchParams.get("requesterPhone");

        const session = await getServerSession(authOptions);
        const sessionUser = session?.user as SessionUser | undefined;

        const whereClause: Record<string, any> = {};
        if (sessionUser?.id) whereClause.userId = sessionUser.id;
        if (!sessionUser?.id && requesterPhone) whereClause.requesterPhone = requesterPhone;

        const requests = await db.safetyTrainingRequest.findMany({
            where: Object.keys(whereClause).length ? whereClause : undefined,
            select: {
                id: true,
                requestedSessionTitle: true,
                preferredDate: true,
                participantsCount: true,
                location: true,
                governorate: true,
                city: true,
                street: true,
                locationUrl: true,
                requesterCompanyName: true,
                notes: true,
                status: true,
                createdAt: true,
                session: {
                    select: {
                        title: true,
                        startDate: true,
                        location: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        return NextResponse.json({ success: true, requests });
    } catch (error) {
        console.error("Safety training requests GET error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل طلبات التدريب" },
            { status: 500 }
        );
    }
}
