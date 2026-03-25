import { NextResponse } from "next/server";
import { evaluateApproval } from "@/app/admin/finance/_lib/policy-engine";

export async function GET() {
  const result = evaluateApproval({
    type: "WITHDRAWAL",
    amount: 100000,
    currency: "SYP",
    userId: "test",
  });

  return NextResponse.json(result);
}