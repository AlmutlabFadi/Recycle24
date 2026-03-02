import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- LATEST USERS ---");
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            id: true,
            name: true,
            userType: true,
            role: true,
            status: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true
        }
    });
    console.table(users);

    console.log("\n--- TRADER KYC RECORDS FOR LATEST USERS ---");
    const traders = await prisma.trader.findMany({
        where: { userId: { in: users.map(u => u.id) } },
        select: {
            userId: true,
            businessName: true,
            verificationStatus: true,
            createdAt: true,
            updatedAt: true
        }
    });
    console.table(traders);

    console.log("\n--- DRIVER KYC RECORDS FOR LATEST USERS ---");
    const drivers = await prisma.driver.findMany({
        where: { userId: { in: users.map(u => u.id) } },
        select: {
            userId: true,
            fullName: true,
            status: true,
            createdAt: true,
            updatedAt: true
        }
    });
    console.table(drivers);
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
