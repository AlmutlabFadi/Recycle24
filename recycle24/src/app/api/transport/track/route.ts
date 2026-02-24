import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, db } from "@/lib/db";

interface TrackingStep {
    id: string;
    title: string;
    description: string;
    time: string | null;
    status: "completed" | "current" | "pending";
}

interface TrackingResponse {
    trackingId: string;
    status: string;
    statusAr: string;
    materialType: string;
    materialName: string;
    weight: number;
    pickupAddress: string;
    pickupGovernorate: string;
    deliveryAddress: string;
    deliveryGovernorate: string;
    pickupDate: string;
    transportType: string;
    transportTypeName: string;
    estimatedPrice: number;
    actualPrice: number | null;
    estimatedDuration: string;
    distance: number;
    driver: {
        name: string;
        phone: string;
        rating: number;
        vehicleType: string;
        plateNumber: string;
    } | null;
    trackingSteps: TrackingStep[];
    createdAt: string;
    updatedAt: string;
}

const materialNames: Record<string, string> = {
    iron: "حديد",
    copper: "نحاس",
    aluminum: "ألمنيوم",
    plastic: "بلاستيك",
    paper: "ورق",
    brass: "نحاس أصفر",
    steel: "صلب",
    zinc: "زنك",
    other: "أخرى",
};

const transportTypeNames: Record<string, string> = {
    pickup: "بيك أب",
    medium: "شاحنة متوسطة",
    large: "شاحنة كبيرة",
    trailer: "مقطورة",
};

const statusNames: Record<string, string> = {
    PENDING: "قيد الانتظار",
    CONFIRMED: "تم التأكيد",
    DRIVER_ASSIGNED: "تم تعيين السائق",
    PICKED_UP: "تم الاستلام",
    IN_TRANSIT: "في الطريق",
    DELIVERED: "تم التسليم",
    CANCELLED: "ملغي",
};

function getTrackingSteps(status: string, createdAt: Date, pickupDate: Date): TrackingStep[] {
    const formatDate = (d: Date) => {
        return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    };

    const steps: TrackingStep[] = [
        {
            id: "1",
            title: "تم استلام الطلب",
            description: "تم تسجيل طلب النقل وجاري مراجعته",
            time: formatDate(createdAt),
            status: ["PENDING", "CONFIRMED", "DRIVER_ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"].includes(status) ? "completed" : "pending",
        },
        {
            id: "2",
            title: "تم التأكيد",
            description: "تم تأكيد الحجز وجاري البحث عن سائق",
            time: null,
            status: ["CONFIRMED", "DRIVER_ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"].includes(status) ? "completed" : 
                    status === "PENDING" ? "pending" : "current",
        },
        {
            id: "3",
            title: "تعيين السائق",
            description: "تم تعيين سائق وهو في طريقه للاستلام",
            time: null,
            status: ["DRIVER_ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"].includes(status) ? "completed" : 
                    status === "CONFIRMED" ? "current" : "pending",
        },
        {
            id: "4",
            title: "جاري التحميل",
            description: "السائق وصل وبدأ تحميل الشحنة",
            time: null,
            status: ["PICKED_UP", "IN_TRANSIT", "DELIVERED"].includes(status) ? "completed" : 
                    status === "DRIVER_ASSIGNED" ? "current" : "pending",
        },
        {
            id: "5",
            title: "في الطريق",
            description: "الشحنة في طريقها إلى الوجهة",
            time: null,
            status: status === "IN_TRANSIT" ? "current" : 
                    status === "DELIVERED" ? "completed" : "pending",
        },
        {
            id: "6",
            title: "تم التسليم",
            description: "تم تسليم الشحنة بنجاح",
            time: null,
            status: status === "DELIVERED" ? "completed" : "pending",
        },
    ];

    return steps;
}

