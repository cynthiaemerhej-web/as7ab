export type AdStatus = 'live' | 'scheduled' | 'ended' | 'paused'

export function adStatus(ad: { is_active: boolean; starts_at: string; ends_at: string }, today: string): AdStatus {
  if (!ad.is_active) return 'paused'
  if (ad.starts_at > today) return 'scheduled'
  if (ad.ends_at < today) return 'ended'
  return 'live'
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
