import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { trackingId, type, content, channelName } = body;

        // trackingId would normally be verified against the DB
        // type: "audio_message", "location_share", "text_message"
        
        if (!trackingId || !type || !content) {
            return NextResponse.json({ error: "Missing required fields", success: false }, { status: 400 });
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
                    status: "IN_TRANSIT"
                }
            });
        }

        // We append the live communication to the "notes" JSON field to avoid breaking the schema for now
        const existingNotes = booking.notes || "{}";
        let parsedNotes: any = {};
        try {
            parsedNotes = JSON.parse(existingNotes);
        } catch (e) {
            parsedNotes = { original_notes: existingNotes };
        }

        const liveLogs = parsedNotes.liveLogs || [];
        liveLogs.push({
            type,
            content,
            channelName: channelName || "General",
            timestamp: new Date().toISOString()
        });

        const updatedNotes = JSON.stringify({
            ...parsedNotes,
            liveLogs
        });

        await db.transportBooking.update({
            where: { trackingId },
            data: {
                notes: updatedNotes
            }
        });

        return NextResponse.json({ success: true, message: "تم إرسال البيانات بنجاح" });

    } catch (error) {
        console.error("Live Messaging API Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب", success: false }, { status: 500 });
    }
}
