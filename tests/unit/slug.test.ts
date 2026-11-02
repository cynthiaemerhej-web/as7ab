import { expect, test } from 'vitest'
import { slugify, makeListingSlug } from '@/lib/slug'

test('slugify', () => expect(slugify("  Mia's Birthday  Supplies & Décor! ")).toBe('mia-s-birthday-supplies-decor'))
test('slug max 60', () => expect(slugify('a'.repeat(100)).length).toBe(60))
test('emoji/Arabic-only title still valid', () =>
  expect(makeListingSlug('🎂🎈 حلويات', '3f2a9c1e-1111-2222-3333-444444444444')).toBe('listing-3f2a9c'))
test('listing slug', () =>
  expect(makeListingSlug('Cake Lady', '3f2a9c1e-1111-2222-3333-444444444444')).toBe('cake-lady-3f2a9c'))
