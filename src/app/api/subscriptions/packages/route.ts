import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        // Public API to fetch active subscription packages for users
        const packages = await db.subscriptionPackage.findMany({
            where: { isActive: true },
            orderBy: { price: "asc" }
        });

        return NextResponse.json({ success: true, packages });
    } catch (error) {
        console.error("Public subscription packages GET error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل باقات الاشتراك" }, { status: 500 });
    }
}
