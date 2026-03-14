export function getMinimumIncrement(currentPrice: number): number {
  if (currentPrice < 1_000) return 10;
  if (currentPrice < 10_000) return 50;
  if (currentPrice < 100_000) return 100;
  return 500;
}

export function getMinimumAllowedBid(currentPrice: number): number {
  return currentPrice + getMinimumIncrement(currentPrice);
}