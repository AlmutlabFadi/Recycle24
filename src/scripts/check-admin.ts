import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- ADMIN USER ---");
    const user = await prisma.user.findUnique({
        where: { email: 'admin@recycle24.com' },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
        }
    });

    if (user) {
        console.table([user]);
    } else {
        console.log("Admin user not found in the database. Searching for any ADMIN role users:");
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: {
                id: true,
                email: true,
                phone: true,
                name: true,
                role: true,
            }
        });
        console.table(admins);
    }
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
