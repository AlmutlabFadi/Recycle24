import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRequestMeta } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
        }

        const body = await request.json();
        const { score, comment } = body || {};
        if (typeof score !== "number" || score < 1 || score > 5) {
            return NextResponse.json({ error: "INVALID_SCORE" }, { status: 400 });
        }

        const orderId = params.id;

        const delivery = await db.delivery.findFirst({
            where: { orderId, status: "DELIVERED" },
            select: { driverId: true },
        });

        if (!delivery) {
            return NextResponse.json({ error: "DELIVERY_NOT_FOUND" }, { status: 404 });
        }

        const existing = await db.driverRating.findFirst({
            where: { orderId, driverId: delivery.driverId },
            select: { id: true },
        });

        if (existing) {
            return NextResponse.json({ error: "RATING_ALREADY_EXISTS" }, { status: 409 });
        }

        const result = await db.$transaction(async (tx) => {
            const rating = await tx.driverRating.create({
                data: {
                    orderId,
                    driverId: delivery.driverId,
                    score,
                    comment: typeof comment === "string" ? comment : null,
                },
            });

            const driver = await tx.driver.findUnique({
                where: { id: delivery.driverId },
                select: { ratingAvg: true, ratingCount: true },
            });

            const ratingCount = (driver?.ratingCount || 0) + 1;
            const ratingAvg = ((driver?.ratingAvg || 0) * (ratingCount - 1) + score) / ratingCount;

            await tx.driver.update({
                where: { id: delivery.driverId },
                data: { ratingAvg, ratingCount },
            });

            const { ip, userAgent } = getRequestMeta(request);
            await tx.auditLog.create({
                data: {
                    actorRole: "SYSTEM",
                    actorId: (session.user as { id: string }).id,
                    action: "DRIVER_RATED",
                    entityType: "DriverRating",
                    entityId: rating.id,
                    afterJson: { score, orderId, driverId: delivery.driverId },
                    ip,
                    userAgent,
                },
            });

            return rating;
        });

        return NextResponse.json({ ok: true, rating: result });
    } catch (error) {
        console.error("Rate driver error:", error);
        return NextResponse.json({ error: "RATE_DRIVER_FAILED" }, { status: 500 });
    }
}
