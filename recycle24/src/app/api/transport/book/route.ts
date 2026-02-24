import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoMode, db } from "@/lib/db";
import { z } from "zod";

interface SessionUser {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
}

const bookingSchema = z.object({
    materialType: z.string().min(1, "نوع المادة مطلوب"),
    weight: z.string().min(1, "الوزن مطلوب"),
    pickupAddress: z.string().min(3, "عنوان الاستلام قصير جداً"),
    pickupGovernorate: z.string().min(1, "محافظة الاستلام مطلوبة"),
    deliveryAddress: z.string().min(3, "عنوان التسليم قصير جداً"),
    deliveryGovernorate: z.string().min(1, "محافظة التسليم مطلوبة"),
    pickupDate: z.string().optional(),
    notes: z.string().optional(),
    pricingType: z.enum(["per_ton", "full_vehicle"]),
});

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

function getDistance(from: string, to: string): number {
    return distanceMatrix[from]?.[to] ?? 200;
}

function generateRequestId(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REQ${year}${month}${random}`;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك", success: false }, { status: 401 });
        }

        const sessionUser = session.user as SessionUser;
        const userId = sessionUser.id;

        const body = await request.json();
        const validationResult = bookingSchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.issues.map((e: { message: string }) => e.message).join(", ");
            return NextResponse.json({ error: errors, success: false }, { status: 400 });
        }

        const data = validationResult.data;
        const weight = parseFloat(data.weight);

        if (isNaN(weight) || weight <= 0) {
            return NextResponse.json({ error: "الوزن يجب أن يكون رقماً موجباً", success: false }, { status: 400 });
        }

        const distance = getDistance(data.pickupGovernorate, data.deliveryGovernorate);
        const requestId = generateRequestId();
        const estimatedDuration = Math.ceil(distance / 60);

        if (isDemoMode) {
            return NextResponse.json({
                success: true,
                booking: {
                    id: `demo-${Date.now()}`,
                    trackingId: requestId,
                    status: "OPEN",
                    materialType: data.materialType,
                    weight,
                    pickupAddress: data.pickupAddress,
                    pickupGovernorate: data.pickupGovernorate,
                    deliveryAddress: data.deliveryAddress,
                    deliveryGovernorate: data.deliveryGovernorate,
                    pricingType: data.pricingType,
                    estimatedDuration,
                    distance,
                    offersCount: 0,
                    createdAt: new Date().toISOString(),
                },
                message: "تم نشر طلب النقل بنجاح (وضع تجريبي)",
            });
        }

        const booking = await db.transportBooking.create({
            data: {
                userId,
                trackingId: requestId,
                materialType: data.materialType,
                weight,
                pickupAddress: data.pickupAddress,
                pickupGovernorate: data.pickupGovernorate,
                deliveryAddress: data.deliveryAddress,
                deliveryGovernorate: data.deliveryGovernorate,
                pickupDate: data.pickupDate ? new Date(data.pickupDate) : new Date(),
                notes: data.notes,
                transportType: data.pricingType,
                status: "OPEN",
                estimatedPrice: 0,
            },
        });

        return NextResponse.json({
            success: true,
            booking: {
                id: booking.id,
                trackingId: booking.trackingId,
                status: booking.status,
                materialType: booking.materialType,
                weight: booking.weight,
                pricingType: data.pricingType,
                estimatedDuration,
                distance,
                createdAt: booking.createdAt.toISOString(),
            },
            message: "تم نشر طلب النقل بنجاح",
        });
    } catch (error) {
        console.error("Book transport error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء نشر الطلب", success: false }, { status: 500 });
    }
}
