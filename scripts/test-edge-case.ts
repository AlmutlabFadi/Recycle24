
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function testEdgeCase() {
  const userId = "undefined";
  try {
    console.log(`Testing with userId: ${userId}`);
    const [trader, driver] = await Promise.all([
        db.trader.findUnique({
            where: { userId },
        }),
        db.driver.findUnique({
            where: { userId },
        }),
    ]);
    console.log('Result:', { trader, driver });
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await db.$disconnect();
  }
}

testEdgeCase();
