import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomInt } from "crypto";

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

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                titleId: true,
                gender: true,
                email: true,
                phone: true,
                companyName: true,
                companyType: true,
                companyTypeOther: true,
                businessType: true,
                businessTypeOther: true,
                jobTitle: true,
                jobTitleOther: true,
                bio: true,
                notifEmail: true,
                notifSms: true,
                notifWhatsapp: true,
                notifTelegram: true,
                notifPush: true,
                notifDeals: true,
                notifAuctions: true,
                notifMarketing: true,
                smsPhone: true,
                whatsappPhone: true,
                telegramUsername: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
        }

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Get settings error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب الإعدادات" }, { status: 500 });
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
        const updates = body;

        const allowedFields = [
            "firstName", "lastName", "titleId", "gender", "bio",
            "companyName", "companyType", "companyTypeOther",
            "businessType", "businessTypeOther", "jobTitle", "jobTitleOther",
            "notifEmail", "notifSms", "notifWhatsapp", "notifTelegram",
            "notifPush", "notifDeals", "notifAuctions", "notifMarketing",
            "smsPhone", "whatsappPhone", "telegramUsername"
        ];

        const updateData: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                updateData[key] = updates[key];
            }
        }

        if (updateData.firstName || updateData.lastName) {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: { firstName: true, lastName: true },
            });
            const firstName = updateData.firstName || user?.firstName || "";
            const lastName = updateData.lastName || user?.lastName || "";
            updateData.name = `${firstName} ${lastName}`.trim();
        }

        const user = await db.user.update({
            where: { id: userId },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                name: user.name,
                titleId: user.titleId,
                gender: user.gender,
                email: user.email,
                phone: user.phone,
            },
            message: "تم حفظ الإعدادات بنجاح",
        });
    } catch (error) {
        console.error("Update settings error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء حفظ الإعدادات" }, { status: 500 });
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
        const { type, newValue, verificationMethod } = body;

        if (!type || !newValue) {
            return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
        }

        const code = randomInt(100000, 999999).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        await db.user.update({
            where: { id: userId },
            data: {
                verificationCode: code,
                verificationExpiry: expiry,
            },
        });

        console.log(`Verification code for ${type}: ${code} via ${verificationMethod}`);

        return NextResponse.json({
            success: true,
            message: `تم إرسال رمز التحقق عبر ${verificationMethod === "email" ? "البريد الإلكتروني" : verificationMethod === "sms" ? "SMS" : "واتساب"}`,
        });
    } catch (error) {
        console.error("Send verification error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء إرسال رمز التحقق" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }

        const sessionUser = session.user as SessionUser;
        const userId = sessionUser.id;

        const body = await request.json();
        const { type, newValue, code } = body;

        if (!type || !newValue || !code) {
            return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { id: userId },
            select: { verificationCode: true, verificationExpiry: true },
        });

        if (!user || user.verificationCode !== code) {
            return NextResponse.json({ error: "رمز التحقق غير صحيح" }, { status: 400 });
        }

        if (user.verificationExpiry && new Date() > user.verificationExpiry) {
            return NextResponse.json({ error: "انتهت صلاحية رمز التحقق" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {
            verificationCode: null,
            verificationExpiry: null,
        };

        if (type === "email") {
            updateData.email = newValue;
        } else if (type === "phone") {
            updateData.phone = newValue;
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                phone: updatedUser.phone,
            },
            message: type === "email" ? "تم تغيير البريد الإلكتروني بنجاح" : "تم تغيير رقم الهاتف بنجاح",
        });
    } catch (error) {
        console.error("Verify and update error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء التحقق" }, { status: 500 });
    }
}
