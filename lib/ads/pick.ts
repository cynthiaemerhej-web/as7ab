export function pickAd<T>(ads: readonly T[], random: () => number = Math.random): T | null {
  if (ads.length === 0) return null
  const index = Math.min(ads.length - 1, Math.floor(random() * ads.length))
  return ads[index]
}
