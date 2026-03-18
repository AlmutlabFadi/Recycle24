import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const access = await requirePermission("MANAGE_USERS");
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || undefined;
        const type = searchParams.get("type") || "TRADER";

        let data: any[] = [];

        if (type === "TRADER") {
            data = await db.trader.findMany({
                where: { 
                    ...(status ? { verificationStatus: status } : {}),
                    // allow TRADER or CLIENT who happen to apply for Traders (if there is overlap, but stick to frontend rule)
                    user: { OR: [{ userType: "TRADER" }, { role: "TRADER" }] }
                },
                include: {
                    user: {
                        select: { name: true, firstName: true, lastName: true, phone: true, email: true, createdAt: true, userType: true }
                    },
                    documents: { orderBy: { createdAt: "desc" } },
                },
                orderBy: { updatedAt: "desc" },
            });
        } else if (type === "DRIVER") {
            const driverStatusFilter = status
                ? status === "APPROVED"
                    ? { in: ["VERIFIED", "APPROVED"] }
                    : status === "UNDER_REVIEW"
                        ? { in: ["UNDER_REVIEW", "PENDING"] }
                        : status
                : undefined;

            data = await db.driver.findMany({
                where: {
                    ...(driverStatusFilter ? { status: driverStatusFilter as any } : {}),
                },
                include: {
                    user: {
                        select: { name: true, firstName: true, lastName: true, phone: true, email: true, createdAt: true, userType: true }
                    },
                    documents: { orderBy: { createdAt: "desc" } },
                    vehicles: true,
                },
                orderBy: { updatedAt: "desc" },
            });
        } else if (type === "CLIENT" || type === "GOVERNMENT") {
            // For Clients and Government, their KYC data is stored under the Trader model in DB.
            // We filter by trader.verificationStatus to correctly partition requests across tabs.
            const users = await db.user.findMany({
                where: {
                    OR: [
                        { userType: type },
                        { role: type }
                    ],
                    // Only show users who actually submitted a verification request (have a trader record)
                    trader: status
                        ? { verificationStatus: status }
                        : { isNot: null },
                },
                include: {
                    trader: {
                        include: { documents: true }
                    }
                },
                orderBy: { createdAt: "desc" },
            });

            // Map the format to be identical to what the frontend expects
            data = users.map(user => ({
                ...user,
                documents: user.trader?.documents || [],
                verificationStatus: user.trader?.verificationStatus || "PENDING",
            }));
        }

        // Fetch counts strictly partitioned by the actual tab type
        const counts = {
            TRADER: await db.trader.count({ where: { verificationStatus: "PENDING", user: { OR: [{ userType: "TRADER" }, { role: "TRADER" }] } } }),
            DRIVER: await db.driver.count({ where: { status: "PENDING" } }),
            CLIENT: await db.user.count({ where: { OR: [{ userType: "CLIENT" }, { role: "CLIENT" }], trader: { verificationStatus: "PENDING" } } }),
            GOVERNMENT: await db.user.count({ where: { OR: [{ userType: "GOVERNMENT" }, { role: "GOVERNMENT" }], trader: { verificationStatus: "PENDING" } } }),
        };

        return NextResponse.json({ success: true, data, counts });
    } catch (error) {
        console.error("Admin verification GET error:", error);
        return NextResponse.json(
            { success: false, error: "تعذر تحميل بيانات التوثيق" },
            { status: 500 }
        );
    }
}
