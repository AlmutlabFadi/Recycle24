import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@recycle24.com';
    const passwordText = 'Admin@2026';
    const hashedPassword = await hash(passwordText, 10);

    console.log(`Upserting admin user: ${email}...`);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
            isVerified: true,
            name: 'Admin User',
            userType: 'ADMIN' as any, // Depending on enum values
        },
        create: {
            email,
            password: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
            isVerified: true,
            name: 'Admin User',
            userType: 'ADMIN' as any,
        }
    });

    console.log("Admin user created/updated successfully:");
    console.table([admin]);
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
