import { NextRequest, NextResponse } from "next/server";
import { runAllDetectionRules } from "@/lib/control/detection-rules";
import {
    enforceControlKillSwitch,
    enforceControlNonce,
    enforceControlRateLimit,
    isKillSwitchError,
    requireControlAccess,
} from "@/lib/control/security";

// POST: Run all detection rules manually (or called by cron)
export async function POST(request: NextRequest) {
    try {
        await enforceControlKillSwitch();
        const auth = await requireControlAccess(request);
        if (!auth.ok) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const rate = await enforceControlRateLimit({
            actorUserId: auth.actor.userId,
            routeKey: "control:detect:run",
            limit: 3,
            windowMs: 60_000,
        });
        if (!rate.ok) {
            return NextResponse.json({ success: false, error: rate.error, retryAfter: rate.retryAfter }, { status: rate.status });
        }

        const nonce = await enforceControlNonce(request, auth.actor.userId);
        if (!nonce.ok) {
            return NextResponse.json({ success: false, error: nonce.error }, { status: nonce.status });
        }

        const result = await runAllDetectionRules();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        if (isKillSwitchError(error)) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
