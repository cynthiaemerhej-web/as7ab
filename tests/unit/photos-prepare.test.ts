import { expect, test } from 'vitest'
import { validatePhotoFile, photoStoragePath, isOwnedPhotoPath } from '@/lib/photos/prepare'

test('rejects wrong type and oversize', () => {
  expect(validatePhotoFile({ type: 'image/gif', size: 10 })).toMatch(/JPG, PNG or WebP/)
  expect(validatePhotoFile({ type: 'image/png', size: 5 * 1024 * 1024 + 1 })).toMatch(/5 MB/)
  expect(validatePhotoFile({ type: 'image/webp', size: 1000 })).toBeNull()
})

test('path is under user and listing', () => {
  expect(photoStoragePath('u1', 'l1')).toMatch(/^u1\/l1\/[0-9a-f-]{36}\.jpg$/)
})

test('ownership check on paths', () => {
  expect(isOwnedPhotoPath('u1/l1/abc.jpg', 'u1', 'l1')).toBe(true)
  expect(isOwnedPhotoPath('u2/l1/abc.jpg', 'u1', 'l1')).toBe(false)
  expect(isOwnedPhotoPath('u1/l2/abc.jpg', 'u1', 'l1')).toBe(false)
  expect(isOwnedPhotoPath('u1/l1/../x.jpg', 'u1', 'l1')).toBe(false)
})
