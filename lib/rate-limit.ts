/**
 * In-memory sliding-window limiter. Lives per server instance, so on
 * serverless hosting it is a soft limit; the honeypot field does the rest.
 */
export class SlidingLimiter {
  private hits = new Map<string, number[]>()

  constructor(
    private readonly maxPerWindow: number,
    private readonly windowMs: number,
  ) {}

  allow(key: string, now: number = Date.now()): boolean {
    const cutoff = now - this.windowMs
    const recent = (this.hits.get(key) ?? []).filter((t) => t > cutoff)
    if (recent.length >= this.maxPerWindow) {
      this.hits.set(key, recent)
      return false
    }
    recent.push(now)
    this.hits.set(key, recent)
    if (this.hits.size > 5000) this.sweep(cutoff)
    return true
  }

  private sweep(cutoff: number) {
    for (const [k, times] of this.hits) {
      const kept = times.filter((t) => t > cutoff)
      if (kept.length === 0) this.hits.delete(k)
      else this.hits.set(k, kept)
    }
  }
}