function calculateDistance(from: string, to: string): number {
    const distanceMatrix: Record<string, Record<string, number>> = {
        "دمشق": { "دمشق": 0, "ريف دمشق": 30, "حلب": 350, "حمص": 160, "حماة": 200, "اللاذقية": 350, "طرطوس": 280, "إدلب": 310, "الحسكة": 650, "دير الزور": 450, "الرقة": 400, "درعا": 100, "السويداء": 100, "القنيطرة": 80 },
        "ريف دمشق": { "دمشق": 30, "ريف دمشق": 0, "حلب": 370, "حمص": 180, "حماة": 220, "اللاذقية": 370, "طرطوس": 300, "إدلب": 330, "الحسكة": 670, "دير الزور": 470, "الرقة": 420, "درعا": 120, "السويداء": 120, "القنيطرة": 100 },
        "حلب": { "دمشق": 350, "ريف دمشق": 370, "حلب": 0, "حمص": 190, "حماة": 150, "اللاذقية": 200, "طرطوس": 230, "إدلب": 60, "الحسكة": 350, "دير الزور": 250, "الرقة": 170, "درعا": 450, "السويداء": 450, "القنيطرة": 430 },
        "حمص": { "دمشق": 160, "ريف دمشق": 180, "حلب": 190, "حمص": 0, "حماة": 50, "اللاذقية": 180, "طرطوس": 130, "إدلب": 150, "الحسكة": 420, "دير الزور": 300, "الرقة": 250, "درعا": 260, "السويداء": 260, "القنيطرة": 240 },
        "حماة": { "دمشق": 200, "ريف دمشق": 220, "حلب": 150, "حمص": 50, "حماة": 0, "اللاذقية": 150, "طرطوس": 120, "إدلب": 100, "الحسكة": 400, "دير الزور": 280, "الرقة": 220, "درعا": 300, "السويداء": 300, "القنيطرة": 280 },
        "اللاذقية": { "دمشق": 350, "ريف دمشق": 370, "حلب": 200, "حمص": 180, "حماة": 150, "اللاذقية": 0, "طرطوس": 90, "إدلب": 150, "الحسكة": 480, "دير الزور": 380, "الرقة": 350, "درعا": 450, "السويداء": 450, "القنيطرة": 430 },
        "طرطوس": { "دمشق": 280, "ريف دمشق": 300, "حلب": 230, "حمص": 130, "حماة": 120, "اللاذقية": 90, "طرطوس": 0, "إدلب": 180, "الحسكة": 450, "دير الزور": 350, "الرقة": 320, "درعا": 380, "السويداء": 380, "القنيطرة": 360 },
        "إدلب": { "دمشق": 310, "ريف دمشق": 330, "حلب": 60, "حمص": 150, "حماة": 100, "اللاذقية": 150, "طرطوس": 180, "إدلب": 0, "الحسكة": 320, "دير الزور": 220, "الرقة": 140, "درعا": 410, "السويداء": 410, "القنيطرة": 390 },
        "الحسكة": { "دمشق": 650, "ريف دمشق": 670, "حلب": 350, "حمص": 420, "حماة": 400, "اللاذقية": 480, "طرطوس": 450, "إدلب": 320, "الحسكة": 0, "دير الزور": 180, "الرقة": 200, "درعا": 750, "السويداء": 750, "القنيطرة": 730 },
        "دير الزور": { "دمشق": 450, "ريف دمشق": 470, "حلب": 250, "حمص": 300, "حماة": 280, "اللاذقية": 380, "طرطوس": 350, "إدلب": 220, "الحسكة": 180, "دير الزور": 0, "الرقة": 150, "درعا": 550, "السويداء": 550, "القنيطرة": 530 },
        "الرقة": { "دمشق": 400, "ريف دمشق": 420, "حلب": 170, "حمص": 250, "حماة": 220, "اللاذقية": 350, "طرطوس": 320, "إدلب": 140, "الحسكة": 200, "دير الزور": 150, "الرقة": 0, "درعا": 500, "السويداء": 500, "القنيطرة": 480 },
        "درعا": { "دمشق": 100, "ريف دمشق": 120, "حلب": 450, "حمص": 260, "حماة": 300, "اللاذقية": 450, "طرطوس": 380, "إدلب": 410, "الحسكة": 750, "دير الزور": 550, "الرقة": 500, "درعا": 0, "السويداء": 40, "القنيطرة": 60 },
        "السويداء": { "دمشق": 100, "ريف دمشق": 120, "حلب": 450, "حمص": 260, "حماة": 300, "اللاذقية": 450, "طرطوس": 380, "إدلب": 410, "الحسكة": 750, "دير الزور": 550, "الرقة": 500, "درعا": 40, "السويداء": 0, "القنيطرة": 80 },
        "القنيطرة": { "دمشق": 80, "ريف دمشق": 100, "حلب": 430, "حمص": 240, "حماة": 280, "اللاذقية": 430, "طرطوس": 360, "إدلب": 390, "الحسكة": 730, "دير الزور": 530, "الرقة": 480, "درعا": 60, "السويداء": 80, "القنيطرة": 0 },
    };
    return distanceMatrix[from]?.[to] ?? 200;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const trackingId = searchParams.get("trackingId");

        if (!trackingId) {
            return NextResponse.json({ error: "رقم الشحنة مطلوب", success: false }, { status: 400 });
        }

        if (isDemoMode) {
            const demoBooking = getDemoBooking(trackingId);
            if (!demoBooking) {
                return NextResponse.json({ error: "لم يتم العثور على الشحنة", success: false }, { status: 404 });
            }
            return NextResponse.json({ success: true, tracking: demoBooking });
        }

        const booking = await db.transportBooking.findUnique({
            where: { trackingId },
        });

        if (!booking) {
            return NextResponse.json({ error: "لم يتم العثور على الشحنة", success: false }, { status: 404 });
        }

        const distance = calculateDistance(booking.pickupGovernorate, booking.deliveryGovernorate);
        const estimatedHours = Math.ceil(distance / 60);

        const response: TrackingResponse = {
            trackingId: booking.trackingId,
            status: booking.status,
            statusAr: statusNames[booking.status] || booking.status,
            materialType: booking.materialType,
            materialName: materialNames[booking.materialType] || booking.materialType,
            weight: booking.weight,
            pickupAddress: booking.pickupAddress,
            pickupGovernorate: booking.pickupGovernorate,
            deliveryAddress: booking.deliveryAddress,
            deliveryGovernorate: booking.deliveryGovernorate,
            pickupDate: booking.pickupDate.toISOString(),
            transportType: booking.transportType,
            transportTypeName: transportTypeNames[booking.transportType] || booking.transportType,
            estimatedPrice: booking.estimatedPrice,
            actualPrice: booking.actualPrice,
            estimatedDuration: `~${estimatedHours} ساعة`,
            distance,
            driver: booking.driverName ? {
                name: booking.driverName,
                phone: booking.driverPhone || "",
                rating: 4.8,
                vehicleType: booking.vehicleType || "",
                plateNumber: booking.plateNumber || "",
            } : null,
            trackingSteps: getTrackingSteps(booking.status, booking.createdAt, booking.pickupDate),
            createdAt: booking.createdAt.toISOString(),
            updatedAt: booking.updatedAt.toISOString(),
        };

        return NextResponse.json({ success: true, tracking: response });
    } catch (error) {
        console.error("Track transport error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب بيانات الشحنة", success: false }, { status: 500 });
    }
}

