import { expect, test } from 'vitest'
import { zodToFieldErrors } from '@/lib/form-state'
import { listingInputSchema } from '@/lib/schemas'

test('maps first issue per field', () => {
  const r = listingInputSchema.safeParse({ title: 'x', description: 'short', categoryId: 1, type: 'goods', area: 'Beirut' })
  expect(r.success).toBe(false)
  const errors = zodToFieldErrors(r.error!)
  expect(errors).toMatchObject({ title: expect.any(String), description: expect.any(String) })
  expect(Object.keys(errors)).toEqual(['title', 'description'])
})
