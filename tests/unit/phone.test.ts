import { expect, test } from 'vitest'
import { normalizeLebanesePhone as n, whatsappLink, displayPhone } from '@/lib/phone'

test.each([
  ['03 123 456', '+9613123456'],
  ['71123456', '+96171123456'],
  ['+961 3 123 456', '+9613123456'],
  ['00961 71 123 456', '+96171123456'],
  ['+961 03 123 456', '+9613123456'], // zero after country code
  ['٠٣١٢٣٤٥٦', '+9613123456'], // Arabic-Indic digits
  ['01 234 567', '+9611234567'],
  ['(03) 123-456', '+9613123456'],
])('normalises %s', (input, out) => expect(n(input)).toBe(out))

test.each(['', '12', '+1 212 555 0100', 'abc', '961', '+9613', '03 123 4567 8'])('rejects %s', (x) =>
  expect(n(x)).toBeNull(),
)

test('whatsapp link', () => expect(whatsappLink('+9613123456')).toBe('https://wa.me/9613123456'))

test('display', () => {
  expect(displayPhone('+9613123456')).toBe('+961 3 123 456')
  expect(displayPhone('+96171123456')).toBe('+961 71 123 456')
})
