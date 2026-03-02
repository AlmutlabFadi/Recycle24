import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDriverSession } from "@/lib/driver-auth";
import { getRequestMeta } from "@/lib/audit";

export async function GET(request: NextRequest) {
    try {
        const session = await requireDriverSession();
        if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

        const driver = await db.driver.findUnique({
            where: { userId: session.userId },
            select: { id: true },
        });

        if (!driver) {
            return NextResponse.json({ error: "DRIVER_PROFILE_MISSING" }, { status: 404 });
        }

        const documents = await db.driverDocument.findMany({
            where: { driverId: driver.id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ ok: true, documents });
    } catch (error) {
        console.error("Get driver documents error:", error);
        return NextResponse.json({ error: "FETCH_DRIVER_DOCUMENTS_FAILED" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await requireDriverSession();
        if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

        const driver = await db.driver.findUnique({
            where: { userId: session.userId },
            select: { id: true, status: true },
        });

        if (!driver) {
            return NextResponse.json({ error: "DRIVER_PROFILE_MISSING" }, { status: 404 });
        }

        if (driver.status === "SUSPENDED") {
            return NextResponse.json({ error: "DRIVER_SUSPENDED" }, { status: 403 });
        }

        const body = await request.json();
        const { type, fileUrl, fileSha256, expiresAt } = body || {};

        if (!type || !fileUrl || !fileSha256) {
            return NextResponse.json({ error: "MISSING_DOCUMENT_FIELDS" }, { status: 400 });
        }

        const document = await db.driverDocument.create({
            data: {
                driverId: driver.id,
                type,
                fileUrl,
                fileSha256,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
        });

        const { ip, userAgent } = getRequestMeta(request);
        await db.auditLog.create({
            data: {
                actorRole: "DRIVER",
                actorId: driver.id,
                action: "DRIVER_DOCUMENT_UPLOADED",
                entityType: "DriverDocument",
                entityId: document.id,
                afterJson: { type: document.type, fileSha256: document.fileSha256 },
                ip,
                userAgent,
            },
        });

        return NextResponse.json({ ok: true, document });
    } catch (error) {
        console.error("Create driver document error:", error);
        return NextResponse.json({ error: "CREATE_DRIVER_DOCUMENT_FAILED" }, { status: 500 });
    }
}
