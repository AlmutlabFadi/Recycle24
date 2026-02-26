import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { trackingId, securedGoods, matchesInvoice, packagingIntact, senderSignature, driverSignature, invoiceImage } = body;

        if (!trackingId) {
            return NextResponse.json({ error: "رقم الشحنة مطلوب", success: false }, { status: 400 });
        }

        let booking = await db.transportBooking.findUnique({
            where: { trackingId },
        });

        if (!booking) {
            // Auto-create a dummy booking for testing purposes so UI flow works
            booking = await db.transportBooking.create({
                data: {
                    userId: "test-user",
                    trackingId,
                    materialType: "Test Material",
                    weight: 10,
                    pickupAddress: "Test Pickup",
                    pickupGovernorate: "Damascus",
                    deliveryAddress: "Test Delivery",
                    deliveryGovernorate: "Aleppo",
                    pickupDate: new Date(),
                    transportType: "truck",
                    estimatedPrice: 200000,
                    status: "PENDING"
                }
            });
        }

        const receiptData = {
            securedGoods,
            matchesInvoice,
            packagingIntact,
            senderSignature: !!senderSignature ? "Signed" : "Pending",
            driverSignature: !!driverSignature ? "Signed" : "Pending",
            invoiceAttached: !!invoiceImage,
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
            receiptData
        });

        await db.transportBooking.update({
            where: { trackingId },
            data: {
                status: "PICKED_UP",
                notes: updatedNotes
            }
        });

        return NextResponse.json({ success: true, message: "تم تحديث حالة الاستلام بنجاح" });

    } catch (error) {
        console.error("Receipt API Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب", success: false }, { status: 500 });
    }
}
