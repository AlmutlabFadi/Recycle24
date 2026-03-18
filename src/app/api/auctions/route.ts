import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

interface SessionUser {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
}

type AuctionWhereInput = Prisma.AuctionWhereInput;

// Helper function to parse and validate pagination parameters
function parsePagination(searchParams: URLSearchParams, defaultPage: number, defaultLimit: number): { page: number; limit: number } {
    const page = parseInt(searchParams.get("page") || defaultPage.toString());
    const limit = parseInt(searchParams.get("limit") || defaultLimit.toString());

    if (isNaN(page) || isNaN(limit)) {
        throw new Error("Invalid page or limit value");
    }

    return { page, limit };
}

// Helper function to calculate total pages based on total count and limit
function calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
}

// Helper function to validate date format
function validateDateFormat(dateString: string): boolean {
    return !isNaN(new Date(dateString).getTime());
}

// Helper function to validate required fields
function validateRequiredFields(body: any): boolean {
    const requiredFields = ["title", "material", "weight", "startingPrice", "endDate"];
    return requiredFields.every(field => body[field] !== undefined);
}

// Helper function to validate auction creation data
async function validateAuctionData(db: any, body: any, sellerId: string): Promise<void> {
    if (!validateRequiredFields(body)) {
        throw new Error("All required fields must be provided");
    }

    if (!validateDateFormat(body.startDate) || !validateDateFormat(body.endDate)) {
        throw new Error("Invalid date format");
    }

    const endD = new Date(body.endDate);
    const startD = body.startDate ? new Date(body.startDate) : new Date();
    if (endD.getTime() <= startD.getTime()) {
        throw new Error("End date must be after start date");
    }

    const durationHours = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60)));

    const existingAuction = await db.auction.findFirst({
        where: {
            OR: [
                { title: body.title },
                { category: body.material },
                { location: `${body.governorate}, ${body.address}` },
            ],
            NOT: {
                sellerId,
            },
        },
    });

    if (existingAuction) {
        throw new Error("An auction with the same details already exists");
    }
}

