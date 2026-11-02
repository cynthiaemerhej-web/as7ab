'use server'

import { headers } from 'next/headers'
import { zodToFieldErrors, type FormState } from '@/lib/form-state'
import { SlidingLimiter } from '@/lib/rate-limit'
import { adRequestSchema } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/server'

const limiter = new SlidingLimiter(1, 60_000)

export async function submitAdRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const obj: Record<string, string> = {}
  formData.forEach((v, k) => {
    if (typeof v === 'string') obj[k] = v
  })
  const parsed = adRequestSchema.safeParse(obj)
  if (!parsed.success) {
    const fieldErrors = zodToFieldErrors(parsed.error)
    if (fieldErrors.website_url) return { ok: true } // honeypot tripped: pretend success, store nothing
    return { fieldErrors, error: 'Please fix the highlighted fields.' }
  }
  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  if (!limiter.allow(ip)) return { error: 'Please wait a minute before sending another request.' }

  const sb = await createClient()
  const { error } = await sb.from('ad_requests').insert({
    name: parsed.data.name,
    business: parsed.data.business ?? null,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    slot: parsed.data.slot,
    message: parsed.data.message,
  })
  if (error) return { error: 'We could not send your request right now. Please email us instead.' }
  return { ok: true }
}
