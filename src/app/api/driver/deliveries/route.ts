import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireDriverProfile } from "@/lib/driver-auth";

const allowedStatuses: OrderStatus[] = [
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_FAILED",
];

export async function GET(request: NextRequest) {
  try {
    const guard = await requireDriverProfile();
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get("status");

    const where: Prisma.DeliveryWhereInput = {
      driverId: guard.driverId,
    };

    if (rawStatus && allowedStatuses.includes(rawStatus as OrderStatus)) {
      where.status = rawStatus as OrderStatus;
    }

    const deliveries = await db.delivery.findMany({
      where,
      include: { order: true, pod: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ ok: true, deliveries });
  } catch (error) {
    console.error("Get driver deliveries error:", error);
    return NextResponse.json({ error: "FETCH_DRIVER_DELIVERIES_FAILED" }, { status: 500 });
  }
}