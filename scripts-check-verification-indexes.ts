import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe<
    Array<{ indexname: string; indexdef: string }>
  >(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('TraderDocument', 'DriverDocument')
      AND indexname IN (
        'TraderDocument_traderId_createdAt_idx',
        'DriverDocument_driverId_createdAt_idx'
      )
    ORDER BY tablename, indexname;
  `);

  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });