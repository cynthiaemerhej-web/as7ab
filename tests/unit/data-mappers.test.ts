import { expect, test } from 'vitest'
import { toCardData, toDetail, firstPhotoPath } from '@/lib/data/mappers'

const row = {
  id: 'i',
  slug: 's',
  title: 't',
  description: 'd',
  area: 'Beirut',
  type: 'service' as const,
  phone: '+9613123456',
  whatsapp: null,
  email: null,
  instagram: 'mia',
  website: null,
  status: 'approved' as const,
  needs_review: false,
  rejection_reason: null,
  views: 3,
  owner_id: 'o',
  category_id: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  categories: { name: 'Food & Catering', slug: 'food-catering' },
  listing_photos: [
    { storage_path: 'u/l/a.jpg', sort_order: 1 },
    { storage_path: 'u/l/b.jpg', sort_order: 0 },
  ],
}

test('maps row to card with first photo by sort order, null when none', () => {
  expect(toCardData(row, (p) => `https://cdn/${p}`)).toEqual({
    id: 'i',
    slug: 's',
    title: 't',
    area: 'Beirut',
    type: 'service',
    categoryName: 'Food & Catering',
    photoUrl: 'https://cdn/u/l/b.jpg',
  })
  expect(toCardData({ ...row, listing_photos: [] }, (p) => p).photoUrl).toBeNull()
  expect(firstPhotoPath(null)).toBeNull()
})

test('maps row to detail with ordered photos and owner name', () => {
  const d = toDetail(row, 'Mia', (p) => `https://cdn/${p}`)
  expect(d.photos.map((p) => p.url)).toEqual(['https://cdn/u/l/b.jpg', 'https://cdn/u/l/a.jpg'])
  expect(d.photos[0].alt).toBe('t')
  expect(d.ownerName).toBe('Mia')
  expect(d.category).toEqual({ name: 'Food & Catering', slug: 'food-catering' })
  expect(d.contact).toEqual({ phone: '+9613123456', whatsapp: null, email: null, instagram: 'mia', website: null })
})

import { settingsFromRows } from '@/lib/data/settings'
test('settings defaults and parsing', () => {
  const s = settingsFromRows([
    { key: 'announcement_enabled', value: 'true' },
    { key: 'announcement_text', value: 'Eid hours' },
  ])
  expect(s.announcement_enabled).toBe(true)
  expect(s.announcement_text).toBe('Eid hours')
  expect(s.tagline).toBe('Find services and goods from people you know, across Lebanon.')
  expect(settingsFromRows([]).announcement_enabled).toBe(false)
})
