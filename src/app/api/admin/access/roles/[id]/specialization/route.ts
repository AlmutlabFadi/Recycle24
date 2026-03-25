import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: "Role specialization is not supported by the current schema." },
    { status: 501 }
  );
}
