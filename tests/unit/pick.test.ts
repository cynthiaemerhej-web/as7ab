import { expect, test } from 'vitest'
import { pickAd } from '@/lib/ads/pick'

test('empty → null', () => expect(pickAd([])).toBeNull())
test('deterministic with injected random', () => expect(pickAd(['a', 'b', 'c'], () => 0.99)).toBe('c'))
test('first with random 0', () => expect(pickAd(['a', 'b', 'c'], () => 0)).toBe('a'))
