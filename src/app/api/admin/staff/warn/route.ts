import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function POST(req: Request) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { userId, reason, severity } = await req.json();

        const log = await db.securityLog.create({
            data: {
                userId,
                event: "STAFF_WARNING",
                details: `Warning Issued: ${reason} (Severity: ${severity})`,
                ip: req.headers.get("x-forwarded-for") || "unknown",
                level: "HIGH",
            },
        });

        return NextResponse.json({ success: true, log });
    } catch (error) {
        console.error("Staff warning error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
