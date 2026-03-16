import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface SessionUser {
    id: string;
    name?: string | null;
    role?: string;
}

// GET /api/admin/auctions - Get all auctions for admin review
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const workflowStatus = searchParams.get("workflowStatus") || "PENDING_APPROVAL";

        const auctions = await db.auction.findMany({
            where: workflowStatus === "ALL" ? {} : { workflowStatus: workflowStatus as any },
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        companyName: true,
                        trader: {
                            select: {
                                businessName: true,
                                licenseNumber: true,
                                governorate: true,
                            }
                        }
                    },
                },
                images: { orderBy: { order: "asc" } },
                items: { orderBy: { createdAt: "asc" } },
                documents: { orderBy: { createdAt: "asc" } },
                bids: { take: 1, orderBy: { amount: "desc" } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, auctions });
    } catch (error) {
        console.error("Admin get auctions error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب المزادات" }, { status: 500 });
    }
}
