'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/supabase/env'
import { safeNextPath } from '@/lib/auth-redirect'

export type LoginState = { ok?: true; error?: string; email?: string }

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(String(formData.get('next') ?? ''))
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`, skipBrowserRedirect: true },
  })
  if (error || !data.url) redirect('/login?error=google')
  redirect(data.url)
}

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = z.email().safeParse(String(formData.get('email') ?? '').trim())
  if (!parsed.success) return { error: 'Enter a valid email address.' }
  const next = safeNextPath(String(formData.get('next') ?? ''))
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  })
  if (error) return { error: 'We could not send the link right now. Please try again in a minute.' }
  return { ok: true, email: parsed.data }
}
