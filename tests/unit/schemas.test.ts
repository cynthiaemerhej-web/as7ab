import { expect, test } from 'vitest'
import { listingInputSchema, adRequestSchema, adInputSchema, profileInputSchema } from '@/lib/schemas'

const base = {
  title: 'Birthday supplies',
  description: 'Balloons, banners, candles and themed tableware for kids parties.',
  categoryId: 1,
  type: 'goods',
  area: 'Metn',
}

test('valid listing normalises phone and instagram', () => {
  const r = listingInputSchema.parse({ ...base, phone: '03 123 456', instagram: 'https://instagram.com/mia.party/' })
  expect(r.phone).toBe('+9613123456')
  expect(r.instagram).toBe('mia.party')
})
test('instagram handle with @', () => expect(listingInputSchema.parse({ ...base, instagram: '@Mia_Party' }).instagram).toBe('Mia_Party'))
test('short description rejected', () =>
  expect(listingInputSchema.safeParse({ ...base, description: 'too short' }).success).toBe(false))
test('bad area rejected', () => expect(listingInputSchema.safeParse({ ...base, area: 'Paris' }).success).toBe(false))
test('bad phone gives message', () => {
  const r = listingInputSchema.safeParse({ ...base, phone: '12' })
  expect(r.success).toBe(false)
  expect(JSON.stringify(r.error)).toContain('valid Lebanese number')
})
test('empty optional fields become undefined', () => {
  const r = listingInputSchema.parse({ ...base, phone: '', website: '', email: '' })
  expect(r.phone).toBeUndefined()
  expect(r.website).toBeUndefined()
  expect(r.email).toBeUndefined()
})
test('website must be http(s)', () => {
  expect(listingInputSchema.safeParse({ ...base, website: 'ftp://x.com' }).success).toBe(false)
  expect(listingInputSchema.parse({ ...base, website: 'https://x.com' }).website).toBe('https://x.com')
})
test('categoryId coerced from form string', () => expect(listingInputSchema.parse({ ...base, categoryId: '3' }).categoryId).toBe(3))
test('ad request honeypot', () =>
  expect(adRequestSchema.safeParse({ name: 'Ali', email: 'a@b.com', slot: 'sidebar', message: 'hi', website_url: 'spam' }).success).toBe(false))
test('ad request valid', () =>
  expect(adRequestSchema.safeParse({ name: 'Ali', email: 'a@b.com', slot: 'sidebar', message: 'hi', website_url: '' }).success).toBe(true))
test('ad dates ordered', () =>
  expect(adInputSchema.safeParse({ advertiserName: 'Xo Ads', linkUrl: 'https://x.com', slot: 'sidebar', startsAt: '2026-12-10', endsAt: '2026-12-01', isActive: true }).success).toBe(false))
test('ad valid with checkbox string', () =>
  expect(adInputSchema.parse({ advertiserName: 'Xo Ads', linkUrl: 'https://x.com', slot: 'sidebar', startsAt: '2026-12-01', endsAt: '2026-12-10', isActive: 'on' }).isActive).toBe(true))
test('profile', () => expect(profileInputSchema.parse({ displayName: 'Mia', phone: '03123456' }).phone).toBe('+9613123456'))
