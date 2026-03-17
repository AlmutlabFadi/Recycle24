import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PERMISSIONS, requirePermission } from "@/lib/rbac";

type StoredOffer = {
    driverId: string;
    driverName?: string;
    driverPhone?: string;
    price: number;
    rating?: number;
    timestamp: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
};

type BookingNotes = {
    offers?: StoredOffer[];
    dispatchDetails?: Record<string, unknown>;
    original_notes?: string;
};

function parseBookingNotes(notes: string | null): BookingNotes {
    if (!notes) return {};
    try {
        const parsed = JSON.parse(notes) as BookingNotes;
        return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
        return { original_notes: notes };
    }
}

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_DRIVERS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "all";
        const limit = Math.min(parseInt(searchParams.get("limit") || "40"), 120);
        const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

        const bookings = await db.transportBooking.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
        });

        const offers = bookings.flatMap((booking) => {
            const parsed = parseBookingNotes(booking.notes);
            const stored = Array.isArray(parsed.offers) ? parsed.offers : [];
            return stored
                .filter((offer) => (status === "all" ? true : offer.status === status))
                .map((offer) => ({
                    trackingId: booking.trackingId,
                    bookingStatus: booking.status,
                    pickupGovernorate: booking.pickupGovernorate,
                    deliveryGovernorate: booking.deliveryGovernorate,
                    weight: booking.weight,
                    materialType: booking.materialType,
                    offer,
                }));
        });

        return NextResponse.json({ ok: true, offers });
    } catch (error) {
        console.error("Admin transport offers error:", error);
        return NextResponse.json({ error: "FETCH_TRANSPORT_OFFERS_FAILED" }, { status: 500 });
    }
}
