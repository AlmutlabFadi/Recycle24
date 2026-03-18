import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/auctions/[id] - الحصول على تفاصيل مزاد واحد
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const auction = await db.auction.findUnique({
            where: { id },
            include: {
                seller: {
                    select: { id: true, name: true, phone: true },
                },
                bids: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                    include: {
                        bidder: {
                            select: { id: true, name: true },
                        },
                    },
                },
                images: {
                    orderBy: { order: "asc" },
                },
                lots: {
                    orderBy: { lineNo: "asc" },
                },
            },
        });

        if (!auction) {
            return NextResponse.json(
                { error: "المزاد غير موجود" },
                { status: 404 }
            );
        }

        // Check if current user joined
        const session = await getServerSession(authOptions);
        let hasJoined = false;
        if (session?.user) {
            const participant = await db.auctionParticipant.findUnique({
                where: {
                    auctionId_userId: {
                        auctionId: id,
                        userId: session.user.id
                    }
                }
            });
            hasJoined = !!participant;
        }

        const highestBid = auction.bids[0]?.amount || auction.startingBid;
        const bidsCount = await db.bid.count({ where: { auctionId: id } });

        // تحويل البيانات للواجهة
        const auctionResponse = {
            id: auction.id,
            title: auction.title,
            category: auction.category,
            weight: auction.weight,
            weightUnit: auction.weightUnit,
            location: auction.location,
            startingBid: auction.startingBid,
            buyNowPrice: auction.buyNowPrice,
            securityDeposit: auction.securityDeposit,
            entryFee: auction.entryFee,
            currentBid: highestBid,
            status: auction.status,
            workflowStatus: auction.workflowStatus,
            duration: auction.duration,
            scheduledAt: auction.scheduledAt,
            startedAt: auction.startedAt,
            endsAt: auction.endsAt,
            winnerId: auction.winnerId,
            finalPrice: auction.finalPrice,
            createdAt: auction.createdAt,
            seller: auction.seller,
            images: auction.images,
            lots: auction.lots,
            bidsCount,
            hasJoined,
            recentBids: auction.bids.map((bid: { id: string; amount: number; bidder: { id: string; name: string | null }; createdAt: Date }) => ({
                id: bid.id,
                amount: bid.amount,
                bidder: bid.bidder,
                createdAt: bid.createdAt,
            })),
        };

        return NextResponse.json({
            success: true,
            auction: auctionResponse,
        });
    } catch (error) {
        console.error("Get auction error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء جلب المزاد" },
            { status: 500 }
        );
    }
}

// DELETE /api/auctions/[id] - حذف مزاد
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // التحقق من وجود المزاد
        const auction = await db.auction.findUnique({
            where: { id },
        });

        if (!auction) {
            return NextResponse.json(
                { error: "المزاد غير موجود" },
                { status: 404 }
            );
        }

        // حذف المزاد (سيتم حذف الصور والمزايدات تلقائياً بسبب cascade)
        await db.auction.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "تم حذف المزاد بنجاح",
        });
    } catch (error) {
        console.error("Delete auction error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء حذف المزاد" },
            { status: 500 }
        );
    }
}

