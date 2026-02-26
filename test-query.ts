import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        const bookingsWithFilter = await prisma.transportBooking.findMany({
            where: { status: 'OPEN' }
        });
        console.log("Filtered Bookings:", bookingsWithFilter.length);
        
        const allBookings = await prisma.transportBooking.findMany();
        console.log("All Bookings count:", allBookings.length);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
