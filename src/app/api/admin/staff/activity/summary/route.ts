import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    summary: {
      total: 0,
      online: 0,
      idle: 0,
      break: 0,
      offline: 0
    }
  });
}
