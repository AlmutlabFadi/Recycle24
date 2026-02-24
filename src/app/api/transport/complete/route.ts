import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { trackingId, condition, deliveryNotes, driverSignature, receiverSignature, scaleTicketImage, finalInvoiceImage } = body;

        if (!trackingId) {
            return NextResponse.json({ error: "رقم الشحنة مطلوب", success: false }, { status: 400 });
        }

        const booking = await db.transportBooking.findUnique({
            where: { trackingId },
        });

        if (!booking) {
            return NextResponse.json({ error: "الشحنة غير موجودة", success: false }, { status: 404 });
        }

        const deliveryData = {
            condition,
            deliveryNotes,
            driverSignature: !!driverSignature ? "Signed" : "Pending",
            receiverSignature: !!receiverSignature ? "Signed" : "Pending",
            scaleTicketAttached: !!scaleTicketImage,
            finalInvoiceAttached: !!finalInvoiceImage,
            timestamp: new Date().toISOString()
        };

        const existingNotes = booking.notes || "{}";
        let parsedNotes = {};
        try {
            parsedNotes = JSON.parse(existingNotes);
        } catch (e) {
            parsedNotes = { original_notes: existingNotes };
        }

        const updatedNotes = JSON.stringify({
            ...parsedNotes,
            deliveryData
        });

        await db.transportBooking.update({
            where: { trackingId },
            data: {
                status: "DELIVERED",
                notes: updatedNotes,
                actualPrice: booking.actualPrice || booking.estimatedPrice // Settle the price if not set
            }
        });

        return NextResponse.json({ success: true, message: "تم إنهاء التسليم بنجاح" });

    } catch (error) {
        console.error("Complete Delivery API Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب", success: false }, { status: 500 });
    }
}
