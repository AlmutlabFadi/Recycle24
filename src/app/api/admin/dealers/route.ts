import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

// GET /api/admin/dealers - List all dealers
export async function GET(request: NextRequest) {
  try {
    const errorResponse = await requirePermission("MANAGE_USERS"); // Reusing high-level permission for now
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const governorate = searchParams.get("governorate");
    const isActive = searchParams.get("isActive");

    // @ts-ignore
    const dealers = await db.dealer.findMany({
      where: {
        ...(governorate ? { governorate } : {}),
        ...(isActive === "true" ? { isActive: true } : isActive === "false" ? { isActive: false } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, dealers });
  } catch (error) {
    console.error("Fetch dealers error:", error);
    return NextResponse.json({ error: "Failed to fetch dealers" }, { status: 500 });
  }
}

// POST /api/admin/dealers - Create a new dealer
export async function POST(request: NextRequest) {
  try {
    const errorResponse = await requirePermission("MANAGE_USERS");
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const {
      name,
      governorate,
      region,
      address,
      contactPhone,
      contactWhatsapp,
      lat,
      lng,
      services,
      workingHours,
    } = body;

    if (!name || !governorate || !region || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // @ts-ignore
    const dealer = await db.dealer.create({
      data: {
        name,
        governorate,
        region,
        address,
        contactPhone,
        contactWhatsapp,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        services: Array.isArray(services) ? services : ["DEPOSIT", "WITHDRAW"],
        workingHours,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, dealer });
  } catch (error) {
    console.error("Create dealer error:", error);
    return NextResponse.json({ error: "Failed to create dealer" }, { status: 500 });
  }
}
