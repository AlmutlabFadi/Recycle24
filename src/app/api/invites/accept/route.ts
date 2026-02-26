import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/rbac";

export async function POST(request: NextRequest) {
    try {
        const userId = await getSessionUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ success: false, error: "رمز الدعوة مطلوب" }, { status: 400 });
        }

        const invite = await db.staffInvite.findUnique({ where: { code } });
        if (!invite) {
            return NextResponse.json({ success: false, error: "الدعوة غير موجودة" }, { status: 404 });
        }

        if (invite.status !== "PENDING") {
            return NextResponse.json({ success: false, error: "هذه الدعوة غير صالحة" }, { status: 400 });
        }

        if (invite.expiresAt && invite.expiresAt < new Date()) {
            return NextResponse.json({ success: false, error: "انتهت صلاحية الدعوة" }, { status: 400 });
        }

        await db.$transaction(async (tx) => {
            await tx.userRole.createMany({
                data: [{ userId, roleId: invite.roleId }],
                skipDuplicates: true,
            });
            await tx.staffInvite.update({
                where: { id: invite.id },
                data: { status: "USED", usedById: userId, usedAt: new Date() },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Invite accept error:", error);
        return NextResponse.json({ success: false, error: "تعذر قبول الدعوة" }, { status: 500 });
    }
}
