import { NextResponse } from "next/server";
import { runAllDetectionRules } from "@/lib/control/detection-rules";

// POST: Run all detection rules manually (or called by cron)
export async function POST() {
    try {
        const result = await runAllDetectionRules();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
