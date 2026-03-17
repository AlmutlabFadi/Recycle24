import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
  if (!notes) {
    return {};
  }

  try {
    const parsed = JSON.parse(notes) as BookingNotes;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return { original_notes: notes };
  }
}

function isOffersStage(status: string): boolean {
  return status === "OPEN" || status === "HAS_OFFERS";
}

function hasAcceptedOffer(offers: StoredOffer[]): boolean {
  return offers.some((offer) => offer.status === "ACCEPTED");
}

function isDriverOnline(lastSeenAt?: Date | null) {
  if (!lastSeenAt) return false;
  const diffMs = Date.now() - lastSeenAt.getTime();
  return diffMs <= 10 * 60 * 1000;
}

// GET: fetch all offers by trackingId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get("trackingId")?.trim();

    if (!trackingId) {
      return NextResponse.json(
        { error: "معرف التتبع مطلوب", success: false },
        { status: 400 },
      );
    }

    const booking = await db.transportBooking.findUnique({
      where: { trackingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "طلب النقل غير موجود", success: false },
        { status: 404 },
      );
    }

    const parsedNotes = parseBookingNotes(booking.notes);
    const offers = Array.isArray(parsedNotes.offers) ? parsedNotes.offers : [];

    return NextResponse.json(
      {
        success: true,
        offers,
        bookingStatus: booking.status,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch transport offers API error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب العروض", success: false },
      { status: 500 },
    );
  }
}

// POST: add or update an offer
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      trackingId?: string;
      driverId?: string;
      driverName?: string;
      driverPhone?: string;
      price?: number | string;
      rating?: number | string;
    };

    const trackingId = body.trackingId?.trim();
    const driverId = body.driverId?.trim();
    const numericPrice = Number(body.price);
    const numericRating =
      body.rating === undefined || body.rating === null || body.rating === ""
        ? undefined
        : Number(body.rating);

    if (!trackingId || !driverId || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      return NextResponse.json(
        { error: "بيانات العرض غير مكتملة أو غير صالحة", success: false },
        { status: 400 },
      );
    }

    if (
      numericRating !== undefined &&
      (!Number.isFinite(numericRating) || numericRating < 0 || numericRating > 5)
    ) {
      return NextResponse.json(
        { error: "التقييم يجب أن يكون بين 0 و 5", success: false },
        { status: 400 },
      );
    }

    const booking = await db.transportBooking.findUnique({
      where: { trackingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "طلب النقل غير موجود", success: false },
        { status: 404 },
      );
    }

    if (!isOffersStage(booking.status)) {
      return NextResponse.json(
        { error: "هذا الطلب لم يعد متاحا لاستقبال العروض", success: false },
        { status: 409 },
      );
    }

    const parsedNotes = parseBookingNotes(booking.notes);
    const offers: StoredOffer[] = Array.isArray(parsedNotes.offers) ? parsedNotes.offers : [];

    if (hasAcceptedOffer(offers)) {
      return NextResponse.json(
        { error: "تم قبول عرض بالفعل ولا يمكن تعديل العروض الآن", success: false },
        { status: 409 },
      );
    }

    const existingOfferIndex = offers.findIndex((offer) => offer.driverId === driverId);
    const timestamp = new Date().toISOString();

    if (existingOfferIndex >= 0) {
      offers[existingOfferIndex] = {
        ...offers[existingOfferIndex],
        driverName: body.driverName ?? offers[existingOfferIndex].driverName,
        driverPhone: body.driverPhone ?? offers[existingOfferIndex].driverPhone,
        price: numericPrice,
        rating: numericRating ?? offers[existingOfferIndex].rating,
        timestamp,
        status: "PENDING",
      };
    } else {
      offers.push({
        driverId,
        driverName: body.driverName,
        driverPhone: body.driverPhone,
        price: numericPrice,
        rating: numericRating,
        timestamp,
        status: "PENDING",
      });
    }

    parsedNotes.offers = offers;

    await db.transportBooking.update({
      where: { trackingId },
      data: {
        notes: JSON.stringify(parsedNotes),
        status: booking.status === "OPEN" ? "HAS_OFFERS" : booking.status,
      },
    });

    return NextResponse.json(
      { success: true, message: "تم إرسال العرض بنجاح" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Submit transport offer API error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال العرض", success: false },
      { status: 500 },
    );
  }
}

// PATCH: accept an offer
export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      trackingId?: string;
      driverId?: string;
    };

    const trackingId = body.trackingId?.trim();
    const driverId = body.driverId?.trim();

    if (!trackingId || !driverId) {
      return NextResponse.json(
        { error: "الحقول المطلوبة ناقصة", success: false },
        { status: 400 },
      );
    }

    const booking = await db.transportBooking.findUnique({
      where: { trackingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "طلب النقل غير موجود", success: false },
        { status: 404 },
      );
    }

    if (!isOffersStage(booking.status)) {
      return NextResponse.json(
        { error: "لا يمكن قبول عرض في الحالة الحالية للطلب", success: false },
        { status: 409 },
      );
    }

    const parsedNotes = parseBookingNotes(booking.notes);
    const offers: StoredOffer[] = Array.isArray(parsedNotes.offers) ? parsedNotes.offers : [];
    const acceptedOffer = offers.find((offer) => offer.driverId === driverId);

    if (!acceptedOffer) {
      return NextResponse.json(
        { error: "العرض غير موجود", success: false },
        { status: 404 },
      );
    }

    const existingAccepted = offers.find((offer) => offer.status === "ACCEPTED");
    if (existingAccepted && existingAccepted.driverId !== driverId) {
      return NextResponse.json(
        { error: "تم قبول عرض آخر بالفعل", success: false },
        { status: 409 },
      );
    }

    const updatedOffers: StoredOffer[] = offers.map((offer) => ({
      ...offer,
      status: offer.driverId === driverId ? "ACCEPTED" : "REJECTED",
    }));

    parsedNotes.offers = updatedOffers;

    await db.transportBooking.update({
      where: { trackingId },
      data: {
        status: "CONFIRMED_AWAITING_DETAILS",
        actualPrice: acceptedOffer.price,
        driverId: acceptedOffer.driverId,
        driverName: acceptedOffer.driverName ?? null,
        driverPhone: acceptedOffer.driverPhone ?? null,
        notes: JSON.stringify(parsedNotes),
      },
    });

    return NextResponse.json(
      { success: true, message: "تم قبول العرض بنجاح" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Accept transport offer API error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء قبول العرض", success: false },
      { status: 500 },
    );
  }
}
