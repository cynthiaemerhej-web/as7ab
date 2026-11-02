import { expect, test } from 'vitest'
import { interleaveAds } from '@/lib/interleave'

test('marker after every 8th, never trailing', () => {
  const out = interleaveAds(Array.from({ length: 17 }, (_, i) => i), 8)
  expect(out.length).toBe(19)
  expect(out[8]).toEqual({ ad: true })
  expect(out[17]).toEqual({ ad: true })
  expect(out[18]).toBe(16)
})
test('no trailing marker when exact multiple', () => expect(interleaveAds([1, 2, 3, 4, 5, 6, 7, 8], 8).length).toBe(8))
test('empty stays empty', () => expect(interleaveAds([], 8)).toEqual([]))
