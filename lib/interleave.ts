export type AdMarker = { ad: true }

/** Insert an ad marker after every `every`-th item, never as a trailing element. */
export function interleaveAds<T>(items: T[], every: number): (T | AdMarker)[] {
  const out: (T | AdMarker)[] = []
  items.forEach((item, i) => {
    out.push(item)
    const n = i + 1
    if (every > 0 && n % every === 0 && n < items.length) out.push({ ad: true })
  })
  return out
}

export function isAdMarker<T>(x: T | AdMarker): x is AdMarker {
  return typeof x === 'object' && x !== null && 'ad' in x && (x as AdMarker).ad === true
}
