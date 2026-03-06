import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET Kill Switches
export async function GET() {
    try {
        const switches = await db.killSwitch.findMany({ orderBy: { key: "asc" } });
        return NextResponse.json({ success: true, data: switches });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

// POST: Toggle a kill switch
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { key, state, reason, userId } = body;

        if (!key || !state || !reason) {
            return NextResponse.json(
                { success: false, error: "key, state, and reason are required" },
                { status: 400 }
            );
        }

        if (!["on", "off"].includes(state)) {
            return NextResponse.json(
                { success: false, error: "state must be 'on' or 'off'" },
                { status: 400 }
            );
        }

        // Update Kill Switch
        const updated = await db.killSwitch.update({
            where: { key },
            data: { state, reason, updatedByUserId: userId || "system" },
        });

        // Write audit log
        await db.auditLog.create({
            data: {
                actorRole: "ADMIN",
                actorId: userId || "system",
                action: "KILLSWITCH.UPDATE",
                entityType: "KillSwitch",
                entityId: updated.id,
                beforeJson: {},
                afterJson: { key, state, reason },
                ip: null,
            },
        });

        // Write control event
        await db.controlEvent.create({
            data: {
                sourceComponentKey: "auth",
                eventType: `KILLSWITCH.${state === "on" ? "ACTIVATED" : "DEACTIVATED"}`,
                severity: state === "on" ? "critical" : "info",
                actorUserId: userId,
                entityType: "killswitch",
                entityId: key,
                payload: { key, state, reason },
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("KillSwitch error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