function getDemoBooking(trackingId: string): TrackingResponse | null {
    const statuses = ["PENDING", "CONFIRMED", "DRIVER_ASSIGNED", "IN_TRANSIT", "DELIVERED"];
    const randomStatus = statuses[Math.floor(Math.random() * 3)];
    
    const createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const pickupDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const distance = 385;

    return {
        trackingId,
        status: randomStatus,
        statusAr: statusNames[randomStatus],
        materialType: "copper",
        materialName: "نحاس",
        weight: 0.5,
        pickupAddress: "المنطقة الصناعية، الشيخ نجار",
        pickupGovernorate: "حلب",
        deliveryAddress: "مستودع الأمل",
        deliveryGovernorate: "دمشق",
        pickupDate: pickupDate.toISOString(),
        transportType: "pickup",
        transportTypeName: "بيك أب",
        estimatedPrice: 127000,
        actualPrice: null,
        estimatedDuration: "~6 ساعات",
        distance,
        driver: randomStatus === "DRIVER_ASSIGNED" || randomStatus === "IN_TRANSIT" ? {
            name: "أحمد محمود",
            phone: "0991234567",
            rating: 4.8,
            vehicleType: "بيك أب تويوتا",
            plateNumber: "ح س 1234",
        } : null,
        trackingSteps: getTrackingSteps(randomStatus, createdAt, pickupDate),
        createdAt: createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
