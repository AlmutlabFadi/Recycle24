import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

type Params = { id: string };

// PATCH /api/admin/dealers/[id] - Update dealer details
export async function PATCH(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const errorResponse = await requirePermission("MANAGE_USERS");
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await request.json();

    // @ts-ignore
    const dealer = await db.dealer.update({
      where: { id },
      data: {
        ...body,
        lat: body.lat ? parseFloat(body.lat) : undefined,
        lng: body.lng ? parseFloat(body.lng) : undefined,
      },
    });

    return NextResponse.json({ success: true, dealer });
  } catch (error) {
    console.error("Update dealer error:", error);
    return NextResponse.json({ error: "Failed to update dealer" }, { status: 500 });
  }
}

// DELETE /api/admin/dealers/[id] - Remove a dealer
export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const errorResponse = await requirePermission("MANAGE_USERS");
    if (errorResponse) return errorResponse;

    const { id } = await params;
    // @ts-ignore
    await db.dealer.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Dealer deleted" });
  } catch (error) {
    console.error("Delete dealer error:", error);
    return NextResponse.json({ error: "Failed to delete dealer" }, { status: 500 });
  }
}
