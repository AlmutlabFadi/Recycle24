import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_FINANCE");
        if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: access.status });

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "ALL"; // ALL, AUCTION, DEAL

        const [auctions, deals] = await Promise.all([
            type === "DEAL" ? [] : db.auction.findMany({
                include: { 
                    seller: { select: { name: true, phone: true } },
                    participants: {
                        select: {
                            userId: true,
                            depositStatus: true,
                            isExempt: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                take: 100,
            }),
            type === "AUCTION" ? [] : db.deal.findMany({
                include: { 
                    seller: { select: { name: true, phone: true } },
                    buyer: { select: { name: true, phone: true } }
                },
                orderBy: { createdAt: "desc" },
                take: 100,
            })
        ]);

        return NextResponse.json({ 
            success: true, 
            marketplace: {
                auctions,
                deals
            }
        });
    } catch (error) {
        console.error("Admin marketplace GET error:", error);
        return NextResponse.json({ success: false, error: "تعذر تحميل بيانات السوق" }, { status: 500 });
    }
}
