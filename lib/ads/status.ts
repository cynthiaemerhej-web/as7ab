export type AdStatus = 'live' | 'scheduled' | 'ended' | 'paused'

export function adStatus(ad: { is_active: boolean; starts_at: string; ends_at: string }, today: string): AdStatus {
  if (!ad.is_active) return 'paused'
  if (ad.starts_at > today) return 'scheduled'
  if (ad.ends_at < today) return 'ended'
  return 'live'
}

/** The calendar date in Lebanon (YYYY-MM-DD). Matches `beirut_today()` in the database. */
export function beirutToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** @deprecated use beirutToday */
export const todayIso = beirutToday
