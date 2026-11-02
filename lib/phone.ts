/** Lebanese phone helpers. Numbers are stored as E.164: +961 followed by 7 or 8 digits. */

const ARABIC_INDIC = /[٠-٩]/g
const EASTERN_ARABIC_INDIC = /[۰-۹]/g

function toAsciiDigits(input: string): string {
  return input
    .replace(ARABIC_INDIC, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(EASTERN_ARABIC_INDIC, (d) => String(d.charCodeAt(0) - 0x06f0))
}

export function normalizeLebanesePhone(input: string): string | null {
  let digits = toAsciiDigits(input).replace(/[^\d+]/g, '')
  if (digits.startsWith('+961')) digits = digits.slice(4)
  else if (digits.startsWith('00961')) digits = digits.slice(5)
  else if (digits.startsWith('961')) digits = digits.slice(3)
  else if (digits.startsWith('+')) return null
  if (digits.startsWith('0')) digits = digits.slice(1)
  if (!/^[1-9]\d{6,7}$/.test(digits)) return null
  return `+961${digits}`
}

export function whatsappLink(e164: string): string {
  return `https://wa.me/${e164.replace(/\D/g, '')}`
}

export function displayPhone(e164: string): string {
  const rest = e164.replace(/^\+961/, '')
  const head = rest.length === 8 ? rest.slice(0, 2) : rest.slice(0, 1)
  const tail = rest.slice(head.length)
  return `+961 ${head} ${tail.slice(0, 3)} ${tail.slice(3)}`
}