// PATCH /api/auctions/[id] - تعديل المزاد (فقط في حالة PENDING_APPROVAL)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const auction = await db.auction.findUnique({ where: { id } });
        if (!auction) {
            return NextResponse.json({ error: "المزاد غير موجود" }, { status: 404 });
        }

        if (auction.sellerId !== (session.user as { id: string }).id) {
            return NextResponse.json({ error: "غير مصرح لك بتعديل هذا المزاد" }, { status: 403 });
        }

        const body = await request.json();

        // Check if this is a cancel request
        if (body.cancelAuction === true) {
            if (auction.workflowStatus !== "PENDING_APPROVAL") {
                return NextResponse.json({ error: "لا يمكن إلغاء المزاد في هذه المرحلة" }, { status: 400 });
            }
            const cancelled = await db.auction.update({
                where: { id },
                data: { workflowStatus: "CANCELED", status: "CANCELED" },
            });
            return NextResponse.json({ success: true, auction: cancelled });
        }

        if (auction.workflowStatus !== "PENDING_APPROVAL") {
            return NextResponse.json(
                { error: "لا يمكن تعديل المزاد بعد بدء المعالجة أو النشر" },
                { status: 400 }
            );
        }

        const {
            title, material, weight, startingPrice, buyNowPrice,
            governorate, address, startDate, endDate,

            // New rich fields
            organization, notes, pricingMode, 
            startingBidCurrency, startingBidUnit,
            buyNowPriceCurrency,
            securityDeposit, securityDepositCurrency, securityDepositMethod,
            shipmentDurationDays,
            
            allowPreview, previewStartDate, previewEndDate, previewStartTime, previewEndTime,
            
            items, // Array of AuctionItem
            documents // Array of AuctionDocument
        } = body;

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (material !== undefined) updateData.category = material;
        if (weight !== undefined) updateData.weight = Number(weight);
        if (startingPrice !== undefined) updateData.startingBid = Number(startingPrice);
        if (buyNowPrice !== undefined) updateData.buyNowPrice = buyNowPrice ? Number(buyNowPrice) : null;
        if (governorate || address) {
            updateData.location = governorate && address
                ? `${governorate}, ${address}`
                : governorate || address || auction.location;
        }
        if (startDate !== undefined) updateData.scheduledAt = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) updateData.endsAt = endDate ? new Date(endDate) : null;

        // Rich primitive fields
        if (organization !== undefined) updateData.organization = organization;
        if (notes !== undefined) updateData.notes = notes;
        if (pricingMode !== undefined) updateData.pricingMode = pricingMode;
        if (startingBidCurrency !== undefined) updateData.startingBidCurrency = startingBidCurrency;
        if (startingBidUnit !== undefined) updateData.startingBidUnit = startingBidUnit;
        if (buyNowPriceCurrency !== undefined) updateData.buyNowPriceCurrency = buyNowPriceCurrency;
        
        if (securityDeposit !== undefined) updateData.securityDeposit = Number(securityDeposit);
        if (securityDepositCurrency !== undefined) updateData.securityDepositCurrency = securityDepositCurrency;
        if (securityDepositMethod !== undefined) updateData.securityDepositMethod = securityDepositMethod;
        
        if (shipmentDurationDays !== undefined) updateData.shipmentDurationDays = Number(shipmentDurationDays);
        if (allowPreview !== undefined) updateData.allowPreview = allowPreview;
        if (previewStartDate !== undefined) updateData.previewStartDate = previewStartDate ? new Date(previewStartDate) : null;
        if (previewEndDate !== undefined) updateData.previewEndDate = previewEndDate ? new Date(previewEndDate) : null;
        if (previewStartTime !== undefined) updateData.previewStartTime = previewStartTime;
        if (previewEndTime !== undefined) updateData.previewEndTime = previewEndTime;

        // Perform main auction update
        const updated = await db.auction.update({ where: { id }, data: updateData });

        // Update relations if provided
        if (items && Array.isArray(items)) {
            await (db as any).auctionItem.deleteMany({ where: { auctionId: id } });
            if (items.length > 0) {
                await (db as any).auctionItem.createMany({
                    data: items.map((item: any) => ({
                        auctionId: id,
                        type: item.type,
                        customType: item.customType || null,
                        weight: Number(item.weight) || 0,
                        unit: item.unit,
                        isAccurate: item.isAccurate === true || item.isAccurate === "true"
                    }))
                });
            }
        }

        if (documents && Array.isArray(documents)) {
            await (db as any).auctionDocument.deleteMany({ where: { auctionId: id } });
            if (documents.length > 0) {
                await (db as any).auctionDocument.createMany({
                    data: documents.map((doc: any) => ({
                        auctionId: id,
                        fileUrl: doc.fileUrl,
                        fileName: doc.fileName || null,
                        fileSize: doc.fileSize ? Number(doc.fileSize) : null
                    }))
                });
            }
        }

        return NextResponse.json({ success: true, auction: updated });
    } catch (error) {
        console.error("Patch auction error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء تعديل المزاد" }, { status: 500 });
    }
}
