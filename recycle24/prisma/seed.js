/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const traderId = 'cmlu20bho0000vfjlmxqlj87t';
  const buyerId = 'cmlu3pttt0001vfjlcce8fj9o';

  const now = new Date();
  
  const liveEndsAt = new Date(now);
  liveEndsAt.setHours(liveEndsAt.getHours() + 4);

  const scheduledAt = new Date(now);
  scheduledAt.setHours(scheduledAt.getHours() + 24);

  const endedAt = new Date(now);
  endedAt.setHours(endedAt.getHours() - 2);

  const auctions = [
    {
      id: 'auction_live_1',
      sellerId: traderId,
      title: 'طن حديد HMS - درجة أولى',
      category: 'IRON',
      weight: 1000,
      weightUnit: 'KG',
      location: 'حلب - منطقة الشيخ نجار',
      startingBid: 15000000,
      buyNowPrice: 20000000,
      duration: 4,
      status: 'LIVE',
      startedAt: now,
      endsAt: liveEndsAt,
    },
    {
      id: 'auction_live_2',
      sellerId: traderId,
      title: 'نحاس أسلاك نظيف - 500 كغ',
      category: 'COPPER',
      weight: 500,
      weightUnit: 'KG',
      location: 'دمشق - منطقة البحصة',
      startingBid: 8500000,
      duration: 6,
      status: 'LIVE',
      startedAt: now,
      endsAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
    },
    {
      id: 'auction_scheduled_1',
      sellerId: traderId,
      title: 'ألمنيوم قطع نظيفة - 800 كغ',
      category: 'ALUMINUM',
      weight: 800,
      weightUnit: 'KG',
      location: 'حمص - المنطقة الصناعية',
      startingBid: 10000000,
      duration: 24,
      status: 'SCHEDULED',
      scheduledAt: scheduledAt,
      endsAt: new Date(scheduledAt.getTime() + 24 * 60 * 60 * 1000),
    },
    {
      id: 'auction_ended_1',
      sellerId: traderId,
      title: 'بلاستيك PET - طن',
      category: 'PLASTIC',
      weight: 1000,
      weightUnit: 'KG',
      location: 'اللاذقية - المنطقة الصناعية',
      startingBid: 3000000,
      finalPrice: 4500000,
      duration: 24,
      status: 'ENDED',
      winnerId: buyerId,
      startedAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
      endsAt: endedAt,
    },
  ];

  for (const auction of auctions) {
    await prisma.auction.upsert({
      where: { id: auction.id },
      update: auction,
      create: auction,
    });
  }

  const bids = [
    { id: 'bid_1', auctionId: 'auction_live_1', bidderId: buyerId, amount: 16000000 },
    { id: 'bid_2', auctionId: 'auction_live_1', bidderId: buyerId, amount: 17000000 },
    { id: 'bid_3', auctionId: 'auction_live_1', bidderId: buyerId, amount: 18500000 },
    { id: 'bid_4', auctionId: 'auction_live_2', bidderId: buyerId, amount: 9000000 },
    { id: 'bid_5', auctionId: 'auction_ended_1', bidderId: buyerId, amount: 4500000 },
  ];

  for (const bid of bids) {
    await prisma.bid.upsert({
      where: { id: bid.id },
      update: bid,
      create: bid,
    });
  }

  await prisma.wallet.upsert({
    where: { userId: traderId },
    update: { balanceSYP: 8300000, balanceUSD: 0 },
    create: { userId: traderId, balanceSYP: 8300000, balanceUSD: 0 },
  });

  await prisma.wallet.upsert({
    where: { userId: buyerId },
    update: { balanceSYP: 50000000, balanceUSD: 0 },
    create: { userId: buyerId, balanceSYP: 50000000, balanceUSD: 0 },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
