import { NextRequest, NextResponse } from "next/server";
import { db, isDemoMode } from "@/lib/db";

// GET: Fetch all bids for a trackingId
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const rawTrackingId = searchParams.get('trackingId');
        const trackingId = rawTrackingId ? rawTrackingId.trim() : null;

        if (!trackingId) {
            return NextResponse.json({ error: "Missing trackingId", success: false }, { status: 400 });
        }

        const booking = await db.transportBooking.findUnique({
            where: { trackingId },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found", success: false }, { status: 404 });
        }

        const notes = booking.notes || "{}";
        let parsedNotes: any = {};
        try { parsedNotes = JSON.parse(notes); } catch (e) { }

        const offers = parsedNotes.offers || [];

        return NextResponse.json({ success: true, offers });
    } catch (error) {
        console.error("Fetch Bids API Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب العروض", success: false }, { status: 500 });
    }
}

// POST: Add a new bid (Driver action)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { driverId, driverName, driverPhone, price, rating } = body;
        const trackingId = body.trackingId?.trim();

        if (!trackingId || !driverId || !price) {
            return NextResponse.json({ error: "Missing fields", success: false }, { status: 400 });
        }

        if (isDemoMode) {
            return NextResponse.json({ success: true, message: "تم إرسال العرض بنجاح (وضع تجريبي)" });
        }

        let booking = await db.transportBooking.findUnique({
            where: { trackingId },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found", success: false }, { status: 404 });
        }

        const notes = booking.notes || "{}";
        let parsedNotes: any = {};
        try { parsedNotes = JSON.parse(notes); } catch (e) { parsedNotes = { original_notes: notes }; }

        const offers = parsedNotes.offers || [];
        
        // Prevent duplicate bids from same driver
        const existingOfferIndex = offers.findIndex((o: any) => o.driverId === driverId);
        if (existingOfferIndex !== -1) {
            offers[existingOfferIndex].price = price; // Update price
            offers[existingOfferIndex].timestamp = new Date().toISOString();
        } else {
            offers.push({
                driverId,
                driverName,
                driverPhone,
                price: Number(price),
                rating,
                timestamp: new Date().toISOString(),
                status: "PENDING"
            });
        }

        parsedNotes.offers = offers;

        await db.transportBooking.update({
            where: { trackingId },
            data: {
                notes: JSON.stringify(parsedNotes),
                status: booking.status === "OPEN" ? "HAS_OFFERS" : booking.status
            }
        });

        return NextResponse.json({ success: true, message: "تم إرسال العرض بنجاح" });

    } catch (error) {
        console.error("Submit Bid API Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء إرسال العرض", success: false }, { status: 500 });
    }
}

// PATCH: Accept a bid (Shipper action)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { driverId } = body;
        const trackingId = body.trackingId?.trim();

        if (!trackingId || !driverId) {
            return NextResponse.json({ error: "Missing fields", success: false }, { status: 400 });
        }

        const booking = await db.transportBooking.findUnique({
            where: { trackingId },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found", success: false }, { status: 404 });
        }

        const notes = booking.notes || "{}";
        let parsedNotes: any = {};
        try { parsedNotes = JSON.parse(notes); } catch (e) { parsedNotes = { original_notes: notes }; }

        const offers = parsedNotes.offers || [];
        const acceptedOffer = offers.find((o: any) => o.driverId === driverId);

        if (!acceptedOffer) {
             return NextResponse.json({ error: "Offer not found", success: false }, { status: 404 });
        }

        // Mark this one as ACCEPTED, others as REJECTED
        const updatedOffers = offers.map((o: any) => ({
            ...o,
            status: o.driverId === driverId ? "ACCEPTED" : "REJECTED"
        }));

        parsedNotes.offers = updatedOffers;

        await db.transportBooking.update({
            where: { trackingId },
            data: {
                status: "CONFIRMED_AWAITING_DETAILS", // Custom logical status
                actualPrice: acceptedOffer.price,
                driverId: acceptedOffer.driverId,
                driverName: acceptedOffer.driverName,
                driverPhone: acceptedOffer.driverPhone,
                notes: JSON.stringify(parsedNotes)
            }
        });

        return NextResponse.json({ success: true, message: "تم قبول العرض والاتفاق بنجاح" });

    } catch (error) {
        console.error("Accept Bid API Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء الموافقة على العرض", success: false }, { status: 500 });
    }
}
