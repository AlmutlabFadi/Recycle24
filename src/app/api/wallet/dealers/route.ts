import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/wallet/dealers - Public search for dealers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const governorate = searchParams.get("governorate");
    const region = searchParams.get("region");

    // @ts-ignore
    const dealers = await db.dealer.findMany({
      where: {
        isActive: true,
        ...(governorate ? { governorate } : {}),
        ...(region ? { region } : {}),
      },
      orderBy: [
        { governorate: "asc" },
        { region: "asc" },
      ],
    });

    return NextResponse.json({ success: true, dealers });
  } catch (error) {
    console.error("Public fetch dealers error:", error);
    return NextResponse.json({ error: "Failed to fetch dealers" }, { status: 500 });
  }
}
