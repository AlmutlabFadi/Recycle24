import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getUserWalletSummaries } from "@/lib/ledger/wallet-summary";
import { requirePermission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const access = await requirePermission("MANAGE_USERS");

    if (!access.ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: access.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const userType = searchParams.get("type") || "ALL";

    const users = await db.user.findMany({
      where: userType === "ALL" ? {} : { userType },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        userType: true,
        status: true,
        isVerified: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const walletSummaries = await getUserWalletSummaries(
      users.map((user) => user.id)
    );

    const enrichedUsers = users.map((user) => {
      const walletSummary = walletSummaries.get(user.id);

      return {
        ...user,
        walletSummary: {
          verifiedBalanceSYP: walletSummary?.syp.balance ?? 0,
          availableBalanceSYP: walletSummary?.syp.availableBalance ?? 0,
          heldAmountSYP: walletSummary?.syp.heldAmount ?? 0,
          verifiedBalanceUSD: walletSummary?.usd.balance ?? 0,
          availableBalanceUSD: walletSummary?.usd.availableBalance ?? 0,
          heldAmountUSD: walletSummary?.usd.heldAmount ?? 0,
          isLocked: walletSummary?.isLocked ?? false,
        },
        wallet: {
          balanceSYP: walletSummary?.syp.balance ?? 0,
          availableBalanceSYP: walletSummary?.syp.availableBalance ?? 0,
          heldAmountSYP: walletSummary?.syp.heldAmount ?? 0,
        },
      };
    });

    return NextResponse.json({
      success: true,
      users: enrichedUsers,
    });
  } catch (error) {
    console.error("Admin users GET error:", error);

    return NextResponse.json(
      { success: false, error: "تعذر تحميل قائمة المستخدمين" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await requirePermission("MANAGE_USERS");

    if (!access.ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: access.status }
      );
    }

    const { id, status, isVerified, userType, banReason } =
      await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        status: status || undefined,
        isVerified: isVerified !== undefined ? isVerified : undefined,
        userType: userType || undefined,
        lockReason: banReason || undefined,
        isLocked: status === "BANNED",
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Admin user PATCH error:", error);

    return NextResponse.json(
      { success: false, error: "تعذر تحديث بيانات المستخدم" },
      { status: 500 }
    );
  }
}