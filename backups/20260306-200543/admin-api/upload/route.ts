import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { randomUUID } from "crypto";
import path from "path";
import { promises as fs } from "fs";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
    try {
        const access = await requirePermission("UPLOAD_MEDIA");
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: "الملف غير صالح" }, { status: 400 });
        }

        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
            return NextResponse.json({ error: "نوع الملف غير مدعوم" }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "حجم الملف كبير جداً" }, { status: 400 });
        }

        const ext = path.extname(file.name) || (file.type.startsWith("image/") ? ".jpg" : ".mp4");
        const safeName = `${randomUUID()}${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "knowledge");
        await fs.mkdir(uploadDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(uploadDir, safeName);
        await fs.writeFile(filePath, buffer);

        const url = `/uploads/knowledge/${safeName}`;

        return NextResponse.json({ success: true, url });
    } catch (error) {
        console.error("Admin upload error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر رفع الملف" },
            { status: 500 }
        );
    }
}
