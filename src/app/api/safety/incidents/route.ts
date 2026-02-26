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

const demoIncidents = [
    {
        id: "demo-incident-1",
        incidentType: "مخلفات حرب",
        severity: "CRITICAL",
        location: "ريف دمشق - ببيلا",
        status: "OPEN",
        createdAt: new Date(Date.now() - 4 * 3600000),
    },
    {
        id: "demo-incident-2",
        incidentType: "تسرب بطارية",
        severity: "HIGH",
        location: "حلب - الشيخ نجار",
        status: "IN_REVIEW",
        createdAt: new Date(Date.now() - 7 * 3600000),
    },
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "4", 10), 20);

        if (isDemoMode) {
            return NextResponse.json({ success: true, incidents: demoIncidents.slice(0, limit) });
        }

        const incidents = await db.safetyIncidentReport.findMany({
            select: {
                id: true,
                incidentType: true,
                severity: true,
                location: true,
                status: true,
                createdAt: true,
            },
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
            description,
            immediateAction,
            reporterName,
            reporterPhone,
            reporterRole,
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

        if (isDemoMode) {
            return NextResponse.json({
                success: true,
                incidentId: `demo-${Date.now()}`,
                message: "تم استلام البلاغ (وضع تجريبي)",
            });
        }

        const incident = await db.safetyIncidentReport.create({
            data: {
                userId: sessionUser?.id,
                reporterName: reporterName || sessionUser?.name || null,
                reporterPhone: reporterPhone || sessionUser?.phone || null,
                reporterRole: reporterRole || sessionUser?.userType || null,
                incidentType,
                severity: severityValue,
                location,
                description,
                immediateAction,
                status: "OPEN",
            },
        });

        return NextResponse.json({
            success: true,
            incidentId: incident.id,
            message: "تم استلام البلاغ وسيتم التواصل عند الحاجة",
        });
    } catch (error) {
        console.error("Safety incidents POST error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر استقبال البلاغ حالياً" },
            { status: 500 }
        );
    }
}
