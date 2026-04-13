import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface SessionUser {
  id: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as SessionUser;

    if (!sessionUser.id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const packageId =
      typeof body?.packageId === "string" ? body.packageId.trim() : "";
    const billingCycle =
      body?.billingCycle === "yearly" ? "yearly" : "monthly";

    if (!packageId) {
      return NextResponse.json(
        { success: false, error: "باقة الاشتراك مطلوبة" },
        { status: 400 }
      );
    }

    const pkg = await db.subscriptionPackage.findUnique({
      where: { id: packageId },
    });

    if (!pkg || !pkg.isActive) {
      return NextResponse.json(
        { success: false, error: "الباقة غير متوفرة" },
        { status: 404 }
      );
    }

    let price = pkg.price;
    let durationDays = pkg.durationDays;

    if (billingCycle === "yearly") {
      price = pkg.price * 12 * 0.8;
      durationDays = 365;
    }

    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + durationDays * 24 * 60 * 60 * 1000
    );

    const previousSubscription = await db.userSubscription.findUnique({
      where: { userId: sessionUser.id },
      select: {
        id: true,
        packageId: true,
        plan: true,
        status: true,
        startDate: true,
        endDate: true,
        pricePaid: true,
      },
    });

    const subscription = await db.userSubscription.upsert({
      where: { userId: sessionUser.id },
      update: {
        packageId: pkg.id,
        plan: pkg.name,
        status: "ACTIVE",
        startDate,
        endDate,
        pricePaid: price,
      },
      create: {
        userId: sessionUser.id,
        packageId: pkg.id,
        plan: pkg.name,
        status: "ACTIVE",
        startDate,
        endDate,
        pricePaid: price,
      },
    });

    await db.auditLog.create({
      data: {
        actorRole: "SYSTEM",
        actorId: sessionUser.id,
        action: "SUBSCRIPTION_UPSERTED",
        entityType: "UserSubscription",
        entityId: subscription.id,
        beforeJson: previousSubscription
          ? {
              packageId: previousSubscription.packageId,
              plan: previousSubscription.plan,
              status: previousSubscription.status,
              startDate: previousSubscription.startDate,
              endDate: previousSubscription.endDate,
              pricePaid: previousSubscription.pricePaid,
            }
          : {},
        afterJson: {
          packageId: subscription.packageId,
          plan: subscription.plan,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          pricePaid: subscription.pricePaid,
          billingCycle,
          note: "This route does not mutate wallet, companyWallet, or legacy transaction tables. Financial settlement must be posted through dedicated ledger/payment workflows.",
        },
      },
    });

    return NextResponse.json({
      success: true,
      subscription,
      message:
        "تم تحديث الاشتراك بنجاح. التسوية المالية لا تُسجل من هذا المسار بل من مسار الدفع/الدفتر المخصص.",
    });
  } catch (error) {
    console.error("Subscription purchase error:", error);

    return NextResponse.json(
      { success: false, error: "تعذر إتمام عملية الاشتراك" },
      { status: 500 }
    );
  }
}