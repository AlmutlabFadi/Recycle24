ALTER TABLE "Wallet"
ADD COLUMN IF NOT EXISTS "walletAddressSYP" TEXT,
ADD COLUMN IF NOT EXISTS "walletAddressUSD" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_walletAddressSYP_key"
ON "Wallet" ("walletAddressSYP");

CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_walletAddressUSD_key"
ON "Wallet" ("walletAddressUSD");