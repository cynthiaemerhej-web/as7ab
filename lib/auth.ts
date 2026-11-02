import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import { createClient } from './supabase/server'

export { decideRedirect, safeNextPath } from './auth-redirect'

export type CurrentProfile = {
  id: string
  email: string
  display_name: string
  role: 'member' | 'admin'
}

/** The signed-in user's profile, or null. Deduplicated per request. */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('id, display_name, role').eq('id', user.id).maybeSingle()
  if (!profile) return null
  return { id: profile.id, email: user.email ?? '', display_name: profile.display_name, role: profile.role }
})

/** Redirects to /login when signed out. `next` is where to return afterwards. */
export async function requireMember(next = '/dashboard'): Promise<CurrentProfile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect(`/login?next=${encodeURIComponent(next)}`)
  return profile
}

/** 404s for non-admins so the back office is invisible to everyone else. */
export async function requireAdmin(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') notFound()
  return profile
}
