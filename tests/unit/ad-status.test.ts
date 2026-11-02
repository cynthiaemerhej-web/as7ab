import { expect, test } from 'vitest'
import { adStatus } from '@/lib/ads/status'

const today = '2026-11-02'
test.each([
  [{ is_active: true, starts_at: '2026-11-01', ends_at: '2026-11-30' }, 'live'],
  [{ is_active: true, starts_at: '2026-11-02', ends_at: '2026-11-02' }, 'live'],
  [{ is_active: true, starts_at: '2026-11-03', ends_at: '2026-11-30' }, 'scheduled'],
  [{ is_active: true, starts_at: '2026-10-01', ends_at: '2026-11-01' }, 'ended'],
  [{ is_active: false, starts_at: '2026-11-01', ends_at: '2026-11-30' }, 'paused'],
])('%o → %s', (ad, out) => expect(adStatus(ad, today)).toBe(out))

import { beirutToday } from '@/lib/ads/status'
test('beirutToday returns the Asia/Beirut calendar date', () => {
  const expected = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut' }).format(new Date())
  expect(beirutToday()).toBe(expected)
  // 2026-07-01T22:30Z is already 2 July in Beirut (UTC+3)
  expect(beirutToday(new Date('2026-07-01T22:30:00Z'))).toBe('2026-07-02')
})
