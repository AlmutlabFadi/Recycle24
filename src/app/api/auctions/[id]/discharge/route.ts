import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuctionSettlementService } from "@/lib/auction/settlement";

/**
 * POST /api/auctions/[id]/discharge
 * Allows the seller of an auction to release the security deposit of the winner.
 * This is the "Discharge" (برائة ذمة) step.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auctionId } = await context.params;
    const sellerId = session.user.id;
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;

    const result = await AuctionSettlementService.dischargeWinner(auctionId, sellerId, userId);

    return NextResponse.json({
      success: true,
      message: "Winner discharged successfully. Deposit released.",
      result
    });

  } catch (error: any) {
    console.error("[DISCHARGE_ERROR]", error);
    return NextResponse.json({ 
      error: error.message || "Failed to discharge winner" 
    }, { status: 500 });
  }
}
