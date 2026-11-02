import { expect, test } from 'vitest'
import { parseSearchParams } from '@/lib/search-params'

test('defaults', () => expect(parseSearchParams({})).toEqual({ q: '', category: null, type: null, area: null, page: 1 }))
test('parses and drops invalid', () =>
  expect(parseSearchParams({ q: ' cake ', type: 'nonsense', area: 'Beirut', page: '0', category: ['a', 'b'] })).toEqual({
    q: 'cake',
    category: 'a',
    type: null,
    area: 'Beirut',
    page: 1,
  }))
test('page', () => expect(parseSearchParams({ page: '3', type: 'service' }).page).toBe(3))
test('unknown area dropped, q trimmed to 100 chars', () => {
  const r = parseSearchParams({ area: 'Paris', q: 'x'.repeat(200) })
  expect(r.area).toBeNull()
  expect(r.q.length).toBe(100)
})
