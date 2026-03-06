import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomUUID } from "crypto";
import path from "path";
import { promises as fs } from "fs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit for verification docs

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: "الملف غير صالح" }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "الرجاء رفع صورة فقط" }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)" }, { status: 400 });
        }

        const ext = path.extname(file.name) || ".jpg";
        const safeName = `${randomUUID()}${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "verification");
        await fs.mkdir(uploadDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(uploadDir, safeName);
        await fs.writeFile(filePath, buffer);

        const url = `/uploads/verification/${safeName}`;

        return NextResponse.json({ success: true, url });
    } catch (error) {
        console.error("User upload error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر رفع الملف" },
            { status: 500 }
        );
    }
}
