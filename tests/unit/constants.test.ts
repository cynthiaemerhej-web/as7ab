import { expect, test } from 'vitest'
import { AD_SLOTS, LISTING_STATUSES, SITE_NAME, RESULTS_PER_PAGE, INLINE_AD_EVERY } from '@/lib/constants'

test('constants match the spec', () => {
  expect(SITE_NAME).toBe('As7ab')
  expect(AD_SLOTS).toEqual(['home_banner', 'sidebar', 'search_inline', 'listing_bottom'])
  expect(LISTING_STATUSES).toEqual(['pending', 'approved', 'rejected', 'hidden'])
  expect(RESULTS_PER_PAGE).toBe(24)
  expect(INLINE_AD_EVERY).toBe(8)
})
