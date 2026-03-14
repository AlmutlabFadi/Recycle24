const SNIPE_WINDOW_MS = 30 * 1000;
const SNIPE_EXTENSION_MS = 60 * 1000;

export function shouldExtendAuction(endAt: Date, now: Date): boolean {
  return endAt.getTime() - now.getTime() <= SNIPE_WINDOW_MS;
}

export function computeExtendedEndAt(endAt: Date, now: Date): Date {
  if (!shouldExtendAuction(endAt, now)) {
    return endAt;
  }

  const minExtendedEnd = new Date(now.getTime() + SNIPE_EXTENSION_MS);
  return minExtendedEnd.getTime() > endAt.getTime() ? minExtendedEnd : endAt;
}