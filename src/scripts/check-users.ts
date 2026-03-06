import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- USERS (CLIENT, GOVERNMENT) ---");
    const users = await prisma.user.findMany({
        where: {
            userType: { in: ['CLIENT', 'GOVERNMENT'] }
        },
        select: {
            id: true,
            name: true,
            userType: true,
            role: true,
            status: true,
            isVerified: true
        }
    });

    console.table(users);

    console.log("\n--- TRADER KYC ACCOUNTS ---");
    const traders = await prisma.trader.findMany({
        select: {
            userId: true,
            businessName: true,
            verificationStatus: true,
            user: {
                select: { userType: true, role: true }
            }
        }
    });

    console.table(traders.map(t => ({
        ...t,
        userType: t.user?.userType,
        userRole: t.user?.role
    })));

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
