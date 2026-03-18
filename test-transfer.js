const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.transferRequest.findMany({ take: 1 });
    console.log("SUCCESS:", res.length, "items");
  } catch (err) {
    console.log("ERROR:", err.message);
    console.log("CODE:", err.code);
  } finally {
    await prisma.$disconnect();
  }
}
main();
