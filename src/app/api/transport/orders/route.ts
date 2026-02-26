import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoMode, db } from "@/lib/db";

interface SessionUser {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
}

interface TransportOrder {
    id: string;
    trackingId: string;
    status: string;
    statusAr: string;
    materialType: string;
    materialName: string;
    weight: number;
    pickupGovernorate: string;
    deliveryGovernorate: string;
    pricingType: string;
    pricingTypeName: string;
    offersCount: number;
    createdAt: string;
}

const materialNames: Record<string, string> = {
    metals: "معادن",
    iron: "حديد",
    plastic: "بلاستيك",
    rebar: "حديد إنشائات",
    cement: "أسمنت",
    copper: "نحاس",
    aluminum: "ألمنيوم",
    paper: "ورق",
    brass: "نحاس أصفر",
    steel: "صلب",
    zinc: "زنك",
    other: "أخرى",
};

const pricingTypeNames: Record<string, string> = {
    per_ton: "أجرة الطن",
    full_vehicle: "أجرة السيارة",
};

const statusNames: Record<string, string> = {
    OPEN: "مفتوح للعروض",
    HAS_OFFERS: "لديه عروض",
    CONFIRMED: "تم التأكيد",
    IN_TRANSIT: "في الطريق",
    DELIVERED: "تم التسليم",
    CANCELLED: "ملغي",
};

function getDemoOrders(): TransportOrder[] {
    return [
        {
            id: "demo-1",
            trackingId: "REQ2402ABC123",
            status: "HAS_OFFERS",
            statusAr: "لديه عروض",
            materialType: "metals",
            materialName: "معادن",
            weight: 2.5,
            pickupGovernorate: "حلب",
            deliveryGovernorate: "دمشق",
            pricingType: "per_ton",
            pricingTypeName: "أجرة الطن",
            offersCount: 3,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: "demo-2",
            trackingId: "REQ2401XYZ789",
            status: "OPEN",
            statusAr: "مفتوح للعروض",
            materialType: "iron",
            materialName: "حديد",
            weight: 5,
            pickupGovernorate: "حمص",
            deliveryGovernorate: "حلب",
            pricingType: "full_vehicle",
            pricingTypeName: "أجرة السيارة",
            offersCount: 0,
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: "demo-3",
            trackingId: "REQ2401DEF456",
            status: "IN_TRANSIT",
            statusAr: "في الطريق",
            materialType: "plastic",
            materialName: "بلاستيك",
            weight: 3,
            pickupGovernorate: "دمشق",
            deliveryGovernorate: "اللاذقية",
            pricingType: "per_ton",
            pricingTypeName: "أجرة الطن",
            offersCount: 2,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: "demo-4",
            trackingId: "REQ2400GHI012",
            status: "DELIVERED",
            statusAr: "تم التسليم",
            materialType: "rebar",
            materialName: "حديد إنشائات",
            weight: 8,
            pickupGovernorate: "حماة",
            deliveryGovernorate: "طرطوس",
            pricingType: "full_vehicle",
            pricingTypeName: "أجرة السيارة",
            offersCount: 5,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");
        const view = searchParams.get("view");

        if (isDemoMode) {
            let orders = getDemoOrders();
            if (status && status !== "all") {
                orders = orders.filter(o => o.status === status);
            }
            return NextResponse.json({
                success: true,
                orders,
                total: orders.length,
                hasMore: false,
            });
        }

        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك", success: false }, { status: 401 });
        }

        const sessionUser = session.user as SessionUser;
        const userId = sessionUser.id;

        const where: any = {};
        
        // If it's the driver loads board, show all available orders (don't limit to userId)
        if (view !== "driver") {
            where.userId = userId;
        }

        if (status && status !== "all") {
            where.status = status;
        }

        const [bookings, total] = await Promise.all([
            db.transportBooking.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            db.transportBooking.count({ where }),
        ]);

        const orders: TransportOrder[] = bookings.map(booking => ({
            id: booking.id,
            trackingId: booking.trackingId,
            status: booking.status,
            statusAr: statusNames[booking.status] || booking.status,
            materialType: booking.materialType,
            materialName: materialNames[booking.materialType] || booking.materialType,
            weight: booking.weight,
            pickupGovernorate: booking.pickupGovernorate,
            deliveryGovernorate: booking.deliveryGovernorate,
            pricingType: booking.transportType,
            pricingTypeName: pricingTypeNames[booking.transportType] || booking.transportType,
            offersCount: 0,
            createdAt: booking.createdAt.toISOString(),
        }));

        return NextResponse.json({
            success: true,
            orders,
            total,
            hasMore: offset + limit < total,
        });
    } catch (error) {
        console.error("Get transport orders error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب الطلبات", success: false }, { status: 500 });
    }
}
