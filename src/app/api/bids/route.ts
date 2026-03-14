import { NextResponse } from "next/server";

/*
Legacy bidding endpoint is intentionally disabled.

All bidding operations must go through:
- /api/auctions/[id]/bid

Reason:
- enforce participant approval
- enforce deposit workflow via LedgerHold
- enforce anti-sniping extensions
- enforce winning bid state
- enforce auction event logging
*/

export async function GET() {
  return NextResponse.json(
    {
      error: "Endpoint disabled",
      message: "Use /api/auctions/[id]/bid instead",
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Endpoint disabled",
      message: "Use /api/auctions/[id]/bid instead",
    },
    { status: 410 }
  );
}