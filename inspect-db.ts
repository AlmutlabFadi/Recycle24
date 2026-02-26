import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        const bookings = await prisma.transportBooking.findMany({});
        console.log("All Bookings in DB:", JSON.stringify(bookings, null, 2));
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
