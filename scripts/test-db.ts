
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDb() {
  try {
    console.log('Testing connection...');
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
    
    console.log('Testing trader table...');
    const traderCount = await prisma.trader.count();
    console.log(`Trader count: ${traderCount}`);
    
    console.log('Testing driver table...');
    const driverCount = await prisma.driver.count();
    console.log(`Driver count: ${driverCount}`);
    
    console.log('Everything looks good!');
  } catch (err) {
    console.error('Database test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testDb();
