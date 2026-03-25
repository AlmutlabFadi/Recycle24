// FX ENGINE — SINGLE SOURCE OF TRUTH

export type Currency = "USD" | "SYP";

// ⚠️ يتم تحديثه يدويًا من نشرة البنك المركزي
let MARKET_RATE = 111; // default fallback

export function setMarketRate(rate: number) {
  if (rate <= 0) {
    throw new Error("Invalid market rate");
  }
  MARKET_RATE = rate;
}

export function getMarketRate(): number {
  return MARKET_RATE;
}

// 🔒 سعر التقييم (ثابت)
export function getRiskRate(): number {
  return 111;
}

// 💱 سعر الشراء (المنصة تبيع USD للمستخدم)
export function getBuyRate(): number {
  return MARKET_RATE * 1.02;
}

// 💱 سعر البيع (المنصة تشتري USD من المستخدم)
export function getSellRate(): number {
  return MARKET_RATE * 0.98;
}

// 🔄 تحويل إلى USD لأغراض التقييم فقط
export function normalizeToUSD(amount: number, currency: Currency): number {
  if (currency === "USD") return amount;

  const riskRate = getRiskRate();

  return amount / riskRate;
}