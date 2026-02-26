import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST: Driver submits their vehicle and time details post-acceptance
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { trackingId, eta, date, timeWindow, vehicleType, plateNumber, vehicleColor, notes } = body;

        if (!trackingId || !date || !timeWindow || !plateNumber) {
            return NextResponse.json({ error: "بيانات ناقصة لإكمال التفاصيل", success: false }, { status: 400 });
        }

        const booking = await db.transportBooking.findUnique({
            where: { trackingId },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found", success: false }, { status: 404 });
        }

        const existingNotes = booking.notes || "{}";
        let parsedNotes: any = {};
        try { parsedNotes = JSON.parse(existingNotes); } catch (e) { parsedNotes = { original_notes: existingNotes }; }

        parsedNotes.dispatchDetails = {
            eta,
            date,
            timeWindow,
            vehicleColor,
            notes,
            submittedAt: new Date().toISOString()
        };

        // If the status was marking that we await details, we now move to IN_TRANSIT (or fully CONFIRMED)
        // IN_TRANSIT makes sense for live tracking to begin. Let's use IN_TRANSIT.

        await db.transportBooking.update({
            where: { trackingId },
            data: {
                status: "IN_TRANSIT",
                vehicleType: vehicleType || booking.vehicleType,
                plateNumber: plateNumber,
                notes: JSON.stringify(parsedNotes)
            }
        });

        return NextResponse.json({ success: true, message: "تم تثبيت تفاصيل الرحلة بنجاح" });

    } catch (error) {
        console.error("Dispatch API Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء حفظ التفاصيل الإضافية", success: false }, { status: 500 });
    }
}
