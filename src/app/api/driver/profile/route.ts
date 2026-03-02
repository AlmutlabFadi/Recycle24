import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverSession } from "@/lib/driver-auth";
import { getRequestMeta } from "@/lib/audit";

export async function POST(request: Request) {
    try {
        const session = await requireDriverSession();
        if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

        if (session.userType !== "DRIVER") {
            return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
        }

        const existing = await db.driver.findUnique({ where: { userId: session.userId } });
        if (existing) {
            return NextResponse.json({ error: "DRIVER_PROFILE_EXISTS" }, { status: 409 });
        }

        const body = await request.json();
        const { fullName, phone, city } = body || {};

        const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { name: true, phone: true },
        });

        const resolvedName = fullName || user?.name;
        const resolvedPhone = phone || user?.phone;

        if (!resolvedName || !resolvedPhone) {
            return NextResponse.json({ error: "MISSING_PROFILE_FIELDS" }, { status: 400 });
        }

        const driver = await db.driver.create({
            data: {
                userId: session.userId,
                fullName: resolvedName,
                phone: resolvedPhone,
                city: city || null,
            },
        });

        const { ip, userAgent } = getRequestMeta(request);
        await db.auditLog.create({
            data: {
                actorRole: "DRIVER",
                actorId: driver.id,
                action: "DRIVER_PROFILE_CREATED",
                entityType: "Driver",
                entityId: driver.id,
                afterJson: { city: driver.city },
                ip,
                userAgent,
            },
        });

        return NextResponse.json({ ok: true, driver });
    } catch (error) {
        console.error("Create driver profile error:", error);
        return NextResponse.json({ error: "CREATE_DRIVER_PROFILE_FAILED" }, { status: 500 });
    }
}
