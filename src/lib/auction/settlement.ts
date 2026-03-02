import { db } from "@/lib/db";
import { LedgerPostingService } from "@/lib/ledger/service";
import { TransactionType, LedgerAccountSlug, HoldStatus } from "@/lib/ledger/types";

export class AuctionSettlementService {
  /**
   * Finalizes the financial state of an auction when it ends.
   * - Losers: Deposits are released.
   * - Winner: Deposit remains HELD. Commission is charged as debt.
   */
  static async closeAuctionFinancials(auctionId: string) {
    const prisma = await db;

    // 1. Fetch auction and all participants
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        bids: {
          orderBy: { amount: "desc" },
          take: 1
        }
      }
    });

    if (!auction) throw new Error("Auction not found");

    const winningBid = auction.bids[0];
    const winnerId = winningBid?.bidderId;
    const sellerId = auction.sellerId;

    // Fetch seller for role check
    const seller = await prisma.user.findUnique({ where: { id: sellerId } });
    if (!seller) throw new Error("Seller not found");

    // 2. Process each participant
    for (const participant of auction.participants) {
      // Find the open hold for this participant and auction
      const hold = await prisma.ledgerHold.findFirst({
        where: {
          accountId: (await LedgerPostingService.getOrCreateAccount(`USER_${participant.userId}_SYP`, participant.userId)).id,
          referenceType: 'AUCTION',
          referenceId: auctionId,
          status: HoldStatus.OPEN
        }
      });

      if (!hold) continue;

      if (participant.userId !== winnerId) {
        // Participant lost -> Release deposit immediately
        await LedgerPostingService.releaseHold(hold.id);

        // 🔔 Notification: Loser
        const { NotificationService } = await import("@/lib/notifications/service");
        await NotificationService.create({
          userId: participant.userId,
          title: "انتهى المزاد",
          message: `انتهى مزاد "${auction.title}". حظاً أوفر في المرات القادمة. تم تحرير مبلغ التأمين الخاص بك.`,
          type: "INFO",
          link: `/auctions/${auctionId}`,
          metadata: { auctionId }
        });
      } else {
        // Participant won -> Keep hold open for escrow
        console.log(`[Settlement] Winner ${winnerId} hold ${hold.id} remains OPEN until discharge.`);
        
        // ---------------------------------------------------------
        // COMMISSION LOGIC: WINNER (BUYER)
        // ---------------------------------------------------------
        const commissionAmount = winningBid.amount * 0.01;
        const isWinnerGovernment = participant.user.userType === "GOVERNMENT";

        if (commissionAmount > 0) {
          // If Government, we still post but with 0 effect to show exemption
          const effectiveAmount = isWinnerGovernment ? 0 : commissionAmount;

          await LedgerPostingService.postEntry({
            type: TransactionType.PLATFORM_COMMISSION,
            description: isWinnerGovernment 
              ? `إعفاء من عمولة الفوز (دعم حكومي) - القيمة الأصلية: ${commissionAmount.toLocaleString()} ل.س`
              : `عمولة الفوز بالمزاد: ${auction.title}`,
            lines: [
              {
                accountSlug: `USER_${winnerId}_SYP`,
                amount: -effectiveAmount,
                description: isWinnerGovernment ? "إعفاء حكومي (0 ل.س)" : `عمولة فوز: ${auctionId}`,
              },
              {
                accountSlug: LedgerAccountSlug.SYSTEM_FEE_COLLECTION,
                amount: effectiveAmount,
                description: `عمولة من الفائز ${winnerId}`,
              },
            ],
            metadata: { 
              auctionId, 
              winnerId, 
              originalAmount: commissionAmount, 
              isExempt: isWinnerGovernment,
              supportType: "PLATFORM_DONATION" 
            },
          });
        }

        // 🔔 Notification: Winner
        const { NotificationService } = await import("@/lib/notifications/service");
        await NotificationService.create({
          userId: winnerId,
          title: "تهانينا! لقد فزت في المزاد",
          message: `لقد فزت بمزاد "${auction.title}" بمبلغ ${winningBid.amount.toLocaleString()} ل.س. يرجى مراجعة محفظتك لسداد العمولات.`,
          type: "SUCCESS",
          link: `/auctions/${auctionId}`,
          metadata: { auctionId, amount: winningBid.amount }
        });
      }
    }

    // ---------------------------------------------------------
    // COMMISSION LOGIC: SELLER
    // ---------------------------------------------------------
    if (winningBid) {
      const sellerCommission = winningBid.amount * 0.01;
      const isSellerGovernment = seller.userType === "GOVERNMENT";

      if (sellerCommission > 0) {
        const effectiveSellerAmount = isSellerGovernment ? 0 : sellerCommission;

        await LedgerPostingService.postEntry({
          type: TransactionType.PLATFORM_COMMISSION,
          description: isSellerGovernment
            ? `إعفاء من عمولة البيع (دعم حكومي) - القيمة الأصلية: ${sellerCommission.toLocaleString()} ل.س`
            : `عمولة البيع للمزاد: ${auction.title}`,
          lines: [
            {
              accountSlug: `USER_${sellerId}_SYP`,
              amount: -effectiveSellerAmount,
              description: isSellerGovernment ? "إعفاء حكومي (0 ل.س)" : `عمولة بيع: ${auctionId}`,
            },
            {
              accountSlug: LedgerAccountSlug.SYSTEM_FEE_COLLECTION,
              amount: effectiveSellerAmount,
              description: `عمولة من البائع ${sellerId}`,
            },
          ],
          metadata: { 
            auctionId, 
            sellerId, 
            originalAmount: sellerCommission, 
            isExempt: isSellerGovernment,
            supportType: "PLATFORM_DONATION" 
          },
        });
      }
    }

    return { success: true, winnerId };
  }

  /**
   * Released by the Seller once the winner fulfills all conditions (goods removal, full payment).
   * This releases the security deposit back to the winner.
   */
  static async dischargeWinner(auctionId: string, sellerId: string) {
    const prisma = await db;

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { id: true, sellerId: true, winnerId: true }
    });

    if (!auction || auction.sellerId !== sellerId) {
      throw new Error("Unauthorized discharge attempt.");
    }

    if (!auction.winnerId) {
      throw new Error("No winner assigned to this auction.");
    }

    // Find the winner's hold
    const hold = await prisma.ledgerHold.findFirst({
      where: {
        accountId: (await LedgerPostingService.getOrCreateAccount(`USER_${auction.winnerId}_SYP`, auction.winnerId)).id,
        referenceType: 'AUCTION',
        referenceId: auctionId,
        status: HoldStatus.OPEN
      }
    });

    if (hold) {
      await LedgerPostingService.releaseHold(hold.id);
      console.log(`[Settlement] Seller ${sellerId} discharged winner ${auction.winnerId}. Hold ${hold.id} released.`);
      
      // Update participant record to reflect completion
      await prisma.auctionParticipant.update({
        where: {
          auctionId_userId: {
            auctionId,
            userId: auction.winnerId
          }
        },
        data: {
          depositStatus: "RELEASED"
        }
      });

      // 🔔 Notification: Discharge
      const { NotificationService } = await import("@/lib/notifications/service");
      await NotificationService.create({
        userId: auction.winnerId,
        title: "تم منحك براءة ذمة",
        message: `قام البائع بمنحك براءة ذمة لمزاد "${auctionId}". تم تحرير مبلغ التأمين الخاص بك ويمكنك سحبه الآن.`,
        type: "SUCCESS",
        link: "/wallet",
        metadata: { auctionId }
      });
    }

    return { success: true };
  }
}
