import { NextRequest, NextResponse } from "next/server";
import { blockIP, isolateAccount } from "@/lib/security/actions";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, targetId, incidentId, reason } = body || {};

    if (!action || !targetId) {
      return NextResponse.json(
        { error: "Action and Target ID are required." },
        { status: 400 }
      );
    }

    const safeIncidentId = incidentId || "MANUAL_OVERRIDE";
    const safeReason = reason || "Manual command execution by GSOCC Administrator";

    let realIncidentId = safeIncidentId;

    if (safeIncidentId === "MANUAL_OVERRIDE") {
      const existingManual = await db.gsoccIncident.findFirst({
        where: {
          title: "Manual Administrative Override",
        },
        select: { id: true },
      });

      if (!existingManual) {
        const newIncident = await db.gsoccIncident.create({
          data: {
            title: "Manual Administrative Override",
            incidentType: "MANUAL_OVERRIDE",
            severity: "MEDIUM",
            description: "Placeholder incident for manual terminal commands.",
          },
          select: { id: true },
        });

        realIncidentId = newIncident.id;
      } else {
        realIncidentId = existingManual.id;
      }
    }

    if (action === "BLOCK_IP") {
      await blockIP(targetId, realIncidentId, safeReason);

      return NextResponse.json({
        status: "success",
        message:
          safeIncidentId === "MANUAL_OVERRIDE"
            ? `IP ${targetId} blocked successfully.`
            : `IP ${targetId} blocked under incident ${realIncidentId}.`,
      });
    }

    if (action === "ISOLATE_USER") {
      await isolateAccount(targetId, realIncidentId, safeReason);

      return NextResponse.json({
        status: "success",
        message:
          safeIncidentId === "MANUAL_OVERRIDE"
            ? `User ${targetId} isolated effectively.`
            : `User ${targetId} isolated under incident ${realIncidentId}.`,
      });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Internal Server Error";
    console.error("[GSOCC ACTIONS API ERROR]", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}