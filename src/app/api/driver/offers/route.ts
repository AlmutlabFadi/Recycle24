import { NextRequest, NextResponse } from "next/server";
import { AssignmentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireDriverProfile } from "@/lib/driver-auth";

const allowedStatuses: AssignmentStatus[] = [
  "OFFERED",
  "ACCEPTED",
  "DECLINED",
  "CANCELED",
  "EXPIRED",
];

export async function GET(request: NextRequest) {
  try {
    const guard = await requireDriverProfile();
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get("status");

    const where: Prisma.DeliveryAssignmentWhereInput = {
      driverId: guard.driverId,
    };

    if (rawStatus && allowedStatuses.includes(rawStatus as AssignmentStatus)) {
      where.status = rawStatus as AssignmentStatus;
    }

    const offers = await db.deliveryAssignment.findMany({
      where,
      include: { order: true },
      orderBy: { offeredAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ ok: true, offers });
  } catch (error) {
    console.error("Get driver offers error:", error);
    return NextResponse.json({ error: "FETCH_DRIVER_OFFERS_FAILED" }, { status: 500 });
  }
}