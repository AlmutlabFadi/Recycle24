
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function findUser() {
  const user = await prisma.user.findFirst();
  console.log(JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}
findUser();
