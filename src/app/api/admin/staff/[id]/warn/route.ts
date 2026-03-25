import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Staff warnings are not supported by the current schema." },
    { status: 501 }
  );
}
