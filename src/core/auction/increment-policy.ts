export function getMinimumIncrement(currentPrice: number): number {
  const absPrice = Math.abs(currentPrice);
  if (absPrice < 1_000) return 10;
  if (absPrice < 10_000) return 50;
  if (absPrice < 100_000) return 100;
  return 500;
}

export function isValidNextBid(
  currentPrice: number,
  nextBid: number,
  direction: "FORWARD" | "REVERSE"
): { isValid: boolean; requiredBid?: number; message?: string } {
  const increment = getMinimumIncrement(currentPrice);

  if (direction === "FORWARD") {
    const minBid = currentPrice + increment;
    return {
      isValid: nextBid >= minBid,
      requiredBid: minBid,
      message: `العرض يجب أن يكون على الأقل ${minBid}.`,
    };
  } else {
    // REVERSE: next bid must be LOWER than current price by at least the increment
    const maxBid = currentPrice - increment;
    return {
      isValid: nextBid <= maxBid,
      requiredBid: maxBid,
      message: `العرض يجب أن يكون بحد أقصى ${maxBid}.`,
    };
  }
}