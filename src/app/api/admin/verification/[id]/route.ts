import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requirePermission("MANAGE_USERS");
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, type, rejectionReason, missingDocuments, fieldStatuses, documentStatuses } = body;

        const allowedStates = ["APPROVED", "REJECTED", "UNDER_REVIEW", "PENDING"];
        if (!status || !allowedStates.includes(status)) {
            return NextResponse.json({ success: false, error: "حالة غير صالحة" }, { status: 400 });
        }

        const effectiveType = type;
        let userId = id;

        if (effectiveType === "TRADER") {
            const trader = await db.trader.findUnique({ where: { id } });
            if (trader) {
                userId = trader.userId;
            }
        } else if (effectiveType === "DRIVER") {
            const driver = await db.driver.findUnique({ where: { id } });
            if (driver) {
                userId = driver.userId;
            }
        }

        const isDriver = effectiveType === "DRIVER";
        const isTrader = effectiveType === "TRADER";
        const isClientOrGov = effectiveType === "CLIENT" || effectiveType === "GOVERNMENT";

        let result: any = null;

        if (isDriver) {
            // Update document statuses
            if (Array.isArray(documentStatuses)) {
                for (const doc of documentStatuses) {
                    try {
                        await (db as any).driverDocument.update({
                            where: { id: doc.id },
                            data: { status: doc.status }
                        });
                    } catch (e) {
                        console.warn(`Could not update driver doc ${doc.id}`);
                    }
                }
            }

            result = await (db as any).driver.update({
                where: { id },
                data: {
                    status: status === "APPROVED" ? "VERIFIED" : status,
                }
            });

            if (status === "APPROVED" || status === "UNDER_REVIEW") {
                await db.user.update({
                    where: { id: userId },
                    data: { 
                        isVerified: status === "APPROVED", 
                        status: status === "APPROVED" ? "ACTIVE" : "PENDING",
                        role: "DRIVER", 
                        userType: "DRIVER" 
                    }
                });
            }
        } else if (isTrader) {
            // Update document statuses
            if (Array.isArray(documentStatuses)) {
                for (const doc of documentStatuses) {
                    try {
                        await db.traderDocument.update({
                            where: { id: doc.id },
                            data: { status: doc.status }
                        });
                    } catch (e) {
                        console.warn(`Could not update trader doc ${doc.id}`);
                    }
                }
            }

            result = await db.trader.update({
                where: { id },
                data: {
                    verificationStatus: status,
                    rejectionReason: status === "REJECTED" ? rejectionReason : null,
                    missingDocuments: status === "REJECTED" && Array.isArray(missingDocuments) ? missingDocuments : [],
                    fieldStatuses: fieldStatuses || undefined,
                    verifiedAt: status === "APPROVED" ? new Date() : undefined,
                }
            });

            if (status === "APPROVED" || status === "UNDER_REVIEW") {
                await db.user.update({
                    where: { id: userId },
                    data: { 
                        isVerified: status === "APPROVED", 
                        status: status === "APPROVED" ? "ACTIVE" : "PENDING", 
                        role: "TRADER", 
                        userType: "TRADER" 
                    }
                });
            }
        } else if (isClientOrGov) {
            // For Clients/Gov, `id` is the User.id (GET returns User records)
            const actualUserId = id;
            const trader = await db.trader.findUnique({ where: { userId: actualUserId } });
            
            // 1. Update document statuses
            if (Array.isArray(documentStatuses)) {
                for (const doc of documentStatuses) {
                    try {
                        await db.traderDocument.update({
                            where: { id: doc.id },
                            data: { status: doc.status }
                        });
                    } catch (e) {
                        console.warn(`Could not update doc ${doc.id}`);
                    }
                }
            }

            // 2. Update trader KYC record
            if (trader) {
                await db.trader.update({
                    where: { id: trader.id },
                    data: {
                        verificationStatus: status,
                        rejectionReason: status === "REJECTED" ? rejectionReason : null,
                        missingDocuments: status === "REJECTED" && Array.isArray(missingDocuments) ? missingDocuments : [],
                        fieldStatuses: fieldStatuses || undefined,
                        verifiedAt: status === "APPROVED" ? new Date() : undefined,
                    }
                });
            }

            // 3. Sync user.status
            result = await db.user.update({
                where: { id: actualUserId },
                data: {
                    isVerified: status === "APPROVED",
                    status: status === "APPROVED" ? "ACTIVE" : status,
                }
            });
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Admin verification PATCH error:", error instanceof Error ? error.message : error);
        return NextResponse.json(
            { success: false, error: "تعذر تحديث حالة التوثيق", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