// GET /api/auctions - الحصول على قائمة المزادات
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const { page, limit } = parsePagination(searchParams, 1, 10);

        const where: AuctionWhereInput = {};
        const statusParam = searchParams.get("status");
        if (statusParam) {
            where.status = statusParam;
        }
        const materialParam = searchParams.get("material");
        if (materialParam) {
            where.category = materialParam;
        }
        const govParam = searchParams.get("governorate");
        if (govParam) {
            where.location = { contains: govParam };
        }

        const auctions = await db.auction.findMany({
            where,
            include: {
                seller: {
                    select: { id: true, name: true, role: true },
                },
                bids: {
                    orderBy: { amount: "desc" },
                    take: 1,
                    include: {
                        bidder: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await db.auction.count({ where });

        return NextResponse.json({
            success: true,
            auctions,
            pagination: {
                page,
                limit,
                total,
                pages: calculateTotalPages(total, limit),
            },
        });
    } catch (error) {
        console.error("Get auctions error:", error);
        return NextResponse.json(
            { error: "An error occurred while fetching auctions" },
            { status: 500 }
        );
    }
}

// POST /api/auctions - إنشاء مزاد جديد
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const sessionUser = session.user as SessionUser;
        const sellerId = sessionUser.id;

        const body = await request.json();

        // Remove old basic validation since we rely on the rich payload now
        // await validateAuctionData(db, body, sellerId);

        const {
            title,
            auctionType,
            organization,
            governorate,
            address,
            startDate,
            endDate,
            materials,
            pricingMode,
            auctionDomain,
            auctionDirection,
            currency,
            pricingModeV2,
            winnerSelectionMode,
            jurisdictionCountry,
            governingLaw,
            disputeWindowHours,
            lots,
            jurisdictionCity,
            startingBidCurrency,
            startingBidUnit,
            buyNowPriceCurrency,
            startingPrice, // used as startingBidAmount
            buyNowPrice,   // used as buyNowPriceAmount
            securityDepositAmount,
            securityDepositCurrency,
            securityDepositPaymentMethod,
            allowPreview,
            previewStartDate,
            previewEndDate,
            previewStartTime,
            previewEndTime,
            notes,
            shipmentDurationDays,
            images,
            videos,
            termsFiles
        } = body;

        const endD = new Date(endDate);
        const startD = startDate ? new Date(startDate) : new Date();
        const durationHours = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60)));

        const materialPriceMap = new Map<string, any>();
        if (Array.isArray(body.materialPrices)) {
            for (const price of body.materialPrices) {
                if (price?.id) materialPriceMap.set(price.id, price);
            }
        }

        const resolvedCurrency = currency || startingBidCurrency || "SYP";
        const resolvedPricingMode = pricingModeV2 || "BUNDLE_BASED"; // Default to BUNDLE_BASED if not specified

        const lotsPayload = Array.isArray(lots) && lots.length > 0
            ? lots.map((l: any, index: number) => ({
                lineNo: l.lineNo || index + 1,
                title: l.title || `Lot ${index + 1}`,
                description: l.description || null,
                category: l.category || (materials && materials[0] ? materials[0].type : "أخرى"),
                quantity: Number(l.quantity || 0),
                unit: l.unit || "kg",
                pricingUnit: l.pricingUnit || l.unit || "kg",
                startingPrice: Number(l.startingPrice || 0),
                reservePrice: l.reservePrice ? Number(l.reservePrice) : null,
                buyNowPrice: l.buyNowPrice ? Number(l.buyNowPrice) : null,
                depositModeOverride: l.depositModeOverride || l.depositMode || "NONE",
                depositAmountOverride: Number(l.depositAmountOverride || l.depositValue || 0),
                currency: l.currency || resolvedCurrency,
                direction: l.direction || auctionDirection || "FORWARD",
                status: "DRAFT" as const,
            }))
            : (materials || []).map((m: any, index: number) => {
                const price = materialPriceMap.get(m.id);
                const startAmount = pricingMode === "per_material" && price?.amount ? price.amount : startingPrice;
                const unit = price?.unit || startingBidUnit || m.unit || "kg";
                return {
                    lineNo: index + 1,
                    title: m.type === "أخرى" ? m.customType || "مادة" : m.type || "مادة",
                    description: null,
                    category: m.type === "أخرى" ? m.customType || "أخرى" : m.type || "أخرى",
                    quantity: Number(m.weight || 0),
                    unit: m.unit || "kg",
                    pricingUnit: unit,
                    startingPrice: Number(startAmount || 0),
                    reservePrice: null,
                    buyNowPrice: buyNowPrice ? Number(buyNowPrice) : null,
                    depositModeOverride: Number(securityDepositAmount || 0) > 0 ? "FIXED" : "NONE",
                    depositAmountOverride: Number(securityDepositAmount || 0),
                    currency: resolvedCurrency,
                    direction: auctionDirection || "FORWARD",
                    status: "DRAFT" as const,
                };
            });

        const auction = await db.auction.create({
            data: {
                sellerId,
                title,
                // Maps the first item type for legacy category requirement, properly saved in items relation below
                category: materials && materials[0] ? (materials[0].type === "أخرى" ? materials[0].customType : materials[0].type) : "غير محدد",
                weight: materials && materials[0] ? Number(materials[0].weight || 0) : 0,
                
                startingBid: Number(startingPrice || 0),
                buyNowPrice: buyNowPrice ? Number(buyNowPrice) : null,
                securityDeposit: Number(securityDepositAmount || 0),
                
                location: governorate && address ? `${governorate}, ${address}` : (governorate || address || "غير محدد"),
                duration: durationHours,
                scheduledAt: startD,
                endsAt: endD,
                status: "PENDING",
                workflowStatus: "PENDING_APPROVAL",
                type: auctionType === "government" ? "GOVERNMENT" : "PRIVATE",
                organization: auctionType === "government" ? organization : null,

                auctionDomain: auctionDomain || "ASSET_SALE",
                auctionDirection: auctionDirection || "FORWARD",
                currency: resolvedCurrency,
                pricingModeV2: resolvedPricingMode,
                winnerSelectionMode: winnerSelectionMode || "SINGLE_WINNER",
                jurisdictionCountry: jurisdictionCountry || null,
                jurisdictionCity: jurisdictionCity || null,
                governingLaw: governingLaw || null,
                disputeWindowHours: disputeWindowHours ? Number(disputeWindowHours) : null,

                pricingMode: pricingMode || "unified",
                startingBidCurrency: startingBidCurrency || "SYP",
                startingBidUnit: startingBidUnit || "total",
                buyNowPriceCurrency: buyNowPriceCurrency || "SYP",
                securityDepositCurrency: securityDepositCurrency || "SYP",
                securityDepositMethod: securityDepositPaymentMethod || "platform",

                allowPreview: !!allowPreview,
                previewStartDate: previewStartDate ? new Date(previewStartDate) : null,
                previewEndDate: previewEndDate ? new Date(previewEndDate) : null,
                previewStartTime: previewStartTime || null,
                previewEndTime: previewEndTime || null,

                notes: notes || null,
                shipmentDurationDays: shipmentDurationDays ? Number(shipmentDurationDays) : null,

                lots: lotsPayload.length > 0 ? {
                    create: lotsPayload.map((lot: any) => ({
                        lineNo: Number(lot.lineNo || 0),
                        title: lot.title,
                        description: lot.description || null,
                        category: lot.category || "أخرى",
                        quantity: Number(lot.quantity || 0),
                        unit: lot.unit || "kg",
                        pricingUnit: lot.pricingUnit || lot.unit || "kg",
                        startingPrice: Number(lot.startingPrice || 0),
                        reservePrice: lot.reservePrice ? Number(lot.reservePrice) : null,
                        buyNowPrice: lot.buyNowPrice ? Number(lot.buyNowPrice) : null,
                        direction: lot.direction || "FORWARD",
                        currency: lot.currency || "SYP",
                        depositModeOverride: lot.depositModeOverride || "NONE",
                        depositAmountOverride: Number(lot.depositAmountOverride || 0),
                        status: lot.status || "DRAFT",
                    }))
                } : undefined,
                items: {
                    create: (materials || []).map((m: any) => ({
                        type: m.type,
                        customType: m.customType || null,
                        weight: Number(m.weight || 0),
                        unit: m.unit || "kg",
                        isAccurate: m.isAccurate !== false // default true
                    }))
                },
                documents: termsFiles && termsFiles.length > 0 ? {
                    create: termsFiles.map((doc: any) => ({
                        fileName: doc.name || "مستند",
                        fileUrl: doc.url || "", // Currently frontend doesn't upload to S3 yet in page.tsx, assuming URL is passed or blank
                        fileType: doc.type || null,
                        fileSize: doc.size ? Number(doc.size) : null
                    }))
                } : undefined,
                images: images && images.length > 0 ? {
                    create: images.map((img: any, idx: number) => ({
                        imageUrl: img.url || "",
                        order: idx
                    }))
                } : undefined
            },
        });

        return NextResponse.json({
            success: true,
            auction,
            message: "Auction created successfully",
        });
    } catch (error) {
        console.error("Create auction error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An error occurred while creating the auction" },
            { status: 500 }
        );
    }
}
