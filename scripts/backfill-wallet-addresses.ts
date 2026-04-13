import { PrismaClient } from "@prisma/client";
import { buildWalletAddressPair } from "../src/lib/wallet/address";

const prisma = new PrismaClient();

async function main() {
  const wallets = await prisma.wallet.findMany({
    select: {
      id: true,
      userId: true,
      walletAddressSYP: true,
      walletAddressUSD: true,
    },
  });

  let updated = 0;

  for (const wallet of wallets) {
    const nextAddresses = buildWalletAddressPair(wallet.userId);

    const needsUpdate =
      wallet.walletAddressSYP !== nextAddresses.walletAddressSYP ||
      wallet.walletAddressUSD !== nextAddresses.walletAddressUSD;

    if (!needsUpdate) {
      continue;
    }

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        walletAddressSYP: nextAddresses.walletAddressSYP,
        walletAddressUSD: nextAddresses.walletAddressUSD,
      },
    });

    updated += 1;
    console.log(`UPDATED ${wallet.userId}`);
  }

  console.log(`DONE. Updated wallets: ${updated}`);
}

main()
  .catch((error) => {
    console.error("BACKFILL_FAILED", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });