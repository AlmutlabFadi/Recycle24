import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { randomUUID } from "crypto";
import { sendEmail } from "@/lib/email/service";

export async function GET() {
    try {
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
        return NextResponse.json({ success: false, error: "ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¯Ø¹ÙˆØ§Øª" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const body = await request.json();
        const { email, phone, roleId, expiresAt } = body;

        if (!roleId || (!email && !phone)) {
            return NextResponse.json({ success: false, error: "Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¯Ø¹ÙˆØ© ØºÙŠØ± Ù…ÙƒØªÙ…Ù„Ø©" }, { status: 400 });
        }

        const role = await db.role.findUnique({ where: { id: roleId } });
        if (!role) {
            return NextResponse.json({ success: false, error: "Ø§Ù„Ø¯ÙˆØ± ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" }, { status: 404 });
        }

        let expiry: Date | null = null;
        if (expiresAt) {
            expiry = new Date(expiresAt);
            if (expiresAt.length === 10) {
                expiry.setHours(23, 59, 59, 999);
            }
        }

        const invite = await db.staffInvite.create({
            data: {
                code: randomUUID().replace(/-/g, ""),
                email: email || null,
                phone: phone || null,
                roleId,
                status: "PENDING",
                expiresAt: expiry,
                createdById: access.userId!,
            },
        });

        // Send invitation email if email is provided
        if (email) {
            const acceptUrl = `${process.env.NEXTAUTH_URL}/invite/${invite.code}`;
            const subject = "دعوة للانضمام إلى فريق عمل Recycle24";
            const html = `
                <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="background-color: #0d1224; padding: 20px; text-align: center;">
                        <h1 style="color: #fff; margin: 0;">Recycle24</h1>
                    </div>
                    <div style="padding: 30px; border: 1px solid #eee;">
                        <h2 style="color: #0d1224;">أهلاً بك في فريق العمل</h2>
                        <p>تمت دعوتك للانضمام إلى فريق إدارة <strong>Recycle24</strong> بصلاحية: <strong>${role.name}</strong>.</p>
                        <p>بصفتك عضواً في الفريق، ستتمكن من الوصول إلى لوحة الإدارة والقيام بالمهام المسندة إليك ضمن هذا الدور.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${acceptUrl}" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">قبول الدعوة وتفعيل الحساب</a>
                        </div>
                        <p style="font-size: 12px; color: #777;">إذا لم تكن تتوقع هذه الدعوة، يرجى تجاهل هذا البريد.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 11px; color: #999; text-align: center;">نظام إدارة Recycle24 - جميع الحقوق محفوظة 2026</p>
                    </div>
                </div>
            `;
            
            await sendEmail(email, subject, html);
        }

        return NextResponse.json({ success: true, invite });
    } catch (error) {
        console.error("Invite POST error:", error);
        return NextResponse.json({ success: false, error: "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¯Ø¹ÙˆØ©" }, { status: 500 });
    }
}

