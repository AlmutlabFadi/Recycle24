import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverProfile } from "@/lib/driver-auth";
import { getRequestMeta } from "@/lib/audit";

export async function GET() {
    try {
        const guard = await requireDriverProfile();
        if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const vehicles = await db.vehicle.findMany({
            where: { driverId: guard.driverId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ ok: true, vehicles });
    } catch (error) {
        console.error("Get driver vehicles error:", error);
        return NextResponse.json({ error: "FETCH_DRIVER_VEHICLES_FAILED" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const guard = await requireDriverProfile();
        if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const body = await request.json();
        const { plateNumber, make, model, year, color } = body || {};

        if (!plateNumber || typeof plateNumber !== "string") {
            return NextResponse.json({ error: "PLATE_NUMBER_REQUIRED" }, { status: 400 });
        }

        const vehicle = await db.vehicle.create({
            data: {
                driverId: guard.driverId,
                plateNumber: plateNumber.trim(),
                make: typeof make === "string" ? make.trim() : undefined,
                model: typeof model === "string" ? model.trim() : undefined,
                year: typeof year === "number" ? year : undefined,
                color: typeof color === "string" ? color.trim() : undefined,
            },
        });

        const { ip, userAgent } = getRequestMeta(request);
        await db.auditLog.create({
            data: {
                actorRole: "DRIVER",
                actorId: guard.driverId,
                action: "DRIVER_VEHICLE_CREATED",
                entityType: "Vehicle",
                entityId: vehicle.id,
                afterJson: { plateNumber: vehicle.plateNumber, make: vehicle.make, model: vehicle.model, year: vehicle.year },
                ip,
                userAgent,
            },
        });

        return NextResponse.json({ ok: true, vehicle });
    } catch (error) {
        console.error("Create driver vehicle error:", error);
        return NextResponse.json({ error: "CREATE_DRIVER_VEHICLE_FAILED" }, { status: 500 });
    }
}
