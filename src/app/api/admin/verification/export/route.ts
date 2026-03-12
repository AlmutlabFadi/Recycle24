import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import * as XLSX from "xlsx";

const statusLabelMap: Record<string, string> = {
  PENDING: "قيد الانتظار",
  UNDER_REVIEW: "قيد المعالجة",
  APPROVED: "تم التوثيق",
  REJECTED: "مرفوض",
  VERIFIED: "موثق",
};

const typeLabelMap: Record<string, string> = {
  TRADER: "تاجر",
  DRIVER: "سائق",
  CLIENT: "عميل",
  GOVERNMENT: "حكومي",
};

export async function GET(request: NextRequest) {
  try {
    const access = await requirePermission("MANAGE_USERS");
    if (!access.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "ALL";
    const status = searchParams.get("status") || "ALL";

    const traders = await db.trader.findMany({
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
            role: true,
            userType: true,
            createdAt: true,
          },
        },
        documents: {
          select: {
            type: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const drivers = await db.driver.findMany({
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
            role: true,
            userType: true,
            createdAt: true,
          },
        },
        documents: {
          select: {
            type: true,
            status: true,
          },
        },
        vehicles: {
          select: {
            plateNumber: true,
            make: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const clientUsers = await db.user.findMany({
      where: {
        OR: [{ userType: "CLIENT" }, { userType: "GOVERNMENT" }],
        trader: { isNot: null },
      },
      include: {
        trader: {
          include: {
            documents: {
              select: {
                type: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows: Record<string, string | number>[] = [];

    for (const t of traders) {
      const userType = t.user?.userType || t.user?.role || "TRADER";
      if (userType === "CLIENT" || userType === "GOVERNMENT") continue;
      if (type !== "ALL" && type !== "TRADER") continue;
      if (status !== "ALL" && t.verificationStatus !== status) continue;

      rows.push({
        "نوع الحساب": typeLabelMap.TRADER,
        "الاسم الكامل": t.user?.name || "---",
        "الاسم التجاري": t.businessName || "---",
        "رقم الهاتف": t.user?.phone || "---",
        "البريد الإلكتروني": t.user?.email || "---",
        "رقم السجل التجاري": t.registrationNumber || "---",
        "الرقم الضريبي": t.taxNumber || "---",
        "رقم غرفة التجارة": t.chamberRegistrationNumber || "---",
        "اسم الأب": t.fatherName || "---",
        "اسم الأم": t.motherName || "---",
        "تاريخ الميلاد": t.dateOfBirth ? new Date(t.dateOfBirth).toLocaleDateString("ar-SY") : "---",
        "المحافظة": t.governorate || t.location || "---",
        "حالة التوثيق": statusLabelMap[t.verificationStatus] || t.verificationStatus,
        "سبب الرفض": t.rejectionReason || "---",
        "عدد المستندات": t.documents?.length || 0,
        "تاريخ التقديم": t.createdAt ? new Date(t.createdAt).toLocaleDateString("ar-SY") : "---",
        "آخر تحديث": t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("ar-SY") : "---",
      });
    }

    for (const d of drivers) {
      if (type !== "ALL" && type !== "DRIVER") continue;
      const dStatus = d.status || "PENDING";
      if (status !== "ALL" && dStatus !== status) continue;

      const vehicle = d.vehicles?.[0];

      rows.push({
        "نوع الحساب": typeLabelMap.DRIVER,
        "الاسم الكامل": d.user?.name || d.fullName || "---",
        "الاسم التجاري": "---",
        "رقم الهاتف": d.user?.phone || d.phone || "---",
        "البريد الإلكتروني": d.user?.email || "---",
        "رقم السجل التجاري": "---",
        "الرقم الضريبي": "---",
        "رقم غرفة التجارة": "---",
        "اسم الأب": "---",
        "اسم الأم": "---",
        "تاريخ الميلاد": "---",
        "المحافظة": d.city || "---",
        "رقم اللوحة": vehicle?.plateNumber || "---",
        "نوع المركبة": vehicle?.make || "---",
        "لون المركبة": vehicle?.color || "---",
        "حالة التوثيق": statusLabelMap[dStatus] || dStatus,
        "سبب الرفض": "---",
        "عدد المستندات": d.documents?.length || 0,
        "تاريخ التقديم": d.createdAt ? new Date(d.createdAt).toLocaleDateString("ar-SY") : "---",
        "آخر تحديث": d.updatedAt ? new Date(d.updatedAt).toLocaleDateString("ar-SY") : "---",
      });
    }

    for (const u of clientUsers) {
      const userType = u.userType || "CLIENT";
      if (type !== "ALL" && type !== userType) continue;

      const vStatus = u.trader?.verificationStatus || "PENDING";
      if (status !== "ALL" && vStatus !== status) continue;

      rows.push({
        "نوع الحساب": typeLabelMap[userType] || userType,
        "الاسم الكامل": u.name || "---",
        "الاسم التجاري": "---",
        "رقم الهاتف": u.phone || "---",
        "البريد الإلكتروني": u.email || "---",
        "رقم السجل التجاري": "---",
        "الرقم الضريبي": "---",
        "رقم غرفة التجارة": "---",
        "اسم الأب": u.trader?.fatherName || "---",
        "اسم الأم": u.trader?.motherName || "---",
        "تاريخ الميلاد": u.trader?.dateOfBirth ? new Date(u.trader.dateOfBirth).toLocaleDateString("ar-SY") : "---",
        "المحافظة": "---",
        "حالة التوثيق": statusLabelMap[vStatus] || vStatus,
        "سبب الرفض": u.trader?.rejectionReason || "---",
        "عدد المستندات": u.trader?.documents?.length || 0,
        "تاريخ التقديم": u.trader?.createdAt ? new Date(u.trader.createdAt).toLocaleDateString("ar-SY") : "---",
        "آخر تحديث": u.trader?.updatedAt ? new Date(u.trader.updatedAt).toLocaleDateString("ar-SY") : "---",
      });
    }

    const wb = XLSX.utils.book_new();
    const typeName = type === "ALL" ? "الكل" : (typeLabelMap[type] || type);
    const statusName = status === "ALL" ? "الكل" : (statusLabelMap[status] || status);
    const sheetName = `${typeName} - ${statusName}`.substring(0, 31);

    if (rows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = Object.keys(rows[0]).map((key) => ({
        wch: Math.max(key.length * 2, 15),
      }));
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    } else {
      const ws = XLSX.utils.json_to_sheet([{ "ملاحظة": "لا توجد بيانات مطابقة للفلاتر المحددة" }]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const now = new Date().toISOString().split("T")[0];
    const filename = `Recycle24_Verification_${type}_${status}_${now}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تصدير البيانات", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}