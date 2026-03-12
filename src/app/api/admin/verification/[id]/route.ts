import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

type VerificationType = "TRADER" | "DRIVER" | "CLIENT" | "GOVERNMENT";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requirePermission("MANAGE_USERS");
    if (!access.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
    }

    const { id } = await context.params;
    const body = await request.json();

    const {
      status,
      type,
      rejectionReason,
      missingDocuments,
      fieldStatuses,
      documentStatuses,
    } = body as {
      status: string;
      type: VerificationType;
      rejectionReason?: string;
      missingDocuments?: string[];
      fieldStatuses?: Record<string, unknown>;
      documentStatuses?: Array<{ id: string; status: string }>;
    };

    const allowedStates = ["APPROVED", "REJECTED", "UNDER_REVIEW", "PENDING"];
    if (!status || !allowedStates.includes(status)) {
      return NextResponse.json({ success: false, error: "حالة غير صالحة" }, { status: 400 });
    }

    const normalizedFieldStatuses =
      fieldStatuses !== undefined
        ? (fieldStatuses as Prisma.InputJsonValue)
        : undefined;

    let userId = id;
    let result: unknown = null;

    if (type === "DRIVER") {
      const driver = await db.driver.findUnique({ where: { id } });
      if (!driver) {
        return NextResponse.json({ success: false, error: "السائق غير موجود" }, { status: 404 });
      }

      userId = driver.userId;

      if (Array.isArray(documentStatuses)) {
        for (const doc of documentStatuses) {
          try {
            await db.driverDocument.update({
              where: { id: doc.id },
              data: { status: doc.status as any },
            });
          } catch {
            console.warn(`Could not update driver doc ${doc.id}`);
          }
        }
      }

      result = await db.driver.update({
        where: { id },
        data: {
          status: status === "APPROVED" ? "VERIFIED" : (status as any),
        },
      });

      if (status === "APPROVED" || status === "UNDER_REVIEW") {
        await db.user.update({
          where: { id: userId },
          data: {
            isVerified: status === "APPROVED",
            status: status === "APPROVED" ? "ACTIVE" : "PENDING",
            role: "DRIVER",
            userType: "DRIVER",
          },
        });
      }
    } else if (type === "TRADER") {
      const trader = await db.trader.findUnique({ where: { id } });
      if (!trader) {
        return NextResponse.json({ success: false, error: "التاجر غير موجود" }, { status: 404 });
      }

      userId = trader.userId;

      if (Array.isArray(documentStatuses)) {
        for (const doc of documentStatuses) {
          try {
            await db.traderDocument.update({
              where: { id: doc.id },
              data: { status: doc.status },
            });
          } catch {
            console.warn(`Could not update trader doc ${doc.id}`);
          }
        }
      }

      result = await db.trader.update({
        where: { id },
        data: {
          verificationStatus: status,
          rejectionReason: status === "REJECTED" ? rejectionReason || null : null,
          missingDocuments:
            status === "REJECTED" && Array.isArray(missingDocuments)
              ? missingDocuments
              : [],
          fieldStatuses: normalizedFieldStatuses,
          verifiedAt: status === "APPROVED" ? new Date() : undefined,
        },
      });

      if (status === "APPROVED" || status === "UNDER_REVIEW") {
        await db.user.update({
          where: { id: userId },
          data: {
            isVerified: status === "APPROVED",
            status: status === "APPROVED" ? "ACTIVE" : "PENDING",
            role: "TRADER",
            userType: "TRADER",
          },
        });
      }
    } else if (type === "CLIENT" || type === "GOVERNMENT") {
      const actualUserId = id;
      const trader = await db.trader.findUnique({ where: { userId: actualUserId } });

      if (Array.isArray(documentStatuses)) {
        for (const doc of documentStatuses) {
          try {
            await db.traderDocument.update({
              where: { id: doc.id },
              data: { status: doc.status },
            });
          } catch {
            console.warn(`Could not update doc ${doc.id}`);
          }
        }
      }

      if (trader) {
        await db.trader.update({
          where: { id: trader.id },
          data: {
            verificationStatus: status,
            rejectionReason: status === "REJECTED" ? rejectionReason || null : null,
            fieldStatuses: normalizedFieldStatuses,
            verifiedAt: status === "APPROVED" ? new Date() : undefined,
          },
        });
      }

      result = await db.user.update({
        where: { id: actualUserId },
        data: {
          isVerified: status === "APPROVED",
          status: status === "APPROVED" ? "ACTIVE" : status,
        },
      });
    } else {
      return NextResponse.json({ success: false, error: "نوع غير صالح" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Admin verification PATCH error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: "تعذر تحديث حالة التوثيق",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}