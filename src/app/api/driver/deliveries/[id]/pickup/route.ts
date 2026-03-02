import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverProfile } from "@/lib/driver-auth";
import { getRequestMeta } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const guard = await requireDriverProfile();
        if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const deliveryId = params.id;

        const delivery = await db.delivery.findFirst({
            where: { id: deliveryId, driverId: guard.driverId },
            include: { order: true },
        });

        if (!delivery) {
            return NextResponse.json({ error: "DELIVERY_NOT_FOUND" }, { status: 404 });
        }

        if (delivery.status !== "ASSIGNED") {
            return NextResponse.json({ error: "INVALID_STATE" }, { status: 400 });
        }

        await db.$transaction(async (tx) => {
            await tx.delivery.update({
                where: { id: deliveryId },
                data: { status: "PICKED_UP", pickedUpAt: new Date() },
            });

            await tx.order.update({
                where: { id: delivery.orderId },
                data: { status: "PICKED_UP" },
            });

            const { ip, userAgent } = getRequestMeta(request);
            await tx.auditLog.create({
                data: {
                    actorRole: "DRIVER",
                    actorId: guard.driverId,
                    action: "DELIVERY_PICKED_UP",
                    entityType: "Delivery",
                    entityId: deliveryId,
                    ip,
                    userAgent,
                },
            });
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Pickup delivery error:", error);
        return NextResponse.json({ error: "DELIVERY_PICKUP_FAILED" }, { status: 500 });
    }
}
