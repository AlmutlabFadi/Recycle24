import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe<
    Array<{ tablename: string; indexname: string; indexdef: string }>
  >(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND (
        (tablename = 'LedgerHold' AND indexname = 'LedgerHold_accountId_status_idx')
        OR
        (tablename = 'JournalLine' AND indexname = 'JournalLine_accountId_createdAt_idx')
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