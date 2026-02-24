import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

interface SessionUser {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }

        const sessionUser = session.user as SessionUser;
        const userId = sessionUser.id;
        const { searchParams } = new URL(request.url);

        const sessions = await db.session.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        const securityLogs = await db.securityLog.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                twoFactorEnabled: true,
                twoFactorMethod: true,
                faceIdEnabled: true,
                phone: true,
            },
        });

        return NextResponse.json({
            success: true,
            sessions: sessions.map((s: { id: string; device: string | null; deviceType: string | null; location: string | null; createdAt: Date; token: string }) => ({
                id: s.id,
                device: s.device || "جهاز غير معروف",
                deviceType: s.deviceType || "phone",
                location: s.location || "غير معروف",
                lastActive: s.createdAt,
                isCurrent: s.token === searchParams.get("token"),
            })),
            securityLogs: securityLogs.map((log: { id: string; level: string; event: string; details: string | null; createdAt: Date }) => ({
                id: log.id,
                type: log.level.toLowerCase(),
                message: log.event,
                details: log.details,
                time: log.createdAt,
            })),
            securitySettings: {
                twoFactorEnabled: user?.twoFactorEnabled || false,
                twoFactorMethod: user?.twoFactorMethod || "whatsapp",
                faceIdEnabled: user?.faceIdEnabled || false,
                phone: user?.phone,
            },
        });
    } catch (error) {
        console.error("Get security settings error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب إعدادات الأمان" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }

        const sessionUser = session.user as SessionUser;
        const userId = sessionUser.id;

        const body = await request.json();
        const { action, ...data } = body;

        if (action === "toggleFaceId") {
            const user = await db.user.update({
                where: { id: userId },
                data: { faceIdEnabled: data.enabled },
            });
            return NextResponse.json({
                success: true,
                faceIdEnabled: user.faceIdEnabled,
                message: data.enabled ? "تم تفعيل Face ID" : "تم إيقاف Face ID",
            });
        }

        if (action === "toggle2FA") {
            const user = await db.user.update({
                where: { id: userId },
                data: {
                    twoFactorEnabled: data.enabled,
                    twoFactorMethod: data.method || "whatsapp",
                },
            });
            return NextResponse.json({
                success: true,
                twoFactorEnabled: user.twoFactorEnabled,
                message: data.enabled ? "تم تفعيل المصادقة الثنائية" : "تم إيقاف المصادقة الثنائية",
            });
        }

        if (action === "terminateSession") {
            await db.session.delete({
                where: { id: data.sessionId },
            });
            return NextResponse.json({
                success: true,
                message: "تم تسجيل الخروج من الجهاز",
            });
        }

        if (action === "terminateAllSessions") {
            await db.session.deleteMany({
                where: {
                    userId,
                    NOT: { token: data.currentToken },
                },
            });
            return NextResponse.json({
                success: true,
                message: "تم تسجيل الخروج من جميع الأجهزة الأخرى",
            });
        }

        if (action === "changePassword") {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: { password: true },
            });

            if (!user) {
                return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
            }

            const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);
            if (!isValidPassword) {
                return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(data.newPassword, 10);
            await db.user.update({
                where: { id: userId },
                data: { password: hashedPassword },
            });

            await db.securityLog.create({
                data: {
                    userId,
                    level: "INFO",
                    event: "تغيير كلمة المرور",
                    details: "تم تغيير كلمة المرور بنجاح",
                },
            });

            return NextResponse.json({
                success: true,
                message: "تم تغيير كلمة المرور بنجاح",
            });
        }

        return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
    } catch (error) {
        console.error("Update security settings error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء تحديث إعدادات الأمان" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }

        const sessionUser = session.user as SessionUser;
        const userId = sessionUser.id;

        const body = await request.json();
        const { type, method } = body;

        const code = randomInt(100000, 999999).toString();

        await db.user.update({
            where: { id: userId },
            data: {
                verificationCode: code,
                verificationExpiry: new Date(Date.now() + 10 * 60 * 1000),
            },
        });

        console.log(`Sending ${type} code ${code} via ${method}`);

        return NextResponse.json({
            success: true,
            message: `تم إرسال رمز التحقق عبر ${method === "whatsapp" ? "واتساب" : method === "sms" ? "SMS" : "البريد الإلكتروني"}`,
        });
    } catch (error) {
        console.error("Send security code error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء إرسال رمز التحقق" }, { status: 500 });
    }
}
