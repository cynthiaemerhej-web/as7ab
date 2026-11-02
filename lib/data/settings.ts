import { SITE_TAGLINE } from '@/lib/constants'
import type { Sb } from './photos'

export type SiteSettings = {
  tagline: string
  contact_email: string
  about_text: string
  terms_text: string
  announcement_text: string
  announcement_enabled: boolean
}

export const SETTINGS_KEYS = ['tagline', 'contact_email', 'about_text', 'terms_text', 'announcement_text', 'announcement_enabled'] as const

export function settingsFromRows(rows: { key: string; value: string }[]): SiteSettings {
  const map = new Map(rows.map((r) => [r.key, r.value]))
  return {
    tagline: map.get('tagline') || SITE_TAGLINE,
    contact_email: map.get('contact_email') || process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@example.com',
    about_text: map.get('about_text') ?? '',
    terms_text: map.get('terms_text') ?? '',
    announcement_text: map.get('announcement_text') ?? '',
    announcement_enabled: map.get('announcement_enabled') === 'true',
  }
}

export async function getSettings(sb: Sb): Promise<SiteSettings> {
  const { data } = await sb.from('site_settings').select('key, value')
  return settingsFromRows(data ?? [])
}
