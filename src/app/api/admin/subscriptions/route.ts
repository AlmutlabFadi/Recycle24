import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(_request: NextRequest) {
  try {
    const access = await requirePermission("MANAGE_FINANCE");
    if (!access.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
    }

    const subscriptions = await db.userSubscription.findMany({
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const stats = await db.userSubscription.groupBy({
      by: ["plan"],
      _count: { id: true },
    });

    return NextResponse.json({ success: true, subscriptions, stats });
  } catch (error) {
    console.error("Admin subscriptions GET error:", error);
    return NextResponse.json(
      { success: false, error: "تعذر تحميل بيانات الاشتراكات" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await requirePermission("MANAGE_FINANCE");
    if (!access.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
    }

    const { userId, plan, status, endDate } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    const subscription = await db.userSubscription.upsert({
      where: { userId },
      update: {
        plan: plan || undefined,
        status: status || undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      create: {
        userId,
        plan: plan || "FREE",
        status: status || "ACTIVE",
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("Admin subscription PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "تعذر تحديث الاشتراك" },
      { status: 500 }
    );
  }
}