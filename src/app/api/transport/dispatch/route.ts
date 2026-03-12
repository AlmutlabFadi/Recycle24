import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type DispatchRequestBody = {
  trackingId?: string;
  eta?: string;
  date?: string;
  timeWindow?: string;
  vehicleType?: string;
  plateNumber?: string;
  vehicleColor?: string;
  notes?: string;
};

type BookingNotes = {
  offers?: unknown[];
  dispatchDetails?: {
    eta?: string;
    date: string;
    timeWindow: string;
    vehicleType?: string;
    plateNumber: string;
    vehicleColor?: string;
    notes?: string;
  };
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DispatchRequestBody;

    const trackingId = body.trackingId?.trim();
    const date = body.date?.trim();
    const timeWindow = body.timeWindow?.trim();
    const plateNumber = body.plateNumber?.trim();

    if (!trackingId || !date || !timeWindow || !plateNumber) {
      return NextResponse.json(
        { error: "بيانات ناقصة لإكمال التفاصيل", success: false },
        { status: 400 },
      );
    }

    const booking = await db.transportBooking.findUnique({
      where: { trackingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found", success: false },
        { status: 404 },
      );
    }

    const parsedNotes = parseBookingNotes(booking.notes);

    parsedNotes.dispatchDetails = {
      eta: body.eta?.trim(),
      date,
      timeWindow,
      vehicleType: body.vehicleType?.trim(),
      plateNumber,
      vehicleColor: body.vehicleColor?.trim(),
      notes: body.notes?.trim(),
    };

    await db.transportBooking.update({
      where: { trackingId },
      data: {
        status: "IN_TRANSIT",
        vehicleType: body.vehicleType?.trim() || booking.vehicleType,
        plateNumber,
        notes: JSON.stringify(parsedNotes),
      },
    });

    return NextResponse.json(
      { success: true, message: "تم تثبيت تفاصيل الرحلة بنجاح" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Transport dispatch API error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ التفاصيل الإضافية", success: false },
      { status: 500 },
    );
  }
}