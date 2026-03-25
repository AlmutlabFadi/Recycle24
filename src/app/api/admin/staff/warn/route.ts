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

        const result = await db.$transaction(async (tx) => {
            // 1. Create the warning record
            const warning = await (tx as any).staffWarning.create({
                data: {
                    staffId: userId,
                    issuerId: access.userId,
                    reason: `${reason} (Severity: ${severity})`,
                },
            });

            // 2. Log the action
            const log = await tx.securityLog.create({
                data: {
                    userId: access.userId,
                    event: "STAFF_WARNING",
                    details: `Warning Issued to ${userId}: ${reason} (Severity: ${severity})`,
                    ip: req.headers.get("x-forwarded-for") || "unknown",
                    level: "HIGH",
                },
            });

            return { warning, log };
        });

        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error("Staff warning error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
