import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requirePermission,
  PERMISSIONS,
  bootstrapAccessControl,
  isAccessControlBootstrapped,
} from "@/lib/rbac";

export async function GET() {
  try {
    const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);

    if (!access.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
    }

    const ready = await isAccessControlBootstrapped();

    if (!ready) {
      await bootstrapAccessControl();
    }

    const permissions = await db.permission.findMany({
      orderBy: { key: "asc" },
    });

    return NextResponse.json({ success: true, permissions });
  } catch (error) {
    console.error("Access permissions GET error:", error);
    return NextResponse.json(
      { success: false, error: "???? ????? ?????????" },
      { status: 500 }
    );
  }
}
