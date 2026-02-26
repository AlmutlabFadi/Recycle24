import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const status = searchParams.get("status") || "ACTIVE";

        const reports = await db.stolenReport.findMany({
            where: {
                status: status,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });

        return NextResponse.json({
            success: true,
            reports,
        });
    } catch (error) {
        console.error("Get stolen reports error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء جلب البلاغات", success: false },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        // We allow anonymous reporting, or we can tie it to a user if logged in
        let userId = null;
        if (session?.user) {
            userId = (session.user as any).id;
        }

        const body = await request.json();
        const {
            reportingOrg,
            type,
            customItemType,
            description,
            location,
            contactPhone,
            plateNumber,
            vehicleType,
            vehicleColor,
            stolenDate,
            images,
            videos,
        } = body;

        if (!reportingOrg || !type || !description || !location || !contactPhone || !stolenDate) {
            return NextResponse.json(
                { error: "جميع الحقول الإلزامية مطلوبة", success: false },
                { status: 400 }
            );
        }

        const report = await db.stolenReport.create({
            data: {
                userId,
                reportingOrg,
                type,
                customItemType,
                description,
                location,
                contactPhone,
                plateNumber,
                vehicleType,
                vehicleColor,
                stolenDate: new Date(stolenDate),
                images: images || [],
                videos: videos || [],
                status: "ACTIVE",
            },
        });

        return NextResponse.json({
            success: true,
            message: "تم تقديم البلاغ بنجاح",
            report,
        });
    } catch (error) {
        console.error("Create stolen report error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء تقديم البلاغ", success: false },
            { status: 500 }
        );
    }
}
