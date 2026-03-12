import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_FINANCE");
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        const packages = await db.subscriptionPackage.findMany({
            orderBy: { price: "asc" }
        });

        return NextResponse.json({ success: true, packages });
    } catch (error) {
        console.error("Admin subscription packages GET error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل باقات الاشتراك" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_FINANCE");
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        const { name, price, durationDays, benefits } = await request.json();

        if (!name || price === undefined) {
            return NextResponse.json({ success: false, error: "الاسم والسعر مطلوبان" }, { status: 400 });
        }

        const pkg = await db.subscriptionPackage.create({
            data: {
                name,
                price: parseFloat(price),
                durationDays: parseInt(durationDays) || 30,
                benefits: benefits || [],
            }
        });

        return NextResponse.json({ success: true, package: pkg });
    } catch (error) {
        console.error("Admin subscription packages POST error:", error);
        return NextResponse.json({ success: false, error: "تعذر إنشاء الباقة" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_FINANCE");
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        const { id, name, price, durationDays, benefits, isActive } = await request.json();

        if (!id) return NextResponse.json({ success: false, error: "معرف الباقة مطلوب" }, { status: 400 });

        const pkg = await db.subscriptionPackage.update({
            where: { id },
            data: {
                name: name || undefined,
                price: price !== undefined ? parseFloat(price) : undefined,
                durationDays: durationDays !== undefined ? parseInt(durationDays) : undefined,
                benefits: benefits || undefined,
                isActive: isActive !== undefined ? isActive : undefined,
            }
        });

        return NextResponse.json({ success: true, package: pkg });
    } catch (error) {
        console.error("Admin subscription packages PATCH error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحديث الباقة" }, { status: 500 });
    }
}
