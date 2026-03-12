import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface SessionUser {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
}

interface TraderApprovalRequest {
    traderId: string;
    action: "APPROVE" | "REJECT";
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const sessionUser = session.user as SessionUser;
        
        if (sessionUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body: TraderApprovalRequest = await request.json();
        const { traderId, action } = body;

        if (!traderId || !action) {
            return NextResponse.json({ error: "Missing required fields: traderId and action" }, { status: 400 });
        }

        if (action !== "APPROVE" && action !== "REJECT") {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        if (!/^[a-zA-Z0-9]+$/.test(traderId)) {
            return NextResponse.json({ error: "Invalid traderId format" }, { status: 400 });
        }

        const trader = await db.trader.findUnique({
            where: { id: traderId },
            include: { user: true }
        });

        if (!trader) {
            return NextResponse.json({ error: "Trader not found" }, { status: 404 });
        }

        const updateStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
        const updateTraderData = action === "APPROVE" ? {
            verificationStatus: "APPROVED",
            verifiedAt: new Date()
        } : {
            verificationStatus: "REJECTED"
        };
        const updateUserData = action === "APPROVE" ? {
            isVerified: true,
            status: "ACTIVE"
        } : {
            status: "REJECTED"
        };

        await db.$transaction(async (tx) => {
            await tx.trader.update({
                where: { id: traderId },
                data: updateTraderData
            });

            if (trader.userId) {
                await tx.user.update({
                    where: { id: trader.userId },
                    data: updateUserData
                });
            }
        });

        // Here we would typically trigger an email/SMS notification to the user

        return NextResponse.json({ success: true, message: `${action} trader successfully`, trader });
    } catch (error) {
        console.error("Admin KYC approval error:", error);
        return NextResponse.json(
            { error: "Internal server error during approval" },
            { status: 500 }
        );
    }
}