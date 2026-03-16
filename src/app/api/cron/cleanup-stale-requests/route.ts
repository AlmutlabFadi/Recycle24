import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const SECRET_CRON_KEY = process.env.CRON_SECRET || "fallback-secret-for-local";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const isCronTarget = authHeader === `Bearer ${process.env.CRON_SECRET}` || process.env.NODE_ENV === "development";

    if (!isCronTarget && authHeader !== `Bearer ${SECRET_CRON_KEY}`) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [expiredDeposits, expiredPayouts] = await db.$transaction([
      db.depositRequest.updateMany({
        where: {
          status: "PENDING",
          createdAt: {
            lt: SEVEN_DAYS_AGO,
          },
        },
        data: {
          status: "REJECTED",
          reviewNote: "Automated rejection due to 7 days of inactivity.",
        },
      }),

      db.payoutRequest.updateMany({
        where: {
          status: "PENDING",
          createdAt: {
            lt: SEVEN_DAYS_AGO,
          },
        },
        data: {
          status: "REJECTED",
          failureReason: "Automated rejection due to 7 days of inactivity.",
          reviewNote: "System automatically rejected stale request.",
          failedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Stale requests cleanup completed successfully",
      stats: {
        expiredDeposits: expiredDeposits.count,
        expiredPayouts: expiredPayouts.count,
      },
    });
  } catch (error) {
    console.error("Cleanup stale requests job failed:", error);
    return NextResponse.json(
      { error: "Failed to execute cleanup job" },
      { status: 500 }
    );
  }
}
