import { db } from "@/lib/db";

export async function recalculateUserTrustScore(userId: string) {
    // Determine if user is TRADER or DRIVER
    const trader = await db.trader.findUnique({ where: { userId } });
    const driver = await db.driver.findUnique({ where: { userId } });

    // Fetch all reviews received by this user
    const reviews = await db.review.findMany({
        where: { revieweeId: userId },
    });

    const totalReviews = reviews.length;
    
    // Default score if no reviews
    let trustScore = 0.0;
    
    if (totalReviews > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        trustScore = Number((totalRating / totalReviews).toFixed(1)); // Calculate average and keep 1 decimal
    }

    // Success Rate Calculation
    // Total deals where user is seller or driver vs successful deals
    const allDeals = await db.deal.findMany({
        where: { sellerId: userId },
    });
    
    // A deal is successful if it's not canceled or disputed (currently we only have PENDING, COMPLETED, DISCHARGED assumed)
    // For now, let's say "COMPLETED" or "DISCHARGED" count as success. If it's PENDING it doesn't count against them.
    // If it's CANCELED or FAILED, it's a failure.
    // Let's implement a simple logic: success is Deals that reached COMPLETED status over all Deals that are NOT PENDING.
    const resolvedDeals = allDeals.filter(d => d.status !== "PENDING");
    const successfulDeals = resolvedDeals.filter(d => d.status === "COMPLETED" || d.status === "DISCHARGED");

    let successRate = 100.0;
    if (resolvedDeals.length > 0) {
        successRate = Number(((successfulDeals.length / resolvedDeals.length) * 100).toFixed(1));
    }

    // Update Trader if exists
    if (trader) {
        await db.trader.update({
            where: { userId },
            data: {
                trustScore,
                totalReviews,
                successRate,
            }
        });
    }

    // Update Driver if exists
    if (driver) {
        await db.driver.update({
            where: { userId },
            data: {
                trustScore,
                totalReviews,
                successRate,
            }
        });
    }

    return { trustScore, totalReviews, successRate };
}
