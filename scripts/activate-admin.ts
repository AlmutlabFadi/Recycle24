import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const email = "fadialmutlab@gmail.com";
    const user = await prisma.user.update({
        where: { email },
        data: {
            role: "ADMIN",
            userType: "ADMIN",
            status: "ACTIVE",
            isVerified: true
        }
    });
    console.log(`Updated user ${user.email} to ACTIVE ADMIN`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
