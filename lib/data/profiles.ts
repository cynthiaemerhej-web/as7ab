import type { ProfileInput } from '@/lib/schemas'
import type { ProfileRow } from '@/lib/supabase/types'
import type { Sb } from './photos'

export async function getProfile(sb: Sb, id: string): Promise<ProfileRow | null> {
  const { data, error } = await sb.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(sb: Sb, id: string, input: ProfileInput): Promise<void> {
  const { error } = await sb
    .from('profiles')
    .update({
      display_name: input.displayName,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      contact_email: input.contactEmail ?? null,
    })
    .eq('id', id)
  if (error) throw error
}
