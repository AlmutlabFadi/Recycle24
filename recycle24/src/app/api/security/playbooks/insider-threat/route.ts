
import { NextResponse } from "next/server";
import { Containment } from "@/lib/security/containment";
import { SecurityLogger, SecurityEvent } from "@/lib/security/logger";
import { db } from "@/lib/db";

// Playbook C: Insider Threat
// Trigger: Unauthorized access to sensitive data by employee
// Action: Immediate role demotion, account suspension
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, reason, adminId } = body;

    // 1. Suspend Account
    await Containment.lockUser(userId, `INSIDER_THREAT: ${reason}`, adminId);

    // 2. Remove Roles (Soft delete or update)
    await db.user.update({
        where: { id: userId },
        data: { role: "BUYER" } // Demote to basic role or custom SUSPENDED role
    });

    // 3. Log
    await SecurityLogger.critical(
        "INSIDER_THREAT", 
        { playbook: "Insider Threat", target: userId, action: "DEMOTED_AND_LOCKED" },
        adminId
    );

    return NextResponse.json({ success: true, message: "Insider Threat Playbook Executed" });
  } catch {
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}
