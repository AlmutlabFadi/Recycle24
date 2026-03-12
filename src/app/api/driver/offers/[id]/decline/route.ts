import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverProfile } from "@/lib/driver-auth";
import { getRequestMeta } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireDriverProfile();
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const { id: offerId } = await context.params;

    const offer = await db.deliveryAssignment.findFirst({
      where: { id: offerId, driverId: guard.driverId },
    });

    if (!offer) {
      return NextResponse.json({ error: "OFFER_NOT_FOUND" }, { status: 404 });
    }

    if (offer.status !== "OFFERED") {
      return NextResponse.json({ error: "OFFER_NOT_OFFERED" }, { status: 400 });
    }

    await db.deliveryAssignment.update({
      where: { id: offerId },
      data: { status: "DECLINED", declinedAt: new Date() },
    });

    const { ip, userAgent } = getRequestMeta(request);
    await db.auditLog.create({
      data: {
        actorRole: "DRIVER",
        actorId: guard.driverId,
        action: "OFFER_DECLINED",
        entityType: "DeliveryAssignment",
        entityId: offerId,
        ip,
        userAgent,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Decline offer error:", error);
    return NextResponse.json({ error: "OFFER_DECLINE_FAILED" }, { status: 500 });
  }
}