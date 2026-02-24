import { NextResponse } from "next/server";
import { Forensics } from "@/lib/security/forensics";
import { SecurityLogger, SecurityEvent } from "@/lib/security/logger";

// GET /api/security/forensics/export
// Exports a tamper-evident JSON of security logs.
export async function GET(req: Request) {
  try {
    // 1. Auth Check (Admin Only)
    // const session = await getSession();
    // if (!session?.user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const hoursStr = searchParams.get('hours');
    
    // Default to last 24 hours if not specified
    const hours = hoursStr ? parseInt(hoursStr, 10) : 24;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(endDate.getHours() - hours);

    // 2. Generate Forensic Export
    const report = await Forensics.exportIncidentLogs(startDate, endDate, userId);

    // 3. Log the export action (Audit trail of who viewed the evidence)
    await SecurityLogger.audit(
      "FORENSIC_EXPORT_GENERATED", 
      { targetUserId: userId, timeRangeHours: hours, recordCount: report.metadata.recordCount },
      "admin_user_id" // replace with actual admin id
    );

    return NextResponse.json(report);
  } catch (error) {
    console.error("Forensic export failed:", error);
    return NextResponse.json({ error: "Failed to generate forensic report" }, { status: 500 });
  }
}
