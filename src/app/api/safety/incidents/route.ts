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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "4", 10), 20);
        const reporterPhone = searchParams.get("reporterPhone");

        const session = await getServerSession(authOptions);
        const sessionUser = session?.user as SessionUser | undefined;

        const whereClause: Record<string, any> = {};
        if (sessionUser?.id) whereClause.userId = sessionUser.id;
        if (!sessionUser?.id && reporterPhone) whereClause.reporterPhone = reporterPhone;

        const incidents = await db.safetyIncidentReport.findMany({
            select: {
                id: true,
                incidentType: true,
                severity: true,
                location: true,
                governorate: true,
                city: true,
                street: true,
                locationUrl: true,
                description: true,
                immediateAction: true,
                reporterCompanyName: true,
                status: true,
                createdAt: true,
            },
            where: Object.keys(whereClause).length ? whereClause : undefined,
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        return NextResponse.json({ success: true, incidents });
    } catch (error) {
        console.error("Safety incidents GET error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل البلاغات" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const sessionUser = session?.user as SessionUser | undefined;

        const body = await request.json();
        const {
            incidentType,
            severity,
            location,
            governorate,
            city,
            street,
            latitude,
            longitude,
            locationAccuracy,
            locationUrl,
            description,
            immediateAction,
            reporterName,
            reporterPhone,
            reporterRole,
            reporterCompanyName,
        } = body || {};

        if (!incidentType || !severity || !location || !description) {
            return NextResponse.json(
                { success: false, error: "يرجى تعبئة نوع البلاغ، الخطورة، الموقع، والوصف" },
                { status: 400 }
            );
        }

        const severityValue = String(severity).toUpperCase();
        const allowed = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
        if (!allowed.includes(severityValue)) {
            return NextResponse.json(
                { success: false, error: "مستوى الخطورة غير صالح" },
                { status: 400 }
            );
        }

        if (!sessionUser?.id && !reporterPhone) {
            return NextResponse.json(
                { success: false, error: "رقم الهاتف مطلوب للتواصل" },
                { status: 400 }
            );
        }

        const parsedLatitude = latitude !== undefined && latitude !== null ? Number(latitude) : null;
        const parsedLongitude = longitude !== undefined && longitude !== null ? Number(longitude) : null;
        const parsedAccuracy = locationAccuracy !== undefined && locationAccuracy !== null ? Number(locationAccuracy) : null;

        const incident = await db.$transaction(async (tx) => {
            const created = await tx.safetyIncidentReport.create({
                data: {
                    userId: sessionUser?.id,
                    reporterName: reporterName || sessionUser?.name || null,
                    reporterPhone: reporterPhone || sessionUser?.phone || null,
                    reporterRole: reporterRole || sessionUser?.userType || null,
                    reporterCompanyName: reporterCompanyName || null,
                    incidentType,
                    severity: severityValue,
                    location,
                    governorate: governorate || null,
                    city: city || null,
                    street: street || null,
                    locationUrl: locationUrl || null,
                    latitude: Number.isFinite(parsedLatitude) ? parsedLatitude : null,
                    longitude: Number.isFinite(parsedLongitude) ? parsedLongitude : null,
                    locationAccuracy: Number.isFinite(parsedAccuracy) ? Math.round(parsedAccuracy) : null,
                    description,
                    immediateAction,
                    status: "IN_REVIEW",
                },
            });

            await tx.safetyIncidentStatusLog.create({
                data: {
                    incidentId: created.id,
                    status: "IN_REVIEW",
                    note: "تم استلام البلاغ وبدء المراجعة",
                },
            });

            return created;
        });

        const recipient = process.env.SAFETY_WHATSAPP_RECIPIENT || "";
        const hasCoords = Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude);
        const mapLink = hasCoords ? `https://maps.google.com/?q=${parsedLatitude},${parsedLongitude}` : "";

        const messageLines = [
            "⚠️ بلاغ سلامة جديد",
            `نوع البلاغ: ${incidentType}`,
            `مستوى الخطورة: ${severityValue}`,
            `الموقع: ${location}`,
            governorate ? `المحافظة: ${governorate}` : "",
            city ? `المدينة: ${city}` : "",
            street ? `الشارع/الحي: ${street}` : "",
            hasCoords ? `الموقع على الخريطة: ${mapLink}` : "",
            parsedAccuracy ? `دقة الموقع: ${Math.round(parsedAccuracy)}م` : "",
            `الوصف: ${description}`,
            immediateAction ? `إجراءات فورية: ${immediateAction}` : "",
            `اسم المبلغ: ${reporterName || sessionUser?.name || "غير محدد"}`,
            `رقم الهاتف: ${reporterPhone || sessionUser?.phone || "غير متوفر"}`,
            reporterCompanyName ? `اسم المنشأة: ${reporterCompanyName}` : "",
            "الحالة: قيد المراجعة",
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
            incidentId: incident.id,
            message: whatsappError
                ? "تم استلام البلاغ، لكن تعذر إرسال إشعار واتساب فوري"
                : "تم استلام البلاغ وسيتم التواصل عند الحاجة",
            whatsappStatus: whatsappError ? "failed" : "sent",
            whatsappError,
        });
    } catch (error) {
        console.error("Safety incidents POST error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر استقبال البلاغ حالياً" },
            { status: 500 }
        );
    }
}
