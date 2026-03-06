import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverProfile } from "@/lib/driver-auth";
import { getRequestMeta } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const guard = await requireDriverProfile();
        if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const body = await request.json();
        const { signedName, signatureSvg, photoUrls, lat, lng } = body || {};

        if (!Array.isArray(photoUrls) || photoUrls.length === 0) {
            return NextResponse.json({ error: "POD_PHOTOS_REQUIRED" }, { status: 400 });
        }

        const deliveryId = params.id;

        const result = await db.$transaction(async (tx) => {
            const delivery = await tx.delivery.findFirst({
                where: { id: deliveryId, driverId: guard.driverId },
                include: { order: true },
            });

            if (!delivery) throw new Error("DELIVERY_NOT_FOUND");
            if (delivery.status !== "OUT_FOR_DELIVERY") throw new Error("INVALID_STATE");

            const pod = await tx.proofOfDelivery.create({
                data: {
                    deliveryId,
                    signedName: signedName || null,
                    signatureSvg: signatureSvg || null,
                    photoUrls,
                    lat: typeof lat === "number" ? lat : null,
                    lng: typeof lng === "number" ? lng : null,
                    occurredAt: new Date(),
                },
            });

            await tx.delivery.update({
                where: { id: deliveryId },
                data: { status: "DELIVERED", deliveredAt: new Date() },
            });

            await tx.order.update({
                where: { id: delivery.orderId },
                data: { status: "DELIVERED" },
            });

            const { ip, userAgent } = getRequestMeta(request);
            await tx.auditLog.create({
                data: {
                    actorRole: "DRIVER",
                    actorId: guard.driverId,
                    action: "DELIVERED_WITH_POD",
                    entityType: "Delivery",
                    entityId: deliveryId,
                    afterJson: { podId: pod.id, lat, lng },
                    ip,
                    userAgent,
                },
            });

            return { podId: pod.id };
        });

        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        const message = error instanceof Error ? error.message : "DELIVERY_POD_FAILED";
        const status = message === "DELIVERY_NOT_FOUND" ? 404 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}
