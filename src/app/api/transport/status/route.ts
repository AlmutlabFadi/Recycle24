import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

const updateStatusSchema = z.object({
  trackingId: z.string().min(1, "رقم الشحنة مطلوب"),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "DRIVER_ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
  ]),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehicleType: z.string().optional(),
  plateNumber: z.string().optional(),
  actualPrice: z.number().optional(),
  notes: z.string().optional(),
});

function getStatusAr(status: string): string {
  const statusNames: Record<string, string> = {
    PENDING: "قيد الانتظار",
    CONFIRMED: "تم التأكيد",
    DRIVER_ASSIGNED: "تم تعيين السائق",
    PICKED_UP: "تم الاستلام",
    IN_TRANSIT: "في الطريق",
    DELIVERED: "تم التسليم",
    CANCELLED: "ملغي",
  };

  return statusNames[status] || status;
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "غير مصرح لك", success: false },
        { status: 401 },
      );
    }

    const sessionUser = session.user as SessionUser;
    void sessionUser;

    const body = await request.json();
    const validationResult = updateStatusSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return NextResponse.json(
        { error: errors, success: false },
        { status: 400 },
      );
    }

    const data = validationResult.data;

    const booking = await db.transportBooking.findUnique({
      where: { trackingId: data.trackingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "لم يتم العثور على الشحنة", success: false },
        { status: 404 },
      );
    }

    const updateData: {
      status: string;
      driverName?: string;
      driverPhone?: string;
      vehicleType?: string;
      plateNumber?: string;
      actualPrice?: number;
      notes?: string;
    } = {
      status: data.status,
    };

    if (data.status === "DRIVER_ASSIGNED" || data.status === "IN_TRANSIT") {
      if (data.driverName) updateData.driverName = data.driverName;
      if (data.driverPhone) updateData.driverPhone = data.driverPhone;
      if (data.vehicleType) updateData.vehicleType = data.vehicleType;
      if (data.plateNumber) updateData.plateNumber = data.plateNumber;
    }

    if (data.status === "DELIVERED" && typeof data.actualPrice === "number") {
      updateData.actualPrice = data.actualPrice;
    }

    if (typeof data.notes === "string") {
      updateData.notes = data.notes;
    }

    const updatedBooking = await db.transportBooking.update({
      where: { trackingId: data.trackingId },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم تحديث حالة الشحنة بنجاح",
        tracking: {
          trackingId: updatedBooking.trackingId,
          status: updatedBooking.status,
          statusAr: getStatusAr(updatedBooking.status),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update transport status error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث حالة الشحنة", success: false },
      { status: 500 },
    );
  }
}