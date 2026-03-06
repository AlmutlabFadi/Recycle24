import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverProfile } from "@/lib/driver-auth";
import { getRequestMeta } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const guard = await requireDriverProfile();
        if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const offerId = params.id;

        const result = await db.$transaction(async (tx) => {
            const offer = await tx.deliveryAssignment.findFirst({
                where: { id: offerId, driverId: guard.driverId },
                include: { order: true },
            });

            if (!offer) throw new Error("OFFER_NOT_FOUND");
            if (offer.status !== "OFFERED") throw new Error("OFFER_NOT_OFFERED");
            if (offer.expiresAt.getTime() < Date.now()) throw new Error("OFFER_EXPIRED");

            const existingDelivery = await tx.delivery.findFirst({
                where: { orderId: offer.orderId },
                select: { id: true },
            });
            if (existingDelivery) throw new Error("ORDER_ALREADY_ASSIGNED");

            const alreadyAccepted = await tx.deliveryAssignment.findFirst({
                where: { orderId: offer.orderId, status: "ACCEPTED" },
                select: { id: true },
            });
            if (alreadyAccepted) throw new Error("ORDER_ALREADY_ASSIGNED");

            await tx.deliveryAssignment.update({
                where: { id: offerId },
                data: { status: "ACCEPTED", acceptedAt: new Date() },
            });

            await tx.deliveryAssignment.updateMany({
                where: { orderId: offer.orderId, status: "OFFERED", NOT: { id: offerId } },
                data: { status: "CANCELED", canceledAt: new Date() },
            });

            await tx.order.update({
                where: { id: offer.orderId },
                data: { status: "ASSIGNED" },
            });

            const delivery = await tx.delivery.create({
                data: {
                    orderId: offer.orderId,
                    driverId: guard.driverId,
                    status: "ASSIGNED",
                },
            });

            const { ip, userAgent } = getRequestMeta(request);
            await tx.auditLog.create({
                data: {
                    actorRole: "DRIVER",
                    actorId: guard.driverId,
                    action: "OFFER_ACCEPTED",
                    entityType: "DeliveryAssignment",
                    entityId: offerId,
                    afterJson: { deliveryId: delivery.id },
                    ip,
                    userAgent,
                },
            });

            return { deliveryId: delivery.id };
        });

        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        const message = error instanceof Error ? error.message : "OFFER_ACCEPT_FAILED";
        const status = message === "OFFER_NOT_FOUND" ? 404 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}
