import type { Metadata } from 'next'
import { requireMember } from '@/lib/auth'
import { getProfile } from '@/lib/data/profiles'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from './ProfileForm'

export const metadata: Metadata = { title: 'My profile' }
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const me = await requireMember('/dashboard/profile')
  const sb = await createClient()
  const profile = await getProfile(sb, me.id)
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">My profile</h1>
      <div className="mt-6">
        <ProfileForm
          defaults={{
            displayName: profile?.display_name ?? me.display_name,
            phone: profile?.phone ?? '',
            whatsapp: profile?.whatsapp ?? '',
            contactEmail: profile?.contact_email ?? '',
            accountEmail: me.email,
          }}
        />
      </div>
    </main>
  )
}
