import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Testing Prisma Connection...");
    try {
        const result = await prisma.transportBooking.findFirst();
        console.log("Connection successful. Records:", result);
    } catch (error) {
        console.error("Prisma Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
