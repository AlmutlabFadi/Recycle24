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

        await validateAuctionData(db, body, sellerId);

        const {
            title,
            material,
            weight,
            startingPrice,
            buyNowPrice,
            governorate,
            address,
            startDate,
            endDate,
        } = body;

        const endD = new Date(endDate);
        const startD = startDate ? new Date(startDate) : new Date();
        const durationHours = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60)));

        const auction = await db.auction.create({
            data: {
                sellerId,
                title,
                category: material,
                weight: Number(weight),
                startingBid: Number(startingPrice),
                buyNowPrice: buyNowPrice ? Number(buyNowPrice) : null,
                location: governorate && address ? `${governorate}, ${address}` : (governorate || address || "غير محدد"),
                duration: durationHours,
                scheduledAt: startD,
                endsAt: endD,
                status: "LIVE",
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