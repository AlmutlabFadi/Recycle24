
import { NextResponse } from "next/server";
import { Containment } from "@/lib/security/containment";
import { SecurityLogger, SecurityEvent } from "@/lib/security/logger";
import { db } from "@/lib/db";

// Playbook A: Identity Compromise
// Trigger: Suspicious login, reported compromise
// Action: Lock user, revoke sessions, force password reset (optional flag)
export async function POST(req: Request) {
  try {
    // 1. Verify Verification/Auth (Admin only)
    // In a real app, use session check here.
    // const session = await getSession();
    // if (!session?.user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { userId, reason, adminId } = body;

    if (!userId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Execute Containment
    await Containment.lockUser(userId, reason, adminId || "system");

    // 3. Log specifically as Playbook Execution
    await SecurityLogger.critical(
        SecurityEvent.AUTH_COMPROMISE, 
        { playbook: "Identity Compromise", target: userId, action: "LOCKED" },
        adminId
    );

    return NextResponse.json({ success: true, message: "Identity Compromise Playbook Executed" });
  } catch {
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}
