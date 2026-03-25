import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Staff Access Synchronization...");

    // 1. Find all users who have entries in the UserRole table
    const staffUsers = await prisma.user.findMany({
        where: {
            userRoles: {
                some: {}
            }
        },
        select: {
            id: true,
            name: true,
            email: true,
            userType: true,
            adminAccessEnabled: true
        }
    });

    console.log(`🔍 Found ${staffUsers.length} potential staff members.`);

    let updatedCount = 0;

    for (const user of staffUsers) {
        if (user.userType !== "ADMIN" || user.adminAccessEnabled !== true) {
            console.log(`🛠️ Updating user: ${user.name} (${user.email || 'No Email'})`);
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    userType: "ADMIN",
                    adminAccessEnabled: true,
                    status: "ACTIVE" // Ensure they are active too
                }
            });
            updatedCount++;
        } else {
            console.log(`✅ User already synced: ${user.name}`);
        }
    }

    console.log(`✨ Synchronization complete. Updated ${updatedCount} users.`);
}

main()
    .catch((e) => {
        console.error("❌ Sync failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
