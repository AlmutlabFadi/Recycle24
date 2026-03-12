import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bootstrapAccessControl, requirePermission, PERMISSIONS } from "@/lib/rbac";
import { randomUUID } from "crypto";

export async function GET() {
    try {
        await bootstrapAccessControl();
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const invites = await db.staffInvite.findMany({
            orderBy: { createdAt: "desc" },
            include: { role: { select: { id: true, name: true } } },
        });

        return NextResponse.json({ success: true, invites });
    } catch (error) {
        console.error("Invites GET error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل الدعوات" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await bootstrapAccessControl();
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const body = await request.json();
        const { email, phone, roleId, expiresAt } = body;

        if (!roleId || (!email && !phone)) {
            return NextResponse.json({ success: false, error: "بيانات الدعوة غير مكتملة" }, { status: 400 });
        }

        const role = await db.role.findUnique({ where: { id: roleId } });
        if (!role) {
            return NextResponse.json({ success: false, error: "الدور غير موجود" }, { status: 404 });
        }

        const invite = await db.staffInvite.create({
            data: {
                code: randomUUID().replace(/-/g, ""),
                email: email || null,
                phone: phone || null,
                roleId,
                status: "PENDING",
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                createdById: access.userId!,
            },
        });

        return NextResponse.json({ success: true, invite });
    } catch (error) {
        console.error("Invite POST error:", error);
        return NextResponse.json({ success: false, error: "تعذر إنشاء الدعوة" }, { status: 500 });
    }
}
