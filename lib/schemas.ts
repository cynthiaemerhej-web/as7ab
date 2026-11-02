import { z } from 'zod'
import { AD_SLOTS, LISTING_TYPES } from './constants'
import { AREAS } from './areas'
import { normalizeLebanesePhone } from './phone'

/** Empty strings from HTML forms become undefined. */
const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().trim().max(max).optional())

const phoneField = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (v === undefined) return undefined
      const normalized = normalizeLebanesePhone(v)
      if (!normalized) {
        ctx.addIssue({ code: 'custom', message: 'Enter a valid Lebanese number' })
        return z.NEVER
      }
      return normalized
    }),
)

const INSTAGRAM_HANDLE = /^[A-Za-z0-9._]{1,30}$/
const instagramField = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (v === undefined) return undefined
      let handle = v.trim()
      const m = handle.match(/instagram\.com\/([A-Za-z0-9._]+)/i)
      if (m) handle = m[1]
      handle = handle.replace(/^@/, '')
      if (!INSTAGRAM_HANDLE.test(handle)) {
        ctx.addIssue({ code: 'custom', message: 'Enter an Instagram handle or profile link' })
        return z.NEVER
      }
      return handle
    }),
)

const urlField = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.url({ protocol: /^https?$/, error: 'Enter a full link starting with http:// or https://' }).optional(),
)

const emailField = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.email({ error: 'Enter a valid email address' }).optional(),
)

export const listingInputSchema = z.object({
  title: z.string().trim().min(3, 'Title needs at least 3 characters').max(80, 'Title can be at most 80 characters'),
  description: z
    .string()
    .trim()
    .min(20, 'Tell people a bit more — at least 20 characters')
    .max(2000, 'Description can be at most 2000 characters'),
  categoryId: z.coerce.number().int().positive('Pick a category'),
  type: z.enum(LISTING_TYPES, { error: 'Choose Service or Goods' }),
  area: z.enum(AREAS, { error: 'Pick an area' }),
  phone: phoneField,
  whatsapp: phoneField,
  email: emailField,
  instagram: instagramField,
  website: urlField,
})
export type ListingInput = z.infer<typeof listingInputSchema>

export const profileInputSchema = z.object({
  displayName: z.string().trim().min(2, 'Name needs at least 2 characters').max(60),
  phone: phoneField,
  whatsapp: phoneField,
  contactEmail: emailField,
})
export type ProfileInput = z.infer<typeof profileInputSchema>

export const adRequestSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  business: optionalText(80),
  email: z.email({ error: 'Enter a valid email address' }),
  phone: phoneField,
  slot: z.enum(AD_SLOTS, { error: 'Pick a slot' }),
  message: z.string().trim().max(1000).default(''),
  website_url: z.string().max(0, 'Spam check failed').default(''),
})
export type AdRequestInput = z.infer<typeof adRequestSchema>

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a date')
const checkbox = z.preprocess((v) => v === true || v === 'on' || v === 'true', z.boolean())

export const adInputSchema = z
  .object({
    advertiserName: z.string().trim().min(2).max(80),
    linkUrl: z.url({ protocol: /^https?$/, error: 'Enter a full link starting with http:// or https://' }),
    slot: z.enum(AD_SLOTS),
    startsAt: isoDate,
    endsAt: isoDate,
    isActive: checkbox,
  })
  .refine((a) => a.endsAt >= a.startsAt, { message: 'End date must be on or after the start date', path: ['endsAt'] })
export type AdInput = z.infer<typeof adInputSchema>

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(40),
  icon: z.string().trim().min(1).max(40),
  sortOrder: z.coerce.number().int().min(0).max(1000),
})
export type CategoryInput = z.infer<typeof categoryInputSchema>

export const settingsSchema = z.object({
  tagline: z.string().trim().max(120),
  contact_email: z.email({ error: 'Enter a valid email address' }),
  about_text: z.string().trim().max(5000),
  terms_text: z.string().trim().max(5000),
  announcement_text: z.string().trim().max(200),
  announcement_enabled: checkbox,
})
export type SettingsInput = z.infer<typeof settingsSchema>
