import { expect, test } from 'vitest'
import { SlidingLimiter } from '@/lib/rate-limit'

test('one per minute per key', () => {
  const l = new SlidingLimiter(1, 60_000)
  expect(l.allow('1.1.1.1', 0)).toBe(true)
  expect(l.allow('1.1.1.1', 30_000)).toBe(false)
  expect(l.allow('2.2.2.2', 30_000)).toBe(true)
  expect(l.allow('1.1.1.1', 60_001)).toBe(true)
})

test('window of 3', () => {
  const l = new SlidingLimiter(3, 1000)
  expect([l.allow('k', 0), l.allow('k', 10), l.allow('k', 20), l.allow('k', 30)]).toEqual([true, true, true, false])
  expect(l.allow('k', 1011)).toBe(true)
})
