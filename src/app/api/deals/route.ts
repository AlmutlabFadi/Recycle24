import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

function parsePositiveNumber(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

// GET /api/deals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId")?.trim() || null;
    const status = searchParams.get("status")?.trim() || null;
    const page = parsePositiveInt(searchParams.get("page"), 1, 10000);
    const limit = parsePositiveInt(searchParams.get("limit"), 10, 100);

    const where: {
      status?: string;
      OR?: Array<{ sellerId: string } | { buyerId: string }>;
    } = {};

    if (userId) {
      where.OR = [{ sellerId: userId }, { buyerId: userId }];
    }

    if (status) {
      where.status = status;
    }

    const [deals, total] = await Promise.all([
      db.deal.findMany({
        where,
        include: {
          seller: {
            select: { id: true, name: true, phone: true },
          },
          buyer: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.deal.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      deals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get deals error:", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الصفقات" },
      { status: 500 }
    );
  }
}

// POST /api/deals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const sellerId =
      typeof body?.sellerId === "string" ? body.sellerId.trim() : "";
    const buyerId =
      typeof body?.buyerId === "string" ? body.buyerId.trim() : "";
    const auctionId =
      typeof body?.auctionId === "string" && body.auctionId.trim().length > 0
        ? body.auctionId.trim()
        : null;
    const materialType =
      typeof body?.materialType === "string" ? body.materialType.trim() : "";
    const weight = parsePositiveNumber(body?.weight);
    const totalAmount = parsePositiveNumber(body?.totalAmount);

    if (!sellerId || !buyerId || !materialType || !weight || !totalAmount) {
      return NextResponse.json(
        { error: "جميع الحقول الأساسية مطلوبة" },
        { status: 400 }
      );
    }

    if (sellerId === buyerId) {
      return NextResponse.json(
        { error: "لا يمكن أن يكون البائع والمشتري نفس الحساب" },
        { status: 400 }
      );
    }

    const platformFee = totalAmount * 0.02;

    const deal = await db.deal.create({
      data: {
        sellerId,
        buyerId,
        auctionId: auctionId ?? undefined,
        materialType,
        weight,
        totalAmount,
        platformFee,
        status: "PENDING",
      },
      include: {
        seller: {
          select: { id: true, name: true, phone: true },
        },
        buyer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    await db.auditLog.create({
      data: {
        actorRole: "SYSTEM",
        actorId: null,
        action: "DEAL_CREATED",
        entityType: "Deal",
        entityId: deal.id,
        beforeJson: {},
        afterJson: {
          sellerId: deal.sellerId,
          buyerId: deal.buyerId,
          auctionId: deal.auctionId,
          materialType: deal.materialType,
          weight: deal.weight,
          totalAmount: deal.totalAmount,
          platformFee: deal.platformFee,
          status: deal.status,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deal,
      message: "تم إنشاء الصفقة بنجاح",
    });
  } catch (error) {
    console.error("Create deal error:", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الصفقة" },
      { status: 500 }
    );
  }
}

// PATCH /api/deals
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const dealId = typeof body?.dealId === "string" ? body.dealId.trim() : "";
    const status =
      typeof body?.status === "string" && body.status.trim().length > 0
        ? body.status.trim()
        : null;
    const contractSigned =
      typeof body?.contractSigned === "boolean" ? body.contractSigned : undefined;

    if (!dealId) {
      return NextResponse.json(
        { error: "معرف الصفقة مطلوب" },
        { status: 400 }
      );
    }

    const existingDeal = await db.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        status: true,
        contractSigned: true,
        signedAt: true,
        platformFee: true,
        sellerId: true,
        buyerId: true,
        totalAmount: true,
        materialType: true,
      },
    });

    if (!existingDeal) {
      return NextResponse.json(
        { error: "الصفقة غير موجودة" },
        { status: 404 }
      );
    }

    const updateData: {
      status?: string;
      contractSigned?: boolean;
      signedAt?: Date | null;
    } = {};

    if (status) {
      updateData.status = status;
    }

    if (contractSigned !== undefined) {
      updateData.contractSigned = contractSigned;
      updateData.signedAt = contractSigned ? new Date() : null;
    }

    const deal = await db.deal.update({
      where: { id: dealId },
      data: updateData,
    });

    await db.auditLog.create({
      data: {
        actorRole: "SYSTEM",
        actorId: null,
        action: "DEAL_UPDATED",
        entityType: "Deal",
        entityId: deal.id,
        beforeJson: {
          status: existingDeal.status,
          contractSigned: existingDeal.contractSigned,
          signedAt: existingDeal.signedAt,
        },
        afterJson: {
          status: deal.status,
          contractSigned: deal.contractSigned,
          signedAt: deal.signedAt,
          note: "Deal status update does not mutate wallet or company balance. Financial settlement must be posted via dedicated ledger workflows.",
        },
      },
    });

    return NextResponse.json({
      success: true,
      deal,
      message: "تم تحديث الصفقة بنجاح",
    });
  } catch (error) {
    console.error("Update deal error:", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الصفقة" },
      { status: 500 }
    );
  }
}